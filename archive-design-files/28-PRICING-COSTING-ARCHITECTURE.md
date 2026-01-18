# Phase 11: Pricing & Costing Architecture

**Document Version:** 1.0  
**Date:** January 17, 2026  
**Status:** Pricing Operations Specification

---

## 1. EXECUTIVE SUMMARY

This document defines the comprehensive pricing and costing architecture for SteelWise's multi-division service center platform. It covers pricing strategies for three distinct business segments—Metals (Steel/Aluminum), Plastics, and Industrial Supplies—each with unique market dynamics and pricing requirements.

### Core Pricing Challenges

| Division | Primary Challenge | Pricing Volatility | Margin Sensitivity |
|----------|------------------|-------------------|-------------------|
| **Steel** | Commodity fluctuation, mill extras, processing complexity | High (daily/weekly) | Medium (10-25%) |
| **Aluminum** | LME indexing, alloy premiums, aerospace specs | Very High (daily) | High (15-35%) |
| **Plastics** | Resin pricing, form factors, specification variety | Medium (weekly) | Medium (12-28%) |
| **Supplies** | Catalog management, vendor costs, volume breaks | Low (monthly) | Low-Medium (20-45%) |

### Design Principles

1. **Market Responsiveness** - Prices reflect current commodity markets
2. **Margin Protection** - Floor pricing prevents unprofitable sales
3. **Customer Flexibility** - Contract and negotiated pricing supported
4. **Processing Accuracy** - True cost capture for value-add services
5. **Auditability** - Complete price derivation trail

---

## 2. PRICING MODEL OVERVIEW

### 2.1 Price Calculation Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PRICE CALCULATION HIERARCHY                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  STEP 1: BASE PRICE DETERMINATION                                               │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │   Check Price Sources (in priority order):                              │   │
│  │                                                                         │   │
│  │   1. CONTRACT PRICE                                                     │   │
│  │      └── Customer-specific fixed or formula price                       │   │
│  │          └── If found and valid → Use contract price                   │   │
│  │                                                                         │   │
│  │   2. CUSTOMER PRICE LIST                                                │   │
│  │      └── Customer-specific price list                                   │   │
│  │          └── If found → Use customer list price                        │   │
│  │                                                                         │   │
│  │   3. PRICE TIER                                                         │   │
│  │      └── Customer's pricing tier (Gold, Silver, Bronze)                │   │
│  │          └── If tier exists → Apply tier multiplier to base            │   │
│  │                                                                         │   │
│  │   4. COMMODITY + MARGIN                                                 │   │
│  │      └── Current market price + standard markup                         │   │
│  │          └── Default calculation method                                 │   │
│  │                                                                         │   │
│  │   5. CATALOG PRICE                                                      │   │
│  │      └── Published list price (Supplies division)                       │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  STEP 2: ADDERS & ADJUSTMENTS                                                   │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │   + Mill Extras (grade, width, length, finish)                          │   │
│  │   + Processing Charges (cutting, slitting, etc.)                        │   │
│  │   + Certification Charges (MTR, CoC, DFARS)                             │   │
│  │   + Packaging Charges (crating, banding, wrapping)                      │   │
│  │   + Freight/Delivery (if included)                                      │   │
│  │   + Rush/Expedite Fees                                                  │   │
│  │   - Volume Discounts                                                    │   │
│  │   - Promotional Discounts                                               │   │
│  │   - Early Payment Discounts                                             │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  STEP 3: MARGIN VALIDATION                                                      │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │   Calculate: Margin % = (Sell Price - Total Cost) / Sell Price         │   │
│  │                                                                         │   │
│  │   If Margin < Floor:                                                    │   │
│  │   ├── WARNING: Display margin warning                                   │   │
│  │   ├── SOFT BLOCK: Require override approval                            │   │
│  │   └── HARD BLOCK: Reject price (below minimum)                         │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  STEP 4: FINAL PRICE                                                            │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │   Final Price = Base Price                                              │   │
│  │                 + Adders (processing, certs, packaging)                 │   │
│  │                 + Freight (if applicable)                               │   │
│  │                 - Discounts                                             │   │
│  │                 × Tax Rate (if taxable)                                 │   │
│  │                                                                         │   │
│  │   Store: Price derivation trail for audit                               │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Price Source Priority Matrix

| Priority | Source | Metals | Plastics | Supplies | Valid Period |
|:--------:|--------|:------:|:--------:|:--------:|--------------|
| 1 | Contract (Fixed) | ✓ | ✓ | ✓ | Contract dates |
| 2 | Contract (Formula) | ✓ | ✓ | ○ | Contract dates |
| 3 | Customer Price List | ✓ | ✓ | ✓ | Until updated |
| 4 | Customer Tier | ✓ | ✓ | ✓ | Until changed |
| 5 | Commodity + Margin | ✓ | ✓ | ○ | Real-time |
| 6 | Catalog/List Price | ○ | ○ | ✓ | Until updated |

---

## 3. METALS PRICING MODEL (STEEL & ALUMINUM)

### 3.1 Base Metal Price Components

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      METALS PRICING COMPONENTS                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  COMPONENT 1: COMMODITY BASE                                                    │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  STEEL:                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ CRU Index (Hot Rolled Coil)          $XXX.XX / ton (benchmark)          │   │
│  │ + Form Premium (Plate, Sheet, Bar)   $XX.XX / cwt                       │   │
│  │ + Grade Premium (A36, 4140, etc.)    $XX.XX / cwt                       │   │
│  │ + Size Extra (gauge, width, length)  $XX.XX / cwt                       │   │
│  │ = Mill Base Price                    $XX.XX / cwt                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ALUMINUM:                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ LME Cash Price                       $X,XXX.XX / metric ton             │   │
│  │ + Midwest Premium                    $X.XX / lb                          │   │
│  │ + Alloy Adder (6061, 7075, etc.)    $X.XX / lb                          │   │
│  │ + Temper Adder (T6, T651, etc.)     $X.XX / lb                          │   │
│  │ + Form Premium (plate, bar, tube)    $X.XX / lb                          │   │
│  │ = Base Aluminum Price                $X.XX / lb                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  COMPONENT 2: SERVICE CENTER MARKUP                                             │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Product Category          │ Target Margin │ Min Margin │ Max Discount  │   │
│  │ ─────────────────────────│───────────────│────────────│─────────────  │   │
│  │ Carbon Flat Rolled       │    18%        │    8%      │    15%        │   │
│  │ Carbon Plate             │    22%        │   10%      │    18%        │   │
│  │ Carbon Bar/Structural    │    20%        │   10%      │    15%        │   │
│  │ Stainless Flat           │    25%        │   12%      │    18%        │   │
│  │ Stainless Bar            │    28%        │   15%      │    20%        │   │
│  │ Aluminum Sheet/Plate     │    22%        │   10%      │    15%        │   │
│  │ Aluminum Bar/Tube        │    25%        │   12%      │    18%        │   │
│  │ Specialty Alloys         │    30%        │   18%      │    20%        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  COMPONENT 3: MILL EXTRAS                                                       │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  Mill extras are adders for non-standard specifications:                        │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Extra Type              │ Trigger                    │ Typical Adder   │   │
│  │ ────────────────────────│────────────────────────────│───────────────  │   │
│  │ Gauge Extra             │ < 0.075" or > 0.500"       │ $0.50-2.00/cwt │   │
│  │ Width Extra             │ > 72" wide                  │ $1.00-3.00/cwt │   │
│  │ Length Extra            │ > 240" long                 │ $0.75-2.50/cwt │   │
│  │ Alloy Extra             │ Non-standard chemistry      │ $1.00-5.00/cwt │   │
│  │ Surface Extra           │ Polished, coated, etc.      │ $2.00-8.00/cwt │   │
│  │ Testing Extra           │ UT, impact, etc.            │ $0.50-3.00/cwt │   │
│  │ Domestic Melt           │ USA-only origin             │ $1.00-4.00/cwt │   │
│  │ Cut-to-Length           │ Non-stock lengths           │ $0.25-1.00/cwt │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Commodity Index Integration

```typescript
interface CommodityIndex {
  indexCode: string;        // 'CRU_HRC', 'LME_AL', 'MW_PREM'
  indexName: string;
  source: string;           // 'CRU', 'LME', 'AMM', 'Platts'
  unit: string;             // 'USD/ton', 'USD/lb', 'USD/mt'
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  lastUpdate: Date;
  currentValue: number;
  previousValue: number;
  changePercent: number;
}

interface CommodityPriceHistory {
  indexCode: string;
  effectiveDate: Date;
  value: number;
  source: string;           // Manual, API, Import
}

// Price lookups use effective date matching
function getCommodityPrice(
  indexCode: string,
  asOfDate: Date
): number {
  // Get most recent price on or before asOfDate
  return commodityPrices
    .filter(p => p.indexCode === indexCode && p.effectiveDate <= asOfDate)
    .sort((a, b) => b.effectiveDate - a.effectiveDate)[0]?.value;
}
```

