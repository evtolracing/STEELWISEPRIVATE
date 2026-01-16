# 10 - COMMODITY PRICING MODULE

## Overview
Live commodity price feeds, pricing calculations, and margin management.

## Data Sources
| Source | Products | Update Frequency |
|--------|----------|------------------|
| LME | Aluminum, Zinc, Nickel | Real-time |
| CME/COMEX | Steel futures, Copper | Real-time |
| CRU | HRC, CRC, HDG indexes | Daily |
| AMM | Scrap, Prime, Busheling | Weekly |

## Pricing Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│ COMMODITY PRICING                          Updated: 10:45 AM   │
├─────────────────────────────────────────────────────────────────┤
│ INDEX          │ CURRENT  │ CHANGE  │ 30-DAY  │ TREND          │
│ HRC Midwest    │ $680/ton │ +$12    │ +2.8%   │ ████████░░ ↑   │
│ CRC Midwest    │ $820/ton │ +$8     │ +1.5%   │ ██████░░░░ ↑   │
│ HDG            │ $920/ton │ -$5     │ -0.5%   │ ███████░░░ ↓   │
│ #1 Busheling   │ $420/GT  │ +$15    │ +4.2%   │ █████████░ ↑   │
│ Prime Scrap    │ $480/GT  │ +$10    │ +3.1%   │ ████████░░ ↑   │
└─────────────────────────────────────────────────────────────────┘
```

## Pricing Formula
```
SELL PRICE = BASE INDEX + GRADE ADDER + SIZE ADDER + PROCESSING + MARGIN
```

## API Endpoints
```
GET  /api/v1/pricing/indexes              # Current prices
GET  /api/v1/pricing/indexes/{id}/history # Historical
POST /api/v1/pricing/calculate            # Price calculation
GET  /api/v1/pricing/rules                # Pricing rules
```
