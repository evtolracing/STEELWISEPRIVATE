# 13 - ANALYTICS & DASHBOARDS MODULE

## Overview
KPIs, operational dashboards, forecasting, and business intelligence.

## Executive Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│ EXECUTIVE DASHBOARD                        January 2026        │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐│
│ │ REVENUE MTD  │ │ MARGIN MTD   │ │ TONS SHIPPED │ │ ORDERS   ││
│ │ $2.4M        │ │ 16.2%        │ │ 4,250 tons   │ │ 142      ││
│ │ ↑ 8% vs LY   │ │ ↑ 0.5% vs LY │ │ ↑ 12% vs LY  │ │ ↑ 5%     ││
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘│
├─────────────────────────────────────────────────────────────────┤
│ REVENUE TREND                    │ INVENTORY VALUE             │
│ ████                             │ $4.2M Total                  │
│ ████████                         │ HR: $1.8M | CR: $1.2M       │
│ ████████████                     │ Galv: $800K | Plate: $400K  │
│ ██████████████                   │                              │
│ J  F  M  A  M  J                 │ Turns: 4.2x (Target: 5.0x)  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Metrics
| KPI | Definition | Target |
|-----|------------|--------|
| Inventory Turns | COGS / Avg Inventory | 5.0x |
| On-Time Delivery | Shipped by promised date | 95% |
| Quote Win Rate | Orders / Quotes | 35% |
| Gross Margin | (Revenue - COGS) / Revenue | 16% |
| Days Sales Outstanding | AR / Daily Sales | <35 days |
| Quality Hold Rate | Holds / Receipts | <2% |

## Report Library
- Daily Shipping Report
- Weekly Sales Summary
- Monthly P&L by Product
- Inventory Aging
- Customer Profitability
- Slow Moving Stock

## API Endpoints
```
GET  /api/v1/analytics/dashboard
GET  /api/v1/analytics/kpis
GET  /api/v1/reports/{report_id}
POST /api/v1/reports/{report_id}/schedule
```