### 3.3 Steel Price Formula Example

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    STEEL PRICING EXAMPLE                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Product: A36 Hot Rolled Plate, 0.500" × 48" × 96"                              │
│  Weight: 653.4 lbs (6.534 cwt)                                                  │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  CALCULATION:                                                                   │
│                                                                                 │
│  CRU HRC Index ($/ton)                          $850.00                        │
│  Conversion to $/cwt                            ÷ 20                           │
│  ──────────────────────────────────────────────────────────                    │
│  Base Price per CWT                             $42.50                          │
│                                                                                 │
│  + Plate Form Premium                           $8.50/cwt                       │
│  + Grade A36 Adder                              $0.00/cwt (base grade)          │
│  + 0.500" Thickness Extra                       $0.00/cwt (standard)            │
│  + Width 48" Extra                              $0.00/cwt (standard)            │
│  ──────────────────────────────────────────────────────────                    │
│  Mill Base per CWT                              $51.00                          │
│                                                                                 │
│  × Target Margin (22% for plate)                × 1.282                         │
│  ──────────────────────────────────────────────────────────                    │
│  Base Sell Price per CWT                        $65.38                          │
│                                                                                 │
│  × Weight (6.534 cwt)                           × 6.534                         │
│  ──────────────────────────────────────────────────────────                    │
│  MATERIAL SUBTOTAL                              $427.17                         │
│                                                                                 │
│  + Saw Cut (1 cut × $18.00)                     $18.00                          │
│  + Certification (MTR copy)                     $0.00 (included)                │
│  ──────────────────────────────────────────────────────────                    │
│  TOTAL PRICE                                    $445.17                         │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  COST BREAKDOWN:                                                                │
│  Material Cost: $51.00 × 6.534 = $333.23                                       │
│  Processing Cost: $12.00 (actual saw time)                                     │
│  Total Cost: $345.23                                                           │
│  Gross Margin: ($445.17 - $345.23) / $445.17 = 22.4% ✓                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Aluminum LME Pricing

```typescript
interface AluminumPriceCalculation {
  // LME Base
  lmeCashPrice: number;        // $/metric ton
  lmeCashPerLb: number;        // Converted: LME / 2204.62
  
  // Regional Premium
  midwestPremium: number;      // $/lb (published weekly)
  
  // Alloy Premium
  alloyCode: string;           // '6061', '7075', '2024'
  alloyPremium: number;        // $/lb
  
  // Temper
  temper: string;              // 'T6', 'T651', 'O'
  temperAdder: number;         // $/lb
  
  // Form
  form: string;                // 'PLATE', 'BAR', 'TUBE'
  formPremium: number;         // $/lb
  
  // Calculated
  totalPerLb: number;          // Sum of all components
  totalPerPiece: number;       // × weight
}

// Alloy premium table
const alloyPremiums: Record<string, number> = {
  '1100': 0.00,    // Pure aluminum base
  '3003': 0.08,
  '5052': 0.15,
  '6061': 0.25,
  '6063': 0.20,
  '7075': 0.85,
  '2024': 0.95,
  '7050': 1.10
};
```

---

## 4. PLASTICS PRICING MODEL

### 4.1 Plastics Price Structure

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       PLASTICS PRICING STRUCTURE                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  COMPONENT 1: RESIN BASE PRICE                                                  │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Material Family          │ Base Resin Cost │ Typical Margin │ Min Qty  │   │
│  │ ─────────────────────────│─────────────────│────────────────│───────── │   │
│  │ HDPE (High Density PE)   │ $0.80-1.20/lb   │    25%         │ 1 lb     │   │
│  │ UHMW                     │ $2.50-4.00/lb   │    28%         │ 1 lb     │   │
│  │ Acrylic (PMMA)           │ $3.00-5.00/lb   │    30%         │ 1 lb     │   │
│  │ Polycarbonate            │ $4.00-6.00/lb   │    28%         │ 1 lb     │   │
│  │ Nylon (PA6, PA66)        │ $4.50-7.00/lb   │    30%         │ 1 lb     │   │
│  │ PEEK                     │ $50-100/lb      │    25%         │ 0.5 lb   │   │
│  │ Delrin/Acetal            │ $3.50-5.50/lb   │    28%         │ 1 lb     │   │
│  │ PVC                      │ $1.50-2.50/lb   │    25%         │ 1 lb     │   │
│  │ PTFE (Teflon)            │ $12-25/lb       │    30%         │ 0.5 lb   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  COMPONENT 2: FORM FACTOR MULTIPLIERS                                           │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Form                     │ Multiplier │ Notes                           │   │
│  │ ─────────────────────────│────────────│────────────────────────────────│   │
│  │ Sheet (standard)         │   1.00×    │ Base form                       │   │
│  │ Sheet (cast)             │   1.15×    │ Premium for cast vs extruded    │   │
│  │ Rod (standard dia)       │   1.10×    │ 0.25" - 6" diameter             │   │
│  │ Rod (oversize)           │   1.25×    │ > 6" diameter                   │   │
│  │ Tube (standard)          │   1.20×    │ Common wall thicknesses         │   │
│  │ Tube (custom)            │   1.40×    │ Non-standard ID/OD              │   │
│  │ Profile (standard)       │   1.30×    │ Stock extrusion shapes          │   │
│  │ Profile (custom)         │   2.00×+   │ Custom tooling required         │   │
│  │ Film/Thin Sheet          │   1.25×    │ < 0.030" thick                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  COMPONENT 3: SIZE/CUT CHARGES                                                  │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Cut Pattern              │ Charge                                       │   │
│  │ ─────────────────────────│────────────────────────────────────────────  │   │
│  │ Full Sheet               │ $0 (no cut)                                  │   │
│  │ Straight Cut (saw)       │ $8-15 per cut                                │   │
│  │ Precision Cut (router)   │ $15-25 per cut                               │   │
│  │ Custom Shape             │ $50+ setup + $X/min runtime                 │   │
│  │ Edge Finishing           │ $2-5 per edge                                │   │
│  │ Drilling/Tapping         │ $3-8 per hole                                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  COMPONENT 4: SPECIFICATION PREMIUMS                                            │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Specification            │ Premium                                      │   │
│  │ ─────────────────────────│────────────────────────────────────────────  │   │
│  │ FDA Compliant            │ +5-10%                                       │   │
│  │ Medical Grade            │ +15-25%                                      │   │
│  │ Static Dissipative       │ +20-40%                                      │   │
│  │ Glass Filled             │ +10-20%                                      │   │
│  │ UV Stabilized            │ +5-10%                                       │   │
│  │ Custom Color             │ +10-30% (min order required)                │   │
│  │ Traceable (lot control)  │ +5%                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Plastics Price Calculation

```typescript
interface PlasticsPriceRequest {
  materialCode: string;       // 'UHMW', 'NYLON-66', 'PEEK'
  form: 'SHEET' | 'ROD' | 'TUBE' | 'PROFILE';
  dimensions: {
    thickness?: number;       // inches (sheet)
    diameter?: number;        // inches (rod)
    od?: number;              // inches (tube)
    id?: number;              // inches (tube)
    width: number;            // inches
    length: number;           // inches
  };
  specifications: string[];   // ['FDA', 'STATIC_DISS']
  quantity: number;
  processing: ProcessingRequest[];
}

interface PlasticsPriceResult {
  unitWeight: number;         // lbs
  resinCostPerLb: number;
  formMultiplier: number;
  specPremiums: number;       // Additive %
  basePrice: number;          // Before processing
  processingCharges: number;
  totalPrice: number;
  pricePerPiece: number;
  marginPercent: number;
}

function calculatePlasticsPrice(req: PlasticsPriceRequest): PlasticsPriceResult {
  // Get material base cost
  const material = getMaterial(req.materialCode);
  const resinCost = material.currentResinCost;
  
  // Calculate weight
  const weight = calculatePlasticWeight(req.form, req.dimensions, material.density);
  
  // Form multiplier
  const formMult = getFormMultiplier(req.form, req.dimensions);
  
  // Spec premiums (additive)
  const specPremium = req.specifications
    .map(spec => getSpecPremium(spec))
    .reduce((a, b) => a + b, 0);
  
  // Base material price
  const baseMaterialCost = weight * resinCost * formMult * (1 + specPremium);
  
  // Apply margin
  const targetMargin = material.targetMargin;
  const basePrice = baseMaterialCost / (1 - targetMargin);
  
  // Processing charges
  const processingCharges = req.processing
    .map(p => calculateProcessingCharge(p, material))
    .reduce((a, b) => a + b, 0);
  
  // Total
  const totalPrice = (basePrice + processingCharges) * req.quantity;
  
  return {
    unitWeight: weight,
    resinCostPerLb: resinCost,
    formMultiplier: formMult,
    specPremiums: specPremium,
    basePrice,
    processingCharges,
    totalPrice,
    pricePerPiece: totalPrice / req.quantity,
    marginPercent: calculateMargin(totalPrice, baseMaterialCost + processingCharges * 0.7)
  };
}
```

---

## 5. INDUSTRIAL SUPPLIES PRICING MODEL

### 5.1 Catalog-Based Pricing

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      SUPPLIES PRICING STRUCTURE                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PRICING MODEL: CATALOG + DISCOUNT                                              │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │   Sell Price = Catalog Price × (1 - Customer Discount %)               │   │
│  │                                                                         │   │
│  │   Where Customer Discount is based on:                                  │   │
│  │   • Customer tier (Gold: 15%, Silver: 10%, Bronze: 5%)                 │   │
│  │   • Product category discount                                          │   │
│  │   • Volume discount (quantity breaks)                                  │   │
│  │   • Contract discount                                                  │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  COMPONENT 1: VENDOR COST BASIS                                                 │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Cost Type              │ Description                                    │   │
│  │ ───────────────────────│──────────────────────────────────────────────  │   │
│  │ Last Cost              │ Most recent purchase price                     │   │
│  │ Average Cost           │ Weighted average of purchases                  │   │
│  │ Standard Cost          │ Budget/forecast cost                           │   │
│  │ Replacement Cost       │ Current vendor quote                           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  COMPONENT 2: MARKUP TIERS                                                      │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Category               │ Cost Range    │ Target Markup │ Min Margin   │   │
│  │ ───────────────────────│───────────────│───────────────│────────────  │   │
│  │ Consumables            │ < $25         │    65%        │    35%       │   │
│  │ Hand Tools             │ $25-100       │    50%        │    30%       │   │
│  │ Power Tools            │ $100-500      │    35%        │    22%       │   │
│  │ Safety Equipment       │ $10-200       │    55%        │    32%       │   │
│  │ Abrasives              │ $5-50         │    60%        │    35%       │   │
│  │ Cutting Tools          │ $10-500       │    45%        │    28%       │   │
│  │ Measuring Instruments  │ $20-1000      │    40%        │    25%       │   │
│  │ Shop Supplies          │ $5-100        │    55%        │    30%       │   │
│  │ Fasteners              │ < $1 each     │    70%        │    40%       │   │
│  │ Lubricants/Chemicals   │ $10-200       │    50%        │    30%       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  COMPONENT 3: QUANTITY BREAKS                                                   │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Quantity Tier          │ Discount                                       │   │
│  │ ───────────────────────│──────────────────────────────────────────────  │   │
│  │ 1 - 9 units            │ List price                                     │   │
│  │ 10 - 24 units          │ -5%                                            │   │
│  │ 25 - 49 units          │ -10%                                           │   │
│  │ 50 - 99 units          │ -15%                                           │   │
│  │ 100+ units             │ -20%                                           │   │
│  │ Case/Box quantity      │ -25% (full case)                               │   │
│  │ Pallet quantity        │ -30% (full pallet)                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Supplies Price Data Model

```typescript
interface SuppliesProduct {
  sku: string;
  upc?: string;
  vendorPartNumber: string;
  description: string;
  category: string;
  subcategory: string;
  
  // Pricing
  catalogPrice: number;           // Published list price
  lastCost: number;               // Most recent purchase
  averageCost: number;            // Weighted average
  standardCost: number;           // Budget cost
  
  // Unit handling
  unitOfMeasure: string;          // EA, BX, PK, CS
  packQuantity?: number;          // Units per pack
  caseQuantity?: number;          // Packs per case
  
  // Quantity breaks
  quantityBreaks: QuantityBreak[];
  
  // Customer-specific
  contractPrices: ContractPrice[];
  
  // Margins
  categoryMinMargin: number;      // Floor
  categoryTargetMargin: number;   // Target
}

interface QuantityBreak {
  minQty: number;
  maxQty?: number;
  discountPercent?: number;       // % off list
  fixedPrice?: number;            // Or fixed price at this tier
}

function calculateSuppliesPrice(
  product: SuppliesProduct,
  quantity: number,
  customer: Customer
): PriceResult {
  
  let basePrice = product.catalogPrice;
  
  // 1. Check contract price
  const contractPrice = product.contractPrices
    .find(cp => cp.customerId === customer.id && isValid(cp));
  if (contractPrice) {
    basePrice = contractPrice.price;
  }
  
  // 2. Apply customer tier discount (if no contract)
  if (!contractPrice) {
    const tierDiscount = getCustomerTierDiscount(customer.pricingTier);
    basePrice = basePrice * (1 - tierDiscount);
  }
  
  // 3. Apply quantity break
  const qtyBreak = findQuantityBreak(product.quantityBreaks, quantity);
  if (qtyBreak) {
    if (qtyBreak.fixedPrice) {
      basePrice = qtyBreak.fixedPrice;
    } else if (qtyBreak.discountPercent) {
      basePrice = basePrice * (1 - qtyBreak.discountPercent);
    }
  }
  
  // 4. Validate margin
  const cost = product.lastCost || product.averageCost;
  const margin = (basePrice - cost) / basePrice;
  
  if (margin < product.categoryMinMargin) {
    // Price below floor - requires override
    return {
      price: basePrice,
      quantity,
      extendedPrice: basePrice * quantity,
      marginWarning: true,
      calculatedMargin: margin,
      floorMargin: product.categoryMinMargin
    };
  }
  
  return {
    price: basePrice,
    quantity,
    extendedPrice: basePrice * quantity,
    marginWarning: false,
    calculatedMargin: margin
  };
}
```

---

## 6. CONTRACT PRICING

### 6.1 Contract Types

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          CONTRACT PRICING TYPES                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  TYPE 1: FIXED PRICE CONTRACT                                                   │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Description: Price locked for contract duration                          │   │
│  │                                                                         │   │
│  │ Example:                                                                │   │
│  │ Customer: ABC Manufacturing                                             │   │
│  │ Product: A36 Plate 0.500" × 48" × 96"                                  │   │
│  │ Fixed Price: $58.50/cwt                                                 │   │
│  │ Valid: Jan 1, 2026 - Dec 31, 2026                                      │   │
│  │ Volume Commitment: 50,000 lbs/month minimum                            │   │
│  │                                                                         │   │
│  │ Use Case: High-volume, repeat orders with stable pricing needs         │   │
│  │ Risk: Seller bears commodity price increase risk                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  TYPE 2: FORMULA-BASED CONTRACT (INDEX-LINKED)                                  │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Description: Price tied to commodity index + fixed adder               │   │
│  │                                                                         │   │
│  │ Formula: Sell Price = [Index] + [Conversion Factor] + [Fixed Adder]   │   │
│  │                                                                         │   │
│  │ Example:                                                                │   │
│  │ Customer: XYZ Fabricators                                              │   │
│  │ Product: 6061-T6 Aluminum Plate                                        │   │
│  │ Formula: LME Cash ÷ 2204.62 + MW Premium + $0.18/lb + $0.35/lb        │   │
│  │          ─────────────────   ──────────   ─────────   ─────────        │   │
│  │          Base $/lb           Midwest      Alloy      Margin            │   │
│  │                                                                         │   │
│  │ Valid: Quarterly review with 30-day lock periods                       │   │
│  │                                                                         │   │
│  │ Use Case: Large volumes with commodity exposure sharing                │   │
│  │ Risk: Shared between buyer and seller based on index movement          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  TYPE 3: DISCOUNT MATRIX CONTRACT                                               │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Description: Discount % off current market/list prices                 │   │
│  │                                                                         │   │
│  │ Example:                                                                │   │
│  │ Customer: DEF Industries                                               │   │
│  │                                                                         │   │
│  │ Category               │ Discount │                                    │   │
│  │ ───────────────────────│──────────│                                    │   │
│  │ Carbon Flat Rolled     │ -12%     │                                    │   │
│  │ Carbon Bar             │ -10%     │                                    │   │
│  │ Stainless              │ -8%      │                                    │   │
│  │ Aluminum               │ -10%     │                                    │   │
│  │ Processing             │ -5%      │                                    │   │
│  │                                                                         │   │
│  │ Valid: Annual, auto-renews                                             │   │
│  │                                                                         │   │
│  │ Use Case: Good customers with varied purchases                         │   │
│  │ Risk: Seller retains commodity risk; discount is from current price   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  TYPE 4: TIERED VOLUME CONTRACT                                                 │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Description: Price improves with volume commitment                     │   │
│  │                                                                         │   │
│  │ Example:                                                                │   │
│  │ Customer: GHI Corporation                                              │   │
│  │ Product: All carbon steel products                                     │   │
│  │                                                                         │   │
│  │ Monthly Volume (lbs)  │ Price Level  │ Discount │                      │   │
│  │ ──────────────────────│──────────────│──────────│                      │   │
│  │ < 25,000              │ Standard     │ 0%       │                      │   │
│  │ 25,000 - 49,999       │ Tier 1       │ -5%      │                      │   │
│  │ 50,000 - 99,999       │ Tier 2       │ -10%     │                      │   │
│  │ 100,000 - 199,999     │ Tier 3       │ -15%     │                      │   │
│  │ 200,000+              │ Tier 4       │ -18%     │                      │   │
│  │                                                                         │   │
│  │ Calculation: Volume tracked monthly, tier applied next month          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Contract Data Model

```typescript
interface PricingContract {
  id: string;
  contractNumber: string;
  customerId: string;
  customerName: string;
  
  // Dates
  effectiveDate: Date;
  expirationDate: Date;
  reviewDate?: Date;          // When to review pricing
  
  // Type
  contractType: 'FIXED' | 'FORMULA' | 'DISCOUNT_MATRIX' | 'TIERED_VOLUME';
  
  // Terms
  volumeCommitment?: {
    minMonthly?: number;      // lbs or units
    minAnnual?: number;
    penaltyForShortfall?: number;  // % or $
  };
  
  // Division scope
  divisionIds: string[];      // Which divisions apply
  
  // Status
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  approvedBy?: string;
  approvedDate?: Date;
  
  // Pricing details (varies by type)
  fixedPrices?: FixedPriceItem[];
  formulas?: FormulaItem[];
  discountMatrix?: DiscountMatrixItem[];
  volumeTiers?: VolumeTierItem[];
}

interface FormulaItem {
  productScope: ProductScope;   // What products this applies to
  formula: {
    baseIndex: string;          // 'LME_AL', 'CRU_HRC'
    conversionFactor?: number;  // Index to $/unit conversion
    adders: FormulaAdder[];     // Fixed $ adders
    multiplier?: number;        // Optional multiplier
  };
  lockPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  lookbackDays?: number;        // Use index from N days ago
}

interface FormulaAdder {
  name: string;                 // 'Midwest Premium', 'Alloy', 'Margin'
  type: 'INDEX' | 'FIXED';      // Another index or fixed value
  indexCode?: string;           // If type = INDEX
  value?: number;               // If type = FIXED
  perUnit: string;              // 'lb', 'cwt', 'ton'
}
```

---

## 7. PROCESSING PRICING

### 7.1 Processing Charge Model

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      PROCESSING CHARGE MODEL                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PRICING METHOD 1: FIXED PER-OPERATION                                          │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Operation                │ Charge        │ Notes                        │   │
│  │ ─────────────────────────│───────────────│──────────────────────────── │   │
│  │ Saw Cut (1 cut)          │ $15-25        │ Per cut, any material        │   │
│  │ Shear Cut                │ $8-15         │ Per cut (thin gauge only)    │   │
│  │ Burn/Plasma Cut          │ $1.50/in      │ Per linear inch              │   │
│  │ Laser Cut                │ $2.50/in      │ Per linear inch              │   │
│  │ Waterjet Cut             │ $4.00/in      │ Per linear inch              │   │
│  │ Drill Hole               │ $5-12         │ Per hole (size dependent)    │   │
│  │ Tap Hole                 │ $8-15         │ Per hole                     │   │
│  │ Countersink              │ $4-8          │ Per hole                     │   │
│  │ Deburr (hand)            │ $15/piece     │ Light deburring              │   │
│  │ Grind Edge               │ $2.50/ft      │ Per linear foot              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  PRICING METHOD 2: TIME-BASED (Machine Time × Rate)                             │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Work Center              │ Rate/Hour    │ Min Charge │ Setup Fee      │   │
│  │ ─────────────────────────│──────────────│────────────│──────────────  │   │
│  │ Horizontal Band Saw      │ $85/hr       │ $15        │ $0             │   │
│  │ Vertical Band Saw        │ $75/hr       │ $12        │ $0             │   │
│  │ Plate Saw                │ $120/hr      │ $25        │ $0             │   │
│  │ Shear                    │ $95/hr       │ $15        │ $0             │   │
│  │ Plasma Table             │ $150/hr      │ $35        │ $25            │   │
│  │ Laser Cutter             │ $225/hr      │ $45        │ $35            │   │
│  │ Waterjet                 │ $275/hr      │ $55        │ $45            │   │
│  │ CNC Mill                 │ $175/hr      │ $40        │ $50            │   │
│  │ CNC Lathe                │ $150/hr      │ $35        │ $40            │   │
│  │ Slitting Line            │ $200/hr      │ $100       │ $150           │   │
│  │ CTL Line                 │ $250/hr      │ $125       │ $200           │   │
│  │ Press Brake              │ $110/hr      │ $25        │ $30            │   │
│  │ Roll Form                │ $130/hr      │ $30        │ $75            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  PRICING METHOD 3: PIECE-RATE                                                   │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ For high-volume repeat operations:                                      │   │
│  │                                                                         │   │
│  │ Price per Piece = (Setup Time + (Cycle Time × Qty)) × Rate / Qty       │   │
│  │                                                                         │   │
│  │ Example: Cut 100 pieces of 2" round bar                                 │   │
│  │ Setup: 5 min = 0.083 hr × $85/hr = $7.08                               │   │
│  │ Cycle: 0.5 min/pc × 100 = 50 min = 0.833 hr × $85/hr = $70.83         │   │
│  │ Total: $77.91 / 100 = $0.78/piece                                       │   │
│  │                                                                         │   │
│  │ Minimum applies: If $0.78 < min $0.50, use $0.50                       │   │
│  │ Total charge: 100 × $0.78 = $78.00                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  PRICING METHOD 4: WEIGHT/DIMENSION BASED                                       │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Some operations charge by material handled:                             │   │
│  │                                                                         │   │
│  │ Slitting:     $X.XX per CWT processed                                   │   │
│  │ Cut-to-Length: $X.XX per CWT processed                                  │   │
│  │ Blanking:     $X.XX per CWT processed + die setup                       │   │
│  │ Heat Treat:   $X.XX per lb                                              │   │
│  │ Annealing:    $X.XX per lb                                              │   │
│  │ Grinding:     $X.XX per sq ft                                           │   │
│  │ Polishing:    $X.XX per sq ft                                           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Processing Price Engine

```typescript
interface ProcessingPriceRequest {
  workCenterId: string;
  operationType: string;          // 'SAW_CUT', 'LASER_CUT', 'DRILL'
  material: {
    type: string;                 // 'CARBON_STEEL', 'ALUMINUM'
    grade: string;
    thickness?: number;           // inches
    hardness?: string;            // For cut time adjustment
  };
  dimensions: {
    cutLength?: number;           // inches (for linear cuts)
    holeSize?: number;            // diameter (for drilling)
    quantity: number;             // number of operations
  };
  estimatedTime?: number;         // minutes (if known)
  priority: 'STANDARD' | 'RUSH' | 'HOT';
}

interface ProcessingPriceResult {
  method: 'FIXED' | 'TIME' | 'PIECE' | 'WEIGHT';
  
  // Breakdown
  setupCharge: number;
  operationCharge: number;
  rushPremium: number;            // If applicable
  
  // Totals
  totalCharge: number;
  chargePerPiece: number;
  
  // Time estimate
  estimatedMinutes: number;
  
  // For audit
  calculation: {
    formula: string;
    inputs: Record<string, number>;
    result: number;
  };
}

class ProcessingPriceEngine {
  
  calculatePrice(req: ProcessingPriceRequest): ProcessingPriceResult {
    const workCenter = this.getWorkCenter(req.workCenterId);
    const operation = this.getOperation(req.operationType);
    
    // Determine pricing method
    const method = this.selectPricingMethod(workCenter, operation, req);
    
    let result: ProcessingPriceResult;
    
    switch (method) {
      case 'FIXED':
        result = this.calculateFixedPrice(operation, req);
        break;
      case 'TIME':
        result = this.calculateTimeBasedPrice(workCenter, req);
        break;
      case 'PIECE':
        result = this.calculatePieceRate(workCenter, operation, req);
        break;
      case 'WEIGHT':
        result = this.calculateWeightBasedPrice(operation, req);
        break;
    }
    
    // Apply rush premium
    if (req.priority !== 'STANDARD') {
      const rushMultiplier = req.priority === 'HOT' ? 1.5 : 1.25;
      result.rushPremium = result.totalCharge * (rushMultiplier - 1);
      result.totalCharge *= rushMultiplier;
    }
    
    // Apply minimum charge
    if (result.totalCharge < workCenter.minimumCharge) {
      result.totalCharge = workCenter.minimumCharge;
    }
    
    return result;
  }
  
  private calculateTimeBasedPrice(
    workCenter: WorkCenter,
    req: ProcessingPriceRequest
  ): ProcessingPriceResult {
    
    // Estimate time if not provided
    const minutes = req.estimatedTime || 
      this.estimateOperationTime(workCenter, req);
    
    const hours = minutes / 60;
    const operationCharge = hours * workCenter.hourlyRate;
    const setupCharge = workCenter.setupFee || 0;
    
    return {
      method: 'TIME',
      setupCharge,
      operationCharge,
      rushPremium: 0,
      totalCharge: setupCharge + operationCharge,
      chargePerPiece: (setupCharge + operationCharge) / req.dimensions.quantity,
      estimatedMinutes: minutes,
      calculation: {
        formula: '(setupFee) + (minutes / 60 × hourlyRate)',
        inputs: {
          setupFee: setupCharge,
          minutes,
          hourlyRate: workCenter.hourlyRate
        },
        result: setupCharge + operationCharge
      }
    };
  }
}
```

---

## 8. REMNANT PRICING

### 8.1 Remnant Pricing Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         REMNANT PRICING MODEL                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  DEFINITION: Remnants are usable pieces left over from processing that are     │
│  smaller than standard stock sizes but larger than scrap.                       │
│                                                                                 │
│  GOAL: Recover value from remnants while clearing inventory space              │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  PRICING FORMULA:                                                               │
│                                                                                 │
│  Remnant Price = Base Material Price × Remnant Discount × Age Factor           │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  REMNANT DISCOUNT BY SIZE:                                                      │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Size Category           │ % of Full Pcs │ Discount from Standard       │   │
│  │ ────────────────────────│───────────────│──────────────────────────── │   │
│  │ Large Remnant           │ 50-75%        │ -20%                         │   │
│  │ Medium Remnant          │ 25-50%        │ -35%                         │   │
│  │ Small Remnant           │ 10-25%        │ -50%                         │   │
│  │ Drop/Short              │ < 10%         │ -65% (or scrap value)        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  AGE-BASED DISCOUNT (Accelerated Clearance):                                    │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Age (Days in Inventory) │ Additional Discount │ Auto-Action             │   │
│  │ ────────────────────────│─────────────────────│───────────────────────  │   │
│  │ 0-30 days               │ 0%                  │ Normal                   │   │
│  │ 31-60 days              │ -5%                 │ Flag for attention       │   │
│  │ 61-90 days              │ -10%                │ Prioritize for sale      │   │
│  │ 91-120 days             │ -15%                │ Offer to all customers   │   │
│  │ 121-180 days            │ -25%                │ Counter specials list    │   │
│  │ 180+ days               │ -35%                │ Scrap evaluation         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  EXAMPLE CALCULATION:                                                           │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  Product: 304 Stainless Plate 0.375" × 24" × 36" (remnant from 48" × 96")     │
│  Standard Price: $12.50/lb                                                     │
│  Remnant Weight: 91.8 lbs                                                      │
│  Full Piece Equiv: 25% (Medium Remnant → -35%)                                 │
│  Age: 75 days (-10%)                                                           │
│                                                                                 │
│  Standard Value: $12.50 × 91.8 = $1,147.50                                    │
│  Size Discount: $1,147.50 × 0.65 = $745.88                                    │
│  Age Discount: $745.88 × 0.90 = $671.29                                       │
│                                                                                 │
│  REMNANT PRICE: $671.29 ($7.31/lb)                                             │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  FLOOR PRICE RULE:                                                              │
│  Never sell below: Scrap Value + $0.10/lb handling                             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Remnant Pricing Engine

```typescript
interface RemnantItem {
  id: string;
  inventoryItemId: string;
  
  // Original source
  parentItemId?: string;         // What it was cut from
  
  // Material
  materialCode: string;
  grade: string;
  
  // Dimensions
  thickness: number;
  width: number;
  length: number;
  weight: number;
  
  // Size classification
  percentOfStandard: number;     // % of full piece
  sizeCategory: 'LARGE' | 'MEDIUM' | 'SMALL' | 'DROP';
  
  // Dates
  createdDate: Date;
  daysInInventory: number;
  
  // Original cost
  materialCost: number;
  
  // Calculated pricing
  basePrice: number;             // Current market × weight
  sizeDiscount: number;
  ageDiscount: number;
  remnantPrice: number;
  pricePerLb: number;
  
  // Floor
  scrapValue: number;
  floorPrice: number;
}

class RemnantPricingEngine {
  
  private sizeDiscounts: Record<string, number> = {
    'LARGE': 0.20,   // -20%
    'MEDIUM': 0.35,  // -35%
    'SMALL': 0.50,   // -50%
    'DROP': 0.65     // -65%
  };
  
  private ageDiscountSchedule = [
    { maxDays: 30, discount: 0 },
    { maxDays: 60, discount: 0.05 },
    { maxDays: 90, discount: 0.10 },
    { maxDays: 120, discount: 0.15 },
    { maxDays: 180, discount: 0.25 },
    { maxDays: Infinity, discount: 0.35 }
  ];
  
  calculateRemnantPrice(item: RemnantItem): RemnantPriceResult {
    // Get current market price
    const marketPrice = this.getCurrentMaterialPrice(item.materialCode, item.grade);
    const basePrice = marketPrice * item.weight;
    
    // Size discount
    const sizeDiscount = this.sizeDiscounts[item.sizeCategory];
    const afterSizeDiscount = basePrice * (1 - sizeDiscount);
    
    // Age discount
    const ageDiscount = this.getAgeDiscount(item.daysInInventory);
    const afterAgeDiscount = afterSizeDiscount * (1 - ageDiscount);
    
    // Floor price (scrap + handling)
    const scrapPrice = this.getScrapValue(item.materialCode);
    const floorPrice = (scrapPrice * item.weight) + (0.10 * item.weight);
    
    // Final price (cannot go below floor)
    const finalPrice = Math.max(afterAgeDiscount, floorPrice);
    
    return {
      basePrice,
      sizeDiscountPercent: sizeDiscount,
      sizeDiscountAmount: basePrice * sizeDiscount,
      ageDiscountPercent: ageDiscount,
      ageDiscountAmount: afterSizeDiscount * ageDiscount,
      floorPrice,
      finalPrice,
      pricePerLb: finalPrice / item.weight,
      marginVsCost: (finalPrice - item.materialCost) / finalPrice
    };
  }
  
  private getAgeDiscount(days: number): number {
    const tier = this.ageDiscountSchedule.find(t => days <= t.maxDays);
    return tier?.discount || 0.35;
  }
  
  // Batch update all remnant prices (daily job)
  async updateAllRemnantPrices(): Promise<void> {
    const remnants = await this.inventoryService.getRemnants();
    
    for (const remnant of remnants) {
      const pricing = this.calculateRemnantPrice(remnant);
      await this.inventoryService.updateRemnantPrice(remnant.id, pricing);
      
      // Auto-actions based on age
      if (remnant.daysInInventory > 120) {
        await this.notifyCounterSalesTeam(remnant);
      }
      if (remnant.daysInInventory > 180) {
        await this.flagForScrapReview(remnant);
      }
    }
  }
}
```

---

## 9. RETAIL / COUNTER PRICING

### 9.1 Retail Pricing Model

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        RETAIL / COUNTER PRICING                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  CHARACTERISTICS:                                                               │
│  • Walk-in customers (often no account)                                         │
│  • Small quantities                                                             │
│  • Immediate pickup                                                             │
│  • Cash/credit card payment                                                     │
│  • Higher margins expected                                                      │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  RETAIL PRICING FORMULA:                                                        │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  Retail Price = Wholesale Price × Retail Markup Factor                  │   │
│  │                                                                         │   │
│  │  Where Retail Markup varies by:                                         │   │
│  │  • Product category                                                     │   │
│  │  • Quantity purchased                                                   │   │
│  │  • Customer type (cash vs account)                                      │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  RETAIL MARKUP BY CATEGORY:                                                     │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Category               │ Retail Markup │ Result Margin │ Min Order    │   │
│  │ ───────────────────────│───────────────│───────────────│────────────  │   │
│  │ Steel (small cuts)     │ 1.35×         │ ~35%          │ $25          │   │
│  │ Steel (bar stock)      │ 1.30×         │ ~32%          │ $15          │   │
│  │ Aluminum (small cuts)  │ 1.40×         │ ~38%          │ $20          │   │
│  │ Stainless (small cuts) │ 1.45×         │ ~40%          │ $30          │   │
│  │ Plastics               │ 1.50×         │ ~42%          │ $15          │   │
│  │ Supplies (consumables) │ 1.65×         │ ~50%          │ $5           │   │
│  │ Supplies (tools)       │ 1.45×         │ ~40%          │ $10          │   │
│  │ Fasteners              │ 1.80×         │ ~55%          │ $3           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  QUANTITY ADJUSTMENTS:                                                          │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Order Size             │ Markup Adjustment                              │   │
│  │ ───────────────────────│──────────────────────────────────────────────  │   │
│  │ < $50                  │ Full retail markup                             │   │
│  │ $50 - $199             │ -5% off retail                                 │   │
│  │ $200 - $499            │ -10% off retail                                │   │
│  │ $500+                  │ -15% off retail (or quote)                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  CASH/CARD HANDLING:                                                            │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Payment Method         │ Adjustment                                     │   │
│  │ ───────────────────────│──────────────────────────────────────────────  │   │
│  │ Cash                   │ -2% discount (optional)                        │   │
│  │ Credit Card            │ Standard price                                 │   │
│  │ Check (with approval)  │ Standard price                                 │   │
│  │ COD Account            │ Standard price                                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Counter Pricing Logic

```typescript
interface CounterPriceRequest {
  customerType: 'WALK_IN' | 'ACCOUNT';
  customerId?: string;
  items: CartItem[];
  paymentMethod?: 'CASH' | 'CARD' | 'CHECK' | 'ACCOUNT';
}

interface CounterPriceResult {
  items: PricedCartItem[];
  subtotal: number;
  orderSizeDiscount: number;
  cashDiscount: number;
  tax: number;
  total: number;
}

class CounterPricingEngine {
  
  private retailMarkups: Record<string, number> = {
    'STEEL_SMALL': 1.35,
    'STEEL_BAR': 1.30,
    'ALUMINUM_SMALL': 1.40,
    'STAINLESS_SMALL': 1.45,
    'PLASTICS': 1.50,
    'SUPPLIES_CONSUMABLE': 1.65,
    'SUPPLIES_TOOLS': 1.45,
    'FASTENERS': 1.80
  };
  
  calculateCounterPrice(req: CounterPriceRequest): CounterPriceResult {
    // Price each item
    const pricedItems = req.items.map(item => {
      // Get base wholesale price
      let basePrice = this.getWholesalePrice(item);
      
      // If walk-in, apply retail markup
      if (req.customerType === 'WALK_IN') {
        const markup = this.getRetailMarkup(item.category);
        basePrice = basePrice * markup;
      } else if (req.customerId) {
        // Account customer - use their pricing tier
        basePrice = this.getCustomerPrice(req.customerId, item);
      }
      
      return {
        ...item,
        unitPrice: basePrice,
        extendedPrice: basePrice * item.quantity
      };
    });
    
    // Calculate subtotal
    const subtotal = pricedItems.reduce((sum, item) => sum + item.extendedPrice, 0);
    
    // Order size discount
    let orderDiscount = 0;
    if (subtotal >= 500) orderDiscount = 0.15;
    else if (subtotal >= 200) orderDiscount = 0.10;
    else if (subtotal >= 50) orderDiscount = 0.05;
    
    const orderSizeDiscount = subtotal * orderDiscount;
    
    // Cash discount
    let cashDiscount = 0;
    if (req.paymentMethod === 'CASH' && this.config.offerCashDiscount) {
      cashDiscount = (subtotal - orderSizeDiscount) * 0.02;
    }
    
    // Tax
    const taxableAmount = subtotal - orderSizeDiscount - cashDiscount;
    const tax = taxableAmount * this.getTaxRate();
    
    return {
      items: pricedItems,
      subtotal,
      orderSizeDiscount,
      cashDiscount,
      tax,
      total: taxableAmount + tax
    };
  }
}
```

---

## 10. MARGIN CONTROLS

### 10.1 Margin Control Framework

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        MARGIN CONTROL FRAMEWORK                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  THREE-TIER MARGIN SYSTEM:                                                      │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  ╔════════════════════════════════════════════════════════════════════╗│   │
│  │  ║  TIER 1: TARGET MARGIN                                             ║│   │
│  │  ║  ─────────────────────────────────────────────────────────────────║│   │
│  │  ║  The ideal margin for this product/category                       ║│   │
│  │  ║  → Used for standard pricing calculations                         ║│   │
│  │  ║  → Displayed as "expected" in quoting                             ║│   │
│  │  ╚════════════════════════════════════════════════════════════════════╝│   │
│  │                              ▼                                          │   │
│  │  ╔════════════════════════════════════════════════════════════════════╗│   │
│  │  ║  TIER 2: WARNING THRESHOLD (Soft Floor)                           ║│   │
│  │  ║  ─────────────────────────────────────────────────────────────────║│   │
│  │  ║  Below target but acceptable with justification                   ║│   │
│  │  ║  → Yellow warning displayed to user                               ║│   │
│  │  ║  → Reason required for approval                                   ║│   │
│  │  ║  → Logged for margin erosion analysis                             ║│   │
│  │  ╚════════════════════════════════════════════════════════════════════╝│   │
│  │                              ▼                                          │   │
│  │  ╔════════════════════════════════════════════════════════════════════╗│   │
│  │  ║  TIER 3: FLOOR MARGIN (Hard Floor)                                ║│   │
│  │  ║  ─────────────────────────────────────────────────────────────────║│   │
│  │  ║  Absolute minimum - requires management approval                  ║│   │
│  │  ║  → Red warning displayed                                          ║│   │
│  │  ║  → Manager approval required                                      ║│   │
│  │  ║  → Cannot proceed without override                                ║│   │
│  │  ╚════════════════════════════════════════════════════════════════════╝│   │
│  │                              ▼                                          │   │
│  │  ╔════════════════════════════════════════════════════════════════════╗│   │
│  │  ║  BELOW FLOOR: LOSS SALE                                           ║│   │
│  │  ║  ─────────────────────────────────────────────────────────────────║│   │
│  │  ║  Selling below cost - exceptional circumstances only              ║│   │
│  │  ║  → Requires VP/owner approval                                     ║│   │
│  │  ║  → Documented business justification                              ║│   │
│  │  ║  → Flagged for P&L impact                                         ║│   │
│  │  ╚════════════════════════════════════════════════════════════════════╝│   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Margin Thresholds by Category

| Category | Target Margin | Warning Threshold | Floor Margin |
|----------|:-------------:|:-----------------:|:------------:|
| **Carbon Flat Rolled** | 18% | 12% | 8% |
| **Carbon Plate** | 22% | 15% | 10% |
| **Carbon Bar/Structural** | 20% | 14% | 10% |
| **Stainless Flat** | 25% | 18% | 12% |
| **Stainless Bar** | 28% | 20% | 15% |
| **Aluminum Sheet/Plate** | 22% | 15% | 10% |
| **Aluminum Bar** | 25% | 18% | 12% |
| **Specialty Alloys** | 30% | 22% | 18% |
| **Plastics - Commodity** | 25% | 18% | 12% |
| **Plastics - Engineering** | 30% | 22% | 15% |
| **Supplies - Consumable** | 45% | 35% | 25% |
| **Supplies - Tools** | 40% | 30% | 22% |
| **Processing Services** | 50% | 40% | 30% |

### 10.3 Override Approval Matrix

| Margin Level | Sales Rep | Sales Mgr | Div Mgr | VP/Owner |
|--------------|:---------:|:---------:|:-------:|:--------:|
| ≥ Target | ✓ Approve | ✓ | ✓ | ✓ |
| Warning to Target | ✓ + Reason | ✓ | ✓ | ✓ |
| Floor to Warning | ○ | ✓ Approve | ✓ | ✓ |
| Below Floor (still profit) | ○ | ○ | ✓ Approve | ✓ |
| At or Below Cost | ○ | ○ | ○ | ✓ Approve |

### 10.4 Margin Validation Service

```typescript
interface MarginValidation {
  itemId: string;
  sellPrice: number;
  cost: number;
  calculatedMargin: number;
  
  category: string;
  targetMargin: number;
  warningThreshold: number;
  floorMargin: number;
  
  status: 'APPROVED' | 'WARNING' | 'REQUIRES_APPROVAL' | 'BLOCKED';
  requiredApprover?: string;  // Role code
  message: string;
}

class MarginControlService {
  
  validateMargin(
    sellPrice: number,
    cost: number,
    category: string
  ): MarginValidation {
    
    const thresholds = this.getThresholds(category);
    const margin = (sellPrice - cost) / sellPrice;
    
    let status: MarginValidation['status'];
    let requiredApprover: string | undefined;
    let message: string;
    
    if (margin >= thresholds.target) {
      status = 'APPROVED';
      message = 'Margin meets target';
    } else if (margin >= thresholds.warning) {
      status = 'WARNING';
      message = `Margin ${(margin * 100).toFixed(1)}% below target ${(thresholds.target * 100)}%. Reason required.`;
    } else if (margin >= thresholds.floor) {
      status = 'REQUIRES_APPROVAL';
      requiredApprover = 'SALES_MGR';
      message = `Margin ${(margin * 100).toFixed(1)}% requires Sales Manager approval`;
    } else if (margin > 0) {
      status = 'REQUIRES_APPROVAL';
      requiredApprover = 'DIV_MGR';
      message = `Margin ${(margin * 100).toFixed(1)}% below floor. Division Manager approval required.`;
    } else {
      status = 'BLOCKED';
      requiredApprover = 'VP';
      message = 'Selling at or below cost requires VP approval';
    }
    
    return {
      itemId: '',
      sellPrice,
      cost,
      calculatedMargin: margin,
      category,
      targetMargin: thresholds.target,
      warningThreshold: thresholds.warning,
      floorMargin: thresholds.floor,
      status,
      requiredApprover,
      message
    };
  }
}
```

---

## 11. COSTING MODEL

### 11.1 Standard vs Actual Costing

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        COSTING METHODOLOGY                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  TWO COSTING APPROACHES:                                                        │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                       STANDARD COSTING                                  │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │                                                                         │   │
│  │  Definition: Predetermined costs used for pricing and budgeting        │   │
│  │                                                                         │   │
│  │  Components:                                                            │   │
│  │  • Standard Material Cost    - Expected purchase price                  │   │
│  │  • Standard Labor Cost       - Expected processing time × rate          │   │
│  │  • Standard Overhead         - Allocated burden rate                    │   │
│  │                                                                         │   │
│  │  Use Cases:                                                             │   │
│  │  • Quoting and pricing                                                  │   │
│  │  • Budgeting and forecasting                                           │   │
│  │  • Inventory valuation (some methods)                                  │   │
│  │  • Performance measurement (variance analysis)                          │   │
│  │                                                                         │   │
│  │  Update Frequency: Monthly or quarterly review                         │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        ACTUAL COSTING                                   │   │
│  │  ─────────────────────────────────────────────────────────────────────  │   │
│  │                                                                         │   │
│  │  Definition: Real costs captured during transactions                   │   │
│  │                                                                         │   │
│  │  Components:                                                            │   │
│  │  • Actual Material Cost      - Invoice price paid                       │   │
│  │  • Actual Labor Cost         - Recorded processing time × rate          │   │
│  │  • Actual Overhead           - Period overhead allocation               │   │
│  │                                                                         │   │
│  │  Use Cases:                                                             │   │
│  │  • Job profitability analysis                                           │   │
│  │  • Inventory valuation (FIFO, weighted avg)                            │   │
│  │  • Cost variance reporting                                              │   │
│  │  • Margin analysis                                                      │   │
│  │                                                                         │   │
│  │  Capture: Real-time as transactions occur                              │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  VARIANCE ANALYSIS:                                                             │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  Cost Variance = Actual Cost - Standard Cost                           │   │
│  │                                                                         │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐ │   │
│  │  │ Variance Type        │ Formula                                    │ │   │
│  │  │ ─────────────────────│──────────────────────────────────────────  │ │   │
│  │  │ Material Price Var   │ (Actual Price - Std Price) × Actual Qty   │ │   │
│  │  │ Material Usage Var   │ (Actual Qty - Std Qty) × Std Price        │ │   │
│  │  │ Labor Rate Var       │ (Actual Rate - Std Rate) × Actual Hours   │ │   │
│  │  │ Labor Efficiency Var │ (Actual Hours - Std Hours) × Std Rate     │ │   │
│  │  │ Overhead Var         │ Actual Overhead - Applied Overhead         │ │   │
│  │  └───────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Cost Components

```typescript
interface ItemCost {
  itemId: string;
  
  // Standard costs (for pricing)
  standardCost: {
    material: number;          // Per unit
    labor: number;             // Per unit (if processing)
    overhead: number;          // Allocated
    total: number;
    effectiveDate: Date;
  };
  
  // Actual costs (for analysis)
  actualCost: {
    material: number;          // From receipt/invoice
    labor: number;             // From job tracking
    overhead: number;          // Period allocation
    total: number;
  };
  
  // Rolling costs
  lastCost: number;            // Most recent purchase
  averageCost: number;         // Weighted average
  fifoLayers: CostLayer[];     // For FIFO valuation
}

interface CostLayer {
  receiptDate: Date;
  quantity: number;
  unitCost: number;
  remainingQty: number;
}

interface JobCost {
  jobId: string;
  
  // Input materials
  materialsCost: {
    items: JobMaterialCost[];
    total: number;
  };
  
  // Labor
  laborCost: {
    operations: JobLaborCost[];
    total: number;
  };
  
  // Overhead
  overheadCost: {
    method: 'LABOR_HOURS' | 'MACHINE_HOURS' | 'MATERIAL_VALUE';
    rate: number;
    basis: number;
    total: number;
  };
  
  // Totals
  totalCost: number;
  costPerUnit: number;
  
  // Revenue comparison
  sellPrice: number;
  grossProfit: number;
  grossMargin: number;
}

interface JobMaterialCost {
  inventoryItemId: string;
  quantity: number;
  unitCost: number;           // Actual from inventory
  extendedCost: number;
  costMethod: 'FIFO' | 'AVG' | 'LAST' | 'SPECIFIC';
}

interface JobLaborCost {
  operationId: string;
  workCenterId: string;
  actualMinutes: number;
  laborRate: number;          // $/hour for operator
  machineRate: number;        // $/hour for equipment
  totalCost: number;
}
```

### 11.3 Cost Rollup Process

```typescript
class CostRollupService {
  
  // Calculate job cost when complete
  async calculateJobCost(jobId: string): Promise<JobCost> {
    const job = await this.jobService.getJob(jobId);
    
    // 1. Material costs - from consumed inventory
    const materialsCost = await this.calculateMaterialsCost(job);
    
    // 2. Labor costs - from time tracking
    const laborCost = await this.calculateLaborCost(job);
    
    // 3. Overhead allocation
    const overheadCost = await this.calculateOverhead(job, laborCost);
    
    // 4. Total
    const totalCost = materialsCost.total + laborCost.total + overheadCost.total;
    
    // 5. Compare to sell price
    const orderLine = await this.orderService.getOrderLine(job.orderLineId);
    const sellPrice = orderLine.extendedPrice;
    
    return {
      jobId,
      materialsCost,
      laborCost,
      overheadCost,
      totalCost,
      costPerUnit: totalCost / job.quantityProduced,
      sellPrice,
      grossProfit: sellPrice - totalCost,
      grossMargin: (sellPrice - totalCost) / sellPrice
    };
  }
  
  private async calculateMaterialsCost(job: Job): Promise<MaterialsCost> {
    const consumptions = await this.inventoryService.getJobConsumptions(job.id);
    
    const items = consumptions.map(c => ({
      inventoryItemId: c.itemId,
      quantity: c.quantity,
      unitCost: c.costAtConsumption,  // Captured at time of use
      extendedCost: c.quantity * c.costAtConsumption,
      costMethod: c.costMethod
    }));
    
    return {
      items,
      total: items.reduce((sum, i) => sum + i.extendedCost, 0)
    };
  }
  
  private async calculateLaborCost(job: Job): Promise<LaborCost> {
    const timeEntries = await this.shopFloorService.getJobTimeEntries(job.id);
    
    const operations = timeEntries.map(t => {
      const workCenter = this.getWorkCenter(t.workCenterId);
      return {
        operationId: t.operationId,
        workCenterId: t.workCenterId,
        actualMinutes: t.durationMinutes,
        laborRate: workCenter.laborRate,
        machineRate: workCenter.machineRate,
        totalCost: (t.durationMinutes / 60) * (workCenter.laborRate + workCenter.machineRate)
      };
    });
    
    return {
      operations,
      total: operations.reduce((sum, o) => sum + o.totalCost, 0)
    };
  }
  
  private async calculateOverhead(job: Job, laborCost: LaborCost): Promise<OverheadCost> {
    const config = await this.getOverheadConfig(job.divisionId);
    
    let basis: number;
    switch (config.method) {
      case 'LABOR_HOURS':
        basis = laborCost.operations.reduce((sum, o) => sum + o.actualMinutes, 0) / 60;
        break;
      case 'MACHINE_HOURS':
        basis = laborCost.operations.reduce((sum, o) => sum + o.actualMinutes, 0) / 60;
        break;
      case 'MATERIAL_VALUE':
        basis = job.materialValue;
        break;
    }
    
    return {
      method: config.method,
      rate: config.rate,
      basis,
      total: basis * config.rate
    };
  }
}
```

---

## 12. PRICING RULES MATRIX

### 12.1 Price Source Selection Rules

| Customer Type | Has Contract? | Has Price List? | Customer Tier | Price Source |
|---------------|:-------------:|:---------------:|:-------------:|--------------|
| Account | ✓ Valid | - | - | **Contract Price** |
| Account | ✗ Expired | ✓ | - | **Price List** |
| Account | ✗ | ✗ | Gold | Commodity × 0.88 |
| Account | ✗ | ✗ | Silver | Commodity × 0.92 |
| Account | ✗ | ✗ | Bronze | Commodity × 0.95 |
| Account | ✗ | ✗ | Standard | Commodity × 1.00 |
| Walk-In | - | - | - | **Retail Price** |
| Customer Portal | Inherits | Inherits | Inherits | Account pricing |

### 12.2 Discount Stacking Rules

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DISCOUNT STACKING RULES                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  RULE 1: Discount Hierarchy (NOT additive - highest wins)                       │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  Priority 1: Contract Price (overrides all)                                    │
│  Priority 2: Customer Price List                                               │
│  Priority 3: Customer Tier Discount                                            │
│  Priority 4: Quantity Break Discount                                           │
│  Priority 5: Promotional Discount                                              │
│                                                                                 │
│  RULE 2: Additive Discounts (can stack)                                        │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  The following CAN be added to the base price:                                 │
│  • Order Volume Discount (whole order threshold)                               │
│  • Early Payment Discount (applied at payment)                                 │
│  • Promotional/Sale Discount (if applicable)                                   │
│                                                                                 │
│  Maximum Combined Discount: 25% off calculated price                           │
│  Beyond 25% requires manager approval                                          │
│                                                                                 │
│  RULE 3: Processing Discounts                                                   │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  Processing charges can have separate discount:                                 │
│  • Contract customers may have processing discount                             │
│  • Processing discount ≠ material discount                                     │
│  • Tracked separately for margin analysis                                      │
│                                                                                 │
│  RULE 4: No Double-Dipping                                                      │
│  ───────────────────────────────────────────────────────────────────────────── │
│                                                                                 │
│  • Cannot combine contract price WITH tier discount                            │
│  • Cannot combine price list price WITH tier discount                          │
│  • Remnant discount cannot be combined with volume discount                    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 12.3 Price Override Rules

| Override Type | Who Can Override | Approval Required | Max Override |
|---------------|------------------|-------------------|--------------|
| Apply discount | Sales Rep | Self | 10% |
| Apply discount | Sales Mgr | Self | 20% |
| Override unit price | Sales Rep | Sales Mgr | Floor margin |
| Override unit price | Sales Mgr | Self | Floor margin |
| Below floor margin | Sales Mgr | Div Mgr | 0% margin |
| Below cost | Div Mgr | VP | N/A |
| Waive processing | Sales Rep | Sales Mgr | Full waiver |
| Waive freight | Sales Rep | Sales Mgr | $100 |
| Waive freight | Sales Mgr | Self | Full waiver |

---

## 13. UI CONCEPTS FOR PRICE OVERRIDE

### 13.1 Quote Line Pricing Panel

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ████ QUOTE LINE PRICING                                      Quote #Q-2026-1234 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                                 │
│  Product: A36 Plate 0.500" × 48" × 96"                                         │
│  Customer: ABC Manufacturing (Gold Tier)                                        │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │  PRICING SOURCE                                                           │ │
│  │  ○ Contract Price       $XX.XX/cwt    (Contract #C-2025-456 expires 6/30) │ │
│  │  ● Commodity + Margin   $65.38/cwt    (CRU + 22% target)                  │ │
│  │  ○ Customer Price List  N/A                                               │ │
│  │  ○ Manual Override      [___________]                                     │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │  PRICE BREAKDOWN                                     Cost      Sell       │ │
│  │  ─────────────────────────────────────────────────────────────────────── │ │
│  │  Base Material (6.534 cwt × $51.00)                 $333.23              │ │
│  │  × Target Margin (22%)                                        $427.17    │ │
│  │  + Gold Tier Discount (-12%)                                  ($51.26)   │ │
│  │  ─────────────────────────────────────────────────────────────────────── │ │
│  │  Material Subtotal                                  $333.23   $375.91    │ │
│  │                                                                           │ │
│  │  + Processing: Saw Cut (1)                          $12.00    $18.00     │ │
│  │  ─────────────────────────────────────────────────────────────────────── │ │
│  │  TOTAL                                              $345.23   $393.91    │ │
│  │                                                                           │ │
│  │  Gross Margin: $48.68 (12.4%)   ⚠️ Below target 22%                      │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │  ADJUSTMENTS                                                              │ │
│  │                                                                           │ │
│  │  Additional Discount: [____] %   or   [________] $                       │ │
│  │  Reason: [Competition▾]                                                   │ │
│  │                                                                           │ │
│  │  ⚠️ Current margin (12.4%) is below target (22%)                         │ │
│  │     Floor margin for this category: 10%                                   │ │
│  │                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  [Cancel] [Reset to Standard]                      [Apply Pricing] [Get Approval]│
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 13.2 Margin Warning Modal

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                        ⚠️  MARGIN WARNING                                       │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                           │ │
│  │   The pricing you've entered results in a margin below threshold:        │ │
│  │                                                                           │ │
│  │   ┌─────────────────────────────────────────────────────────────────┐    │ │
│  │   │                                                                 │    │ │
│  │   │   Current Margin:       8.5%   ─────●──────────────────────    │    │ │
│  │   │                                                                 │    │ │
│  │   │   Floor Margin:         10%    ─────────●──────────────────    │    │ │
│  │   │                                                                 │    │ │
│  │   │   Warning Threshold:    15%    ───────────────●────────────    │    │ │
│  │   │                                                                 │    │ │
│  │   │   Target Margin:        22%    ─────────────────────────●──    │    │ │
│  │   │                                                                 │    │ │
│  │   └─────────────────────────────────────────────────────────────────┘    │ │
│  │                                                                           │ │
│  │   This sale requires SALES MANAGER approval.                              │ │
│  │                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  REQUIRED: Select reason for below-margin pricing                               │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │  ○ Competitive situation                                                  │ │
│  │  ○ Strategic account                                                      │ │
│  │  ○ Large volume commitment                                                │ │
│  │  ○ Market conditions                                                      │ │
│  │  ○ Remnant/aged inventory clearance                                       │ │
│  │  ○ Other: [_________________________________________________]            │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  Notes for approver:                                                            │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                           │ │
│  │  Customer is comparing to competitor quote. Need to match to win         │ │
│  │  the business. They've committed to 3 additional orders this quarter.    │ │
│  │                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│        [Cancel]              [Save as Draft]              [Request Approval]    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 13.3 Manager Approval Queue

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ████ PRICING APPROVALS                                          Sales Manager   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                                 │
│  Pending Approvals (3)                                    [Filter▾] [Export]    │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │ □ │ Quote      │ Customer         │ Rep      │ Margin │ Value   │ Wait   │ │
│  │───│────────────│──────────────────│──────────│────────│─────────│────────│ │
│  │ □ │ Q-2026-1234│ ABC Manufacturing│ J. Smith │  8.5%  │ $2,450  │ 2h     │ │
│  │   │ Reason: Competitive situation                                        │ │
│  │   │ "Customer comparing to competitor quote..."                           │ │
│  │   │                                    [View Details] [Approve] [Reject]  │ │
│  │───│────────────│──────────────────│──────────│────────│─────────│────────│ │
│  │ □ │ Q-2026-1189│ XYZ Fabricators  │ M. Jones │ 11.2%  │ $8,920  │ 4h     │ │
│  │   │ Reason: Large volume commitment                                       │ │
│  │   │ "Customer committed to $50k/month if we match..."                    │ │
│  │   │                                    [View Details] [Approve] [Reject]  │ │
│  │───│────────────│──────────────────│──────────│────────│─────────│────────│ │
│  │ □ │ Q-2026-1201│ DEF Industries   │ J. Smith │  9.8%  │ $1,125  │ 1d     │ │
│  │   │ Reason: Remnant clearance                                             │ │
│  │   │ "Remnant aged 95 days, customer willing to take as-is"               │ │
│  │   │                                    [View Details] [Approve] [Reject]  │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  [Bulk Approve Selected]    [Bulk Reject Selected]                              │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  APPROVAL HISTORY (Last 7 days)                                                 │
│                                                                                 │
│  Total Requests: 28    Approved: 24 (86%)    Rejected: 4 (14%)                 │
│  Avg Approved Margin: 9.2%    Avg Wait Time: 3.4 hours                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 13.4 Contract Pricing Setup

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ████ CONTRACT PRICING SETUP                              Contract #C-2026-0089  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                                 │
│  Customer: ABC Manufacturing                                                    │
│  Contract Type: ○ Fixed Price  ● Formula-Based  ○ Discount Matrix              │
│                                                                                 │
│  Dates:                                                                         │
│  Effective: [01/01/2026]    Expiration: [12/31/2026]    Review: [07/01/2026]   │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  FORMULA BUILDER                                                                │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │  Applies To: [Aluminum Plate - All Alloys          ▾]                     │ │
│  │                                                                           │ │
│  │  FORMULA:                                                                 │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                                                                     │ │ │
│  │  │  [ LME Cash ▾ ]  ÷  [ 2204.62 ]  =  Base $/lb                      │ │ │
│  │  │                                                                     │ │ │
│  │  │  +  [ Midwest Premium ▾ ]  per lb                                   │ │ │
│  │  │                                                                     │ │ │
│  │  │  +  [ $0.25 ]  Alloy Adder per lb                                   │ │ │
│  │  │                                                                     │ │ │
│  │  │  +  [ $0.18 ]  Margin Adder per lb                                  │ │ │
│  │  │                                                                     │ │ │
│  │  │  [+ Add Component]                                                   │ │ │
│  │  │                                                                     │ │ │
│  │  └─────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                           │ │
│  │  Lock Period: ○ Daily  ● Weekly  ○ Monthly                               │ │
│  │  Price Set On: [ Monday ▾ ]  for following week                          │ │
│  │                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  PREVIEW (as of today)                                                          │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │  LME Cash:        $2,450.00/mt ÷ 2204.62 = $1.111/lb                     │ │
│  │  + MW Premium:    $0.185/lb                                               │ │
│  │  + Alloy Adder:   $0.250/lb                                               │ │
│  │  + Margin:        $0.180/lb                                               │ │
│  │  ─────────────────────────────────────────────────────────────────────── │ │
│  │  CONTRACT PRICE:  $1.726/lb                                               │ │
│  │                                                                           │ │
│  │  vs. Standard Price: $1.95/lb  (Discount: 11.5%)                         │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  [Cancel]   [Save Draft]   [Submit for Approval]                                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 14. SUMMARY

### Key Pricing Models

| Division | Primary Model | Secondary | Key Variables |
|----------|--------------|-----------|---------------|
| Steel | Commodity + Margin | Contract/Formula | CRU index, mill extras |
| Aluminum | LME + Premiums | Contract/Formula | LME, MW premium, alloy |
| Plastics | Resin + Form + Spec | Price List | Resin cost, form factor |
| Supplies | Catalog - Discount | Contract | List price, tier discount |

### Key Costing Principles

1. **Standard costs** for pricing decisions
2. **Actual costs** for profitability analysis
3. **Variance analysis** for continuous improvement
4. **Job costing** captures true cost per order

### Margin Control Summary

- **Three-tier system**: Target → Warning → Floor
- **Approval escalation** for below-threshold pricing
- **Audit trail** for all price decisions
- **Reason codes** for margin erosion analysis

---

**End of Pricing & Costing Architecture Specification**
