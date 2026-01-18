# Phase 14: E-Commerce Integration Architecture

**Document Version:** 1.0  
**Date:** January 17, 2026  
**Status:** Integration & Customer Portal Specification

---

## 1. EXECUTIVE SUMMARY

This document defines how the SteelWise platform integrates with external e-commerce storefronts (e.g., AlroOnlineStore, custom Shopify/Magento implementations) and provides a native customer self-service portal for order management, document access, and real-time visibility.

### Integration Goals

| Goal | Description | Priority |
|------|-------------|:--------:|
| **Catalog Sync** | Real-time product/inventory visibility on storefront | Critical |
| **Pricing Accuracy** | Customer-specific pricing reflected in e-commerce | Critical |
| **Seamless Orders** | E-commerce orders flow directly into fulfillment | Critical |
| **Self-Service** | Customers track orders, access documents | High |
| **RFQ Support** | Complex quotes handled outside standard cart | High |
| **Document Access** | MTRs, BOLs, COCs available on-demand | High |

### Integration Landscape

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     E-COMMERCE INTEGRATION LANDSCAPE                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  CUSTOMER TOUCHPOINTS                                                           │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │  E-Commerce   │  │   Customer    │  │    Mobile     │  │     EDI       │   │
│  │  Storefront   │  │    Portal     │  │     App       │  │   Partners    │   │
│  │               │  │               │  │               │  │               │   │
│  │ • Browse      │  │ • Order Track │  │ • Quick Order │  │ • 850 PO      │   │
│  │ • Cart        │  │ • Documents   │  │ • Scan & Buy  │  │ • 855 Ack     │   │
│  │ • Checkout    │  │ • Invoices    │  │ • Notifications│ │ • 856 ASN     │   │
│  │ • Account     │  │ • RFQ         │  │ • Document    │  │ • 810 Invoice │   │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘   │
│          │                  │                  │                  │            │
│          └──────────────────┴──────────────────┴──────────────────┘            │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      STEELWISE INTEGRATION LAYER                        │   │
│  │                                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │   Catalog   │  │   Pricing   │  │    Order    │  │  Document   │    │   │
│  │  │     API     │  │     API     │  │     API     │  │     API     │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  │                                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │  Inventory  │  │    Quote    │  │   Status    │  │   Webhook   │    │   │
│  │  │     API     │  │     API     │  │     API     │  │   Events    │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      STEELWISE CORE PLATFORM                            │   │
│  │                                                                         │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │   │
│  │  │ Product │ │Inventory│ │  Order  │ │  Shop   │ │Shipping │           │   │
│  │  │ Catalog │ │         │ │ Mgmt    │ │  Floor  │ │         │           │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CATALOG INTEGRATION

### 2.1 Product Data Model for E-Commerce

```typescript
interface EcommerceProduct {
  // Identifiers
  productId: string;              // Internal SteelWise ID
  sku: string;                    // External SKU for storefront
  externalIds: {
    shopifySku?: string;
    magentoSku?: string;
    erpItemNumber?: string;
  };
  
  // Classification
  division: 'STL' | 'ALU' | 'PLA' | 'SPC' | 'SUP';
  category: string;               // Steel > Flat > Sheet
  subcategory: string;
  productType: 'STOCK' | 'MADE_TO_ORDER' | 'SPECIAL_ORDER';
  
  // Display
  name: string;
  shortDescription: string;
  longDescription: string;
  specifications: ProductSpec[];
  images: ProductImage[];
  documents: ProductDocument[];
  
  // Dimensions (for dimensional products)
  dimensions?: {
    thickness?: DimensionSpec;
    width?: DimensionSpec;
    length?: DimensionSpec;
    diameter?: DimensionSpec;
    wallThickness?: DimensionSpec;
  };
  
  // Material properties
  material?: {
    grade: string;               // A36, 304, 6061-T6
    specification: string;       // ASTM A36
    finish?: string;             // Hot Rolled, Mill Finish
    temper?: string;
  };
  
  // Units & Pricing
  baseUom: 'EA' | 'LB' | 'FT' | 'SF' | 'CWT' | 'TON';
  alternateUoms: UomConversion[];
  priceVisibility: 'PUBLIC' | 'LOGIN_REQUIRED' | 'QUOTE_ONLY';
  
  // Availability
  availabilityStatus: 'IN_STOCK' | 'LOW_STOCK' | 'MADE_TO_ORDER' | 'DISCONTINUED';
  leadTimeDays?: number;
  
  // E-commerce flags
  webVisible: boolean;
  searchable: boolean;
  featured: boolean;
  tags: string[];
  
  // SEO
  seo: {
    metaTitle: string;
    metaDescription: string;
    urlSlug: string;
  };
}

interface DimensionSpec {
  value: number;
  unit: 'IN' | 'MM' | 'FT';
  tolerance?: { min: number; max: number };
}

interface ProductSpec {
  name: string;                  // "Yield Strength"
  value: string;                 // "36,000 PSI min"
  unit?: string;
  displayOrder: number;
}
```

### 2.2 Catalog Sync Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        CATALOG SYNC ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  SYNC STRATEGY: PUSH-BASED WITH POLLING FALLBACK                               │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│                          STEELWISE                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │   │
│  │  │  Product        │────▶│  Change         │────▶│  Sync           │   │   │
│  │  │  Catalog        │     │  Detection      │     │  Queue          │   │   │
│  │  │  (Master)       │     │                 │     │                 │   │   │
│  │  └─────────────────┘     └─────────────────┘     └────────┬────────┘   │   │
│  │                                                           │             │   │
│  │                                                           │             │   │
│  │  Triggers:                                                │             │   │
│  │  • Product created/updated                                │             │   │
│  │  • Price change                                           │             │   │
│  │  • Inventory level change                                 │             │   │
│  │  • Availability status change                             │             │   │
│  │                                                           │             │   │
│  └───────────────────────────────────────────────────────────┼─────────────┘   │
│                                                              │                  │
│                              ┌────────────────────────────────┘                  │
│                              │                                                   │
│                              ▼                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        INTEGRATION HUB                                  │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  Transformation Engine                                          │   │   │
│  │  │  • Map SteelWise schema → Storefront schema                     │   │   │
│  │  │  • Apply storefront-specific rules                              │   │   │
│  │  │  • Handle unit conversions                                      │   │   │
│  │  │  • Generate SEO content                                          │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                              │                                                   │
│         ┌────────────────────┼────────────────────┐                             │
│         │                    │                    │                             │
│         ▼                    ▼                    ▼                             │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                     │
│  │  Shopify    │      │   Magento   │      │   Custom    │                     │
│  │  Adapter    │      │   Adapter   │      │  Storefront │                     │
│  │             │      │             │      │   Adapter   │                     │
│  │ GraphQL API │      │  REST API   │      │   Webhook   │                     │
│  └─────────────┘      └─────────────┘      └─────────────┘                     │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  SYNC FREQUENCIES:                                                              │
│                                                                                 │
│  • Product metadata    → On change + daily full sync                           │
│  • Inventory levels    → Every 5 minutes (high-velocity items: real-time)      │
│  • Pricing             → On change + hourly refresh                            │
│  • Images/Documents    → On change only                                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Catalog API Endpoints

```typescript
// GET /api/v1/catalog/products
// List products with filtering
interface ProductListRequest {
  division?: string[];
  category?: string[];
  material?: string[];
  inStock?: boolean;
  webVisible?: boolean;
  modifiedSince?: Date;          // For incremental sync
  page?: number;
  pageSize?: number;             // Max 100
}

interface ProductListResponse {
  products: EcommerceProduct[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  syncToken: string;             // For next incremental sync
}

// GET /api/v1/catalog/products/{productId}
// Single product detail

// GET /api/v1/catalog/products/bulk
// Bulk product fetch by IDs
interface BulkProductRequest {
  productIds: string[];          // Max 500
  fields?: string[];             // Sparse fieldset
}

// GET /api/v1/catalog/categories
// Category tree for navigation

// GET /api/v1/catalog/search
// Product search with facets
interface ProductSearchRequest {
  query: string;
  filters?: {
    division?: string[];
    category?: string[];
    thickness?: { min?: number; max?: number };
    width?: { min?: number; max?: number };
    grade?: string[];
    inStock?: boolean;
  };
  facets?: string[];             // Fields to return facet counts
  sort?: 'relevance' | 'name' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
}

// Webhook for real-time updates
// POST {storefront_webhook_url}
interface CatalogChangeWebhook {
  eventType: 'product.created' | 'product.updated' | 'product.deleted' | 
             'inventory.updated' | 'price.updated';
  timestamp: Date;
  productId: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}
```

---

## 3. PRICING INTEGRATION

### 3.1 Pricing Tiers & Customer-Specific Pricing

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PRICING HIERARCHY                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PRICE RESOLUTION ORDER (First match wins)                                      │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  1. CONTRACT PRICE                                                              │
│     ┌─────────────────────────────────────────────────────────────────────┐    │
│     │ Customer ABC has contract: A36 Sheet = $0.42/lb through 2026-12-31  │    │
│     │ → Use $0.42/lb                                                       │    │
│     └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                                   │
│                              ▼ (if no contract)                                  │
│  2. CUSTOMER-SPECIFIC PRICE                                                     │
│     ┌─────────────────────────────────────────────────────────────────────┐    │
│     │ Customer ABC has negotiated: 12% off list on all Steel Flat         │    │
│     │ → Apply 12% discount to list price                                  │    │
│     └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                                   │
│                              ▼ (if no customer-specific)                         │
│  3. PRICE TIER                                                                  │
│     ┌─────────────────────────────────────────────────────────────────────┐    │
│     │ Customer ABC is Tier: GOLD (8% off list)                            │    │
│     │ → Apply 8% discount to list price                                   │    │
│     └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                                   │
│                              ▼ (if no tier)                                      │
│  4. VOLUME DISCOUNT                                                             │
│     ┌─────────────────────────────────────────────────────────────────────┐    │
│     │ Order qty 500+ lbs: 5% off                                          │    │
│     │ → Apply volume discount                                              │    │
│     └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                                   │
│                              ▼ (if no volume discount applies)                   │
│  5. LIST PRICE                                                                  │
│     ┌─────────────────────────────────────────────────────────────────────┐    │
│     │ Base commodity price + margin                                        │    │
│     │ → Use calculated list price                                          │    │
│     └─────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  PRICE VISIBILITY MODES:                                                        │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │     PUBLIC      │  │  LOGIN_REQUIRED │  │   QUOTE_ONLY    │                 │
│  │                 │  │                 │  │                 │                 │
│  │ Show list price │  │ Show customer's │  │ "Request Quote" │                 │
│  │ to all visitors │  │ price after     │  │ - No price      │                 │
│  │                 │  │ authentication  │  │   displayed     │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Pricing API Endpoints

```typescript
// GET /api/v1/pricing/products/{productId}
// Get price for a single product
interface ProductPriceRequest {
  productId: string;
  customerId?: string;           // For customer-specific pricing
  quantity?: number;             // For volume discounts
  uom?: string;                  // Price in specific UOM
}

interface ProductPriceResponse {
  productId: string;
  customerId?: string;
  
  // Price breakdown
  pricing: {
    listPrice: MoneyAmount;
    customerPrice: MoneyAmount;
    discountAmount: MoneyAmount;
    discountPercent: number;
    discountSource: 'CONTRACT' | 'CUSTOMER' | 'TIER' | 'VOLUME' | 'NONE';
  };
  
  // Volume breaks (if applicable)
  volumeBreaks?: {
    minQty: number;
    maxQty?: number;
    price: MoneyAmount;
    discountPercent: number;
  }[];
  
  // Price validity
  validFrom: Date;
  validUntil?: Date;
  priceListId: string;
  
  // Flags
  isEstimate: boolean;           // True for volatile commodity pricing
  requiresQuote: boolean;        // True for quote-only products
}

interface MoneyAmount {
  amount: number;
  currency: string;              // USD
  per: string;                   // LB, FT, EA
}

// POST /api/v1/pricing/cart
// Price an entire cart (batch pricing)
interface CartPricingRequest {
  customerId?: string;
  items: {
    productId: string;
    quantity: number;
    uom: string;
    processingOptions?: ProcessingOption[];
  }[];
}

interface CartPricingResponse {
  customerId?: string;
  items: {
    productId: string;
    quantity: number;
    uom: string;
    unitPrice: MoneyAmount;
    extendedPrice: MoneyAmount;
    processingCharges?: MoneyAmount;
    discounts: DiscountDetail[];
  }[];
  
  subtotal: MoneyAmount;
  estimatedTax?: MoneyAmount;
  estimatedShipping?: MoneyAmount;
  estimatedTotal: MoneyAmount;
  
  validUntil: Date;              // Price guarantee window
}

// POST /api/v1/pricing/refresh
// Refresh prices for storefront (webhook trigger)
interface PriceRefreshRequest {
  scope: 'ALL' | 'DIVISION' | 'CATEGORY' | 'PRODUCTS';
  divisionIds?: string[];
  categoryIds?: string[];
  productIds?: string[];
  reason: 'COMMODITY_UPDATE' | 'MANUAL' | 'SCHEDULED';
}
```

### 3.3 Real-Time Price Updates

```typescript
// Price change event stream
interface PriceChangeEvent {
  eventId: string;
  eventType: 'PRICE_UPDATED' | 'PRICE_EXPIRED' | 'CONTRACT_ACTIVATED' | 'CONTRACT_EXPIRED';
  timestamp: Date;
  
  // Scope
  scope: {
    affectedProducts: string[];   // Product IDs
    affectedCustomers?: string[]; // Customer IDs (for customer-specific changes)
  };
  
  // Change details
  change: {
    field: 'listPrice' | 'commodityBase' | 'margin' | 'discount';
    oldValue?: number;
    newValue: number;
    percentChange?: number;
  };
  
  // Reason
  reason: string;
  triggeredBy: 'COMMODITY_INDEX' | 'MANUAL' | 'CONTRACT' | 'SCHEDULED';
}

// Storefront integration: Poll or subscribe
class StorefrontPriceSync {
  
  // Option 1: Webhook subscription
  async subscribeToPriceChanges(webhookUrl: string): Promise<void> {
    await webhookRegistry.subscribe({
      url: webhookUrl,
      events: ['PRICE_UPDATED', 'PRICE_EXPIRED'],
      filters: {
        webVisibleOnly: true
      }
    });
  }
  
  // Option 2: Polling with change token
  async pollPriceChanges(sinceToken: string): Promise<PriceChangeBatch> {
    return await api.get('/pricing/changes', { 
      params: { sinceToken } 
    });
  }
}
```

---

## 4. INVENTORY INTEGRATION

### 4.1 Inventory Data Model for E-Commerce

```typescript
interface ProductInventory {
  productId: string;
  locationId: string;            // Warehouse location
  
  // Quantities
  quantityOnHand: number;        // Physical inventory
  quantityAvailable: number;     // On hand - allocated - reserved
  quantityAllocated: number;     // Committed to orders
  quantityOnOrder: number;       // Purchase orders in transit
  
  // Units
  uom: string;
  
  // Availability
  availabilityStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'BACKORDER';
  lowStockThreshold: number;
  
  // Timing
  restockDate?: Date;            // Expected restock if out
  leadTimeDays?: number;         // For made-to-order
  
  // Location details (for multi-warehouse visibility)
  location: {
    locationId: string;
    locationName: string;
    city: string;
    state: string;
    canShipTo: string[];         // States/regions this location ships to
  };
}

// Aggregated view for storefront
interface ProductInventorySummary {
  productId: string;
  
  // Aggregate across locations
  totalAvailable: number;
  availabilityStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'BACKORDER';
  
  // Best fulfillment option
  fastestShipFrom?: {
    locationId: string;
    locationName: string;
    quantityAvailable: number;
    estimatedShipDays: number;
  };
  
  // Per-location breakdown (optional detail)
  byLocation?: ProductInventory[];
  
  // Timestamps
  lastUpdated: Date;
  nextRefresh: Date;
}
```

### 4.2 Inventory API Endpoints

```typescript
// GET /api/v1/inventory/products/{productId}
// Inventory for single product
interface InventoryRequest {
  productId: string;
  locationId?: string;           // Specific location or aggregate
  includeLocationBreakdown?: boolean;
}

// GET /api/v1/inventory/products/bulk
// Bulk inventory check
interface BulkInventoryRequest {
  productIds: string[];          // Max 100
  locationId?: string;
}

// POST /api/v1/inventory/availability-check
// Check if order can be fulfilled
interface AvailabilityCheckRequest {
  items: {
    productId: string;
    quantity: number;
    uom: string;
  }[];
  shipToZip?: string;            // For location selection
  requestedDeliveryDate?: Date;
}

interface AvailabilityCheckResponse {
  canFulfill: boolean;
  items: {
    productId: string;
    requestedQty: number;
    availableQty: number;
    status: 'AVAILABLE' | 'PARTIAL' | 'BACKORDER' | 'UNAVAILABLE';
    fulfillmentOptions: {
      locationId: string;
      locationName: string;
      quantity: number;
      estimatedShipDate: Date;
      estimatedDeliveryDate?: Date;
    }[];
  }[];
  
  // Aggregate
  allAvailable: boolean;
  partiallyAvailable: boolean;
  estimatedShipDate: Date;
}

// POST /api/v1/inventory/reserve
// Soft reserve inventory (pre-checkout)
interface InventoryReserveRequest {
  sessionId: string;             // Cart session
  items: {
    productId: string;
    quantity: number;
    locationId: string;
  }[];
  ttlMinutes?: number;           // Default 15 minutes
}

interface InventoryReserveResponse {
  reservationId: string;
  expiresAt: Date;
  items: {
    productId: string;
    quantity: number;
    reserved: boolean;
    reason?: string;
  }[];
}
```

---

## 5. RFQ → QUOTE → ORDER PIPELINE

### 5.1 Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    RFQ → QUOTE → ORDER PIPELINE                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  CUSTOMER JOURNEY                                                               │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │    BROWSING              CART                  CHECKOUT                 │   │
│  │    ─────────            ─────                  ────────                 │   │
│  │                                                                         │   │
│  │    ┌───────────┐       ┌───────────┐          ┌───────────┐            │   │
│  │    │  Standard │──────▶│   Cart    │─────────▶│  Order    │            │   │
│  │    │  Products │       │           │          │  Created  │            │   │
│  │    │  (Priced) │       │           │          │           │            │   │
│  │    └───────────┘       └───────────┘          └───────────┘            │   │
│  │                                                     │                   │   │
│  │                                                     ▼                   │   │
│  │                                               FULFILLMENT               │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  RFQ PATH (for complex/quote-only products)                             │   │
│  │                                                                         │   │
│  │  ┌───────────┐       ┌───────────┐       ┌───────────┐                 │   │
│  │  │  Complex  │──────▶│   RFQ     │──────▶│   Quote   │                 │   │
│  │  │  Product  │       │  Submit   │       │  Created  │                 │   │
│  │  │ (No Price)│       │           │       │ (Pending) │                 │   │
│  │  └───────────┘       └───────────┘       └─────┬─────┘                 │   │
│  │                                                │                        │   │
│  │       ┌────────────────────────────────────────┘                        │   │
│  │       │                                                                 │   │
│  │       ▼                                                                 │   │
│  │  ┌───────────┐       ┌───────────┐       ┌───────────┐                 │   │
│  │  │  Sales    │──────▶│   Quote   │──────▶│  Customer │                 │   │
│  │  │  Review   │       │  Issued   │       │  Accepts  │                 │   │
│  │  │           │       │           │       │           │                 │   │
│  │  └───────────┘       └───────────┘       └─────┬─────┘                 │   │
│  │                                                │                        │   │
│  │                                                ▼                        │   │
│  │                                          ┌───────────┐                 │   │
│  │                                          │   Order   │                 │   │
│  │                                          │  Created  │                 │   │
│  │                                          └───────────┘                 │   │
│  │                                                │                        │   │
│  │                                                ▼                        │   │
│  │                                          FULFILLMENT                    │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 RFQ Data Model

```typescript
interface RequestForQuote {
  rfqId: string;
  rfqNumber: string;             // Human-readable (RFQ-2026-00123)
  
  // Customer
  customerId: string;
  customerName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  
  // Source
  source: 'ECOMMERCE' | 'PORTAL' | 'EMAIL' | 'PHONE';
  sourceUrl?: string;            // Page where RFQ was submitted
  
  // Status
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'QUOTED' | 'EXPIRED' | 'CANCELLED';
  submittedAt: Date;
  quoteDueDate?: Date;           // Customer's requested response date
  assignedTo?: string;           // Sales rep
  
  // Items
  items: RfqItem[];
  
  // Additional info
  projectName?: string;
  specialRequirements?: string;
  attachments: Attachment[];
  
  // Resulting quote (if created)
  quoteId?: string;
}

interface RfqItem {
  lineNumber: number;
  
  // Product (if known)
  productId?: string;
  productSku?: string;
  
  // Description (customer's words)
  description: string;           // "1/4 inch A36 plate, mill cert required"
  
  // Quantity
  quantity: number;
  uom: string;
  
  // Dimensions (if applicable)
  dimensions?: {
    thickness?: string;
    width?: string;
    length?: string;
  };
  
  // Requirements
  grade?: string;
  specification?: string;
  processing?: string[];         // ["Cut to size", "Deburr edges"]
  certification?: string[];      // ["Domestic", "Mill cert"]
  
  // Customer's target (optional)
  targetPrice?: number;
  targetPriceUom?: string;
}
```

### 5.3 Quote Data Model

```typescript
interface Quote {
  quoteId: string;
  quoteNumber: string;           // Q-2026-00456
  
  // Linkage
  rfqId?: string;                // If from RFQ
  customerId: string;
  
  // Status
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'ISSUED' | 'ACCEPTED' | 
          'REJECTED' | 'EXPIRED' | 'CONVERTED';
  
  // Dates
  createdAt: Date;
  issuedAt?: Date;
  validUntil: Date;              // Quote expiration
  acceptedAt?: Date;
  
  // Sales
  salesRepId: string;
  salesRepName: string;
  
  // Items
  items: QuoteItem[];
  
  // Totals
  subtotal: MoneyAmount;
  discounts: DiscountDetail[];
  shipping?: ShippingEstimate;
  tax?: TaxEstimate;
  total: MoneyAmount;
  
  // Terms
  paymentTerms: string;          // "Net 30"
  deliveryTerms: string;         // "FOB Origin"
  estimatedDelivery: string;
  
  // Notes
  internalNotes?: string;
  customerNotes?: string;
  termsAndConditions: string;
  
  // Resulting order
  orderId?: string;
}

interface QuoteItem {
  lineNumber: number;
  productId: string;
  productSku: string;
  productName: string;
  description: string;
  
  // Quantity & Price
  quantity: number;
  uom: string;
  unitPrice: MoneyAmount;
  extendedPrice: MoneyAmount;
  
  // Processing
  processing?: {
    type: string;
    description: string;
    charge: MoneyAmount;
  }[];
  
  // Availability
  availability: 'IN_STOCK' | 'PRODUCTION' | 'SPECIAL_ORDER';
  leadTimeDays: number;
  
  // Margin (internal)
  costBasis?: MoneyAmount;
  marginPercent?: number;
}
```

### 5.4 Quote API Endpoints

```typescript
// POST /api/v1/rfqs
// Submit RFQ from storefront
interface CreateRfqRequest {
  customer: {
    customerId?: string;         // Existing customer
    // Or new contact info
    companyName?: string;
    contactName: string;
    email: string;
    phone?: string;
  };
  items: RfqItem[];
  projectName?: string;
  requirements?: string;
  attachments?: string[];        // Uploaded file IDs
  responseDueDate?: Date;
}

// GET /api/v1/rfqs/{rfqId}
// Get RFQ status (customer portal)

// GET /api/v1/quotes
// List quotes for customer
interface QuoteListRequest {
  customerId: string;
  status?: string[];
  page?: number;
  pageSize?: number;
}

// GET /api/v1/quotes/{quoteId}
// Get quote details

// POST /api/v1/quotes/{quoteId}/accept
// Customer accepts quote → creates order
interface AcceptQuoteRequest {
  quoteId: string;
  purchaseOrderNumber?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  notes?: string;
}

interface AcceptQuoteResponse {
  orderId: string;
  orderNumber: string;
  estimatedShipDate: Date;
  estimatedDeliveryDate?: Date;
}

// POST /api/v1/quotes/{quoteId}/reject
// Customer rejects quote
interface RejectQuoteRequest {
  quoteId: string;
  reason?: string;
}
```

### 5.5 Order Creation from E-Commerce

```typescript
// POST /api/v1/orders
// Create order from e-commerce checkout
interface CreateOrderRequest {
  // Source
  source: 'ECOMMERCE' | 'PORTAL' | 'QUOTE' | 'EDI';
  externalOrderId?: string;      // Storefront order ID
  quoteId?: string;              // If converting from quote
  
  // Customer
  customerId: string;
  purchaseOrderNumber?: string;
  
  // Addresses
  shippingAddress: Address;
  billingAddress: Address;
  
  // Items
  items: OrderItemRequest[];
  
  // Shipping
  shippingMethod: string;
  requestedDeliveryDate?: Date;
  shippingInstructions?: string;
  
  // Payment
  paymentMethod: 'INVOICE' | 'CREDIT_CARD' | 'PREPAID';
  paymentDetails?: PaymentDetails;
  
  // Notes
  customerNotes?: string;
}

interface OrderItemRequest {
  productId: string;
  quantity: number;
  uom: string;
  unitPrice: MoneyAmount;        // Agreed price
  processing?: ProcessingOption[];
  lineNotes?: string;
}

interface CreateOrderResponse {
  orderId: string;
  orderNumber: string;
  status: string;
  estimatedShipDate: Date;
  estimatedDeliveryDate?: Date;
  total: MoneyAmount;
  
  // For inventory tracking
  reservationId?: string;
}
```

---

## 6. CUSTOMER STATUS VISIBILITY

### 6.1 Order Tracking Data Model

```typescript
interface CustomerOrderView {
  orderId: string;
  orderNumber: string;
  purchaseOrderNumber?: string;
  
  // Status
  status: OrderStatus;
  statusDisplay: string;         // Human-readable
  statusUpdatedAt: Date;
  
  // Dates
  orderDate: Date;
  estimatedShipDate?: Date;
  actualShipDate?: Date;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  
  // Summary
  itemCount: number;
  totalAmount: MoneyAmount;
  
  // Line items (summary)
  items: CustomerOrderItemView[];
  
  // Shipping
  shipments: CustomerShipmentView[];
  
  // Documents (available for download)
  documents: DocumentLink[];
  
  // Timeline
  timeline: OrderTimelineEvent[];
}

interface CustomerOrderItemView {
  lineNumber: number;
  productName: string;
  productSku: string;
  quantity: number;
  uom: string;
  unitPrice: MoneyAmount;
  extendedPrice: MoneyAmount;
  
  // Item status
  status: 'PENDING' | 'IN_PRODUCTION' | 'READY' | 'SHIPPED' | 'DELIVERED';
  quantityShipped: number;
  quantityRemaining: number;
  
  // Processing status (if applicable)
  processingStatus?: {
    operation: string;
    status: string;
    completedAt?: Date;
  };
}

interface CustomerShipmentView {
  shipmentId: string;
  shipmentNumber: string;
  status: 'PREPARING' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED';
  
  // Carrier
  carrier: string;
  trackingNumber?: string;
  trackingUrl?: string;
  
  // Dates
  shippedDate?: Date;
  estimatedDeliveryDate?: Date;
  deliveredDate?: Date;
  
  // Contents
  packages: {
    packageNumber: string;
    weight: string;
    items: {
      productSku: string;
      productName: string;
      quantity: number;
    }[];
  }[];
  
  // Documents
  documents: DocumentLink[];
}

interface OrderTimelineEvent {
  timestamp: Date;
  event: string;                 // "Order Placed", "In Production", "Shipped"
  description: string;
  actor?: string;                // "System", "John (Sales)"
}
```

### 6.2 Status Visibility API

```typescript
// GET /api/v1/customer/orders
// List customer's orders
interface CustomerOrderListRequest {
  status?: string[];             // Filter by status
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;               // PO number, order number
  page?: number;
  pageSize?: number;
}

// GET /api/v1/customer/orders/{orderId}
// Full order detail

// GET /api/v1/customer/orders/{orderId}/timeline
// Order event timeline

// GET /api/v1/customer/shipments
// List customer's shipments (across orders)

// GET /api/v1/customer/shipments/{shipmentId}/track
// Real-time tracking info
interface ShipmentTrackingResponse {
  shipmentId: string;
  carrier: string;
  trackingNumber: string;
  status: string;
  
  // Location
  currentLocation?: {
    city: string;
    state: string;
    timestamp: Date;
  };
  
  // Dates
  estimatedDelivery?: Date;
  
  // Events from carrier
  events: {
    timestamp: Date;
    location: string;
    status: string;
    description: string;
  }[];
}

// WebSocket for real-time updates
// ws://api/v1/customer/orders/{orderId}/updates
interface OrderUpdateMessage {
  type: 'STATUS_CHANGE' | 'SHIPMENT_UPDATE' | 'DOCUMENT_AVAILABLE' | 'ETA_CHANGE';
  orderId: string;
  timestamp: Date;
  payload: any;
}
```

### 6.3 Customer Notification Preferences

```typescript
interface CustomerNotificationPreferences {
  customerId: string;
  
  // Email notifications
  email: {
    orderConfirmation: boolean;
    orderStatusChange: boolean;
    shipmentNotification: boolean;
    deliveryConfirmation: boolean;
    quoteReceived: boolean;
    invoiceReady: boolean;
    documentAvailable: boolean;
    
    // Digest vs real-time
    deliveryMethod: 'IMMEDIATE' | 'DAILY_DIGEST';
    digestTime?: string;         // "08:00"
  };
  
  // SMS notifications
  sms: {
    enabled: boolean;
    phoneNumber?: string;
    shipmentNotification: boolean;
    deliveryConfirmation: boolean;
  };
  
  // Webhook notifications (for B2B integration)
  webhook?: {
    enabled: boolean;
    url: string;
    events: string[];
    secret: string;
  };
}
```

---

## 7. DOCUMENT ACCESS

### 7.1 Document Types

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    CUSTOMER-ACCESSIBLE DOCUMENTS                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ORDER DOCUMENTS                                                                │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Document Type       │ Generated When      │ Access Level              │   │
│  │ ────────────────────│─────────────────────│─────────────────────────  │   │
│  │ Order Confirmation  │ Order placed        │ Customer                  │   │
│  │ Quote               │ Quote issued        │ Customer                  │   │
│  │ Invoice             │ Order shipped       │ Customer, Billing         │   │
│  │ Packing List        │ Shipment created    │ Customer                  │   │
│  │ Bill of Lading (BOL)│ Shipment departed   │ Customer, Carrier         │   │
│  │ Proof of Delivery   │ Delivery confirmed  │ Customer                  │   │
│  │ Credit Memo         │ Return processed    │ Customer, Billing         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  MATERIAL CERTIFICATIONS                                                        │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Document Type       │ Source              │ Access Level              │   │
│  │ ────────────────────│─────────────────────│─────────────────────────  │   │
│  │ Mill Test Report    │ From supplier       │ Customer (by order line)  │   │
│  │ (MTR)               │                     │                           │   │
│  │ Certificate of      │ Generated or mill   │ Customer (by order line)  │   │
│  │ Conformance (COC)   │                     │                           │   │
│  │ Material            │ From supplier/mill  │ Customer (by order line)  │   │
│  │ Specification       │                     │                           │   │
│  │ Heat Certificate    │ From mill           │ Customer (linked to       │   │
│  │                     │                     │ specific heat/coil)       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  PRODUCT DOCUMENTS (GENERAL)                                                    │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Document Type       │ Access Level                                     │   │
│  │ ────────────────────│─────────────────────────────────────────────────  │   │
│  │ Product Data Sheet  │ Public                                           │   │
│  │ Safety Data Sheet   │ Public                                           │   │
│  │ (SDS/MSDS)          │                                                  │   │
│  │ Technical Guide     │ Public or Login Required                         │   │
│  │ CAD Drawings        │ Login Required                                   │   │
│  │ Installation Guide  │ Public                                           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Document API Endpoints

```typescript
// GET /api/v1/customer/documents
// List all documents for customer
interface CustomerDocumentListRequest {
  documentType?: string[];
  orderId?: string;
  shipmentId?: string;
  productId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

interface CustomerDocumentListResponse {
  documents: DocumentSummary[];
  pagination: Pagination;
}

interface DocumentSummary {
  documentId: string;
  documentType: string;
  documentName: string;
  description?: string;
  
  // Related entities
  orderId?: string;
  orderNumber?: string;
  shipmentId?: string;
  productId?: string;
  productSku?: string;
  
  // Metadata
  createdAt: Date;
  fileSize: number;
  mimeType: string;
  
  // Access
  downloadUrl: string;           // Signed URL (expires)
  previewAvailable: boolean;
}

// GET /api/v1/customer/documents/{documentId}
// Get document metadata

// GET /api/v1/customer/documents/{documentId}/download
// Download document (returns signed URL or streams file)
interface DocumentDownloadRequest {
  documentId: string;
  format?: 'PDF' | 'ORIGINAL';   // Some docs can be converted
}

// GET /api/v1/customer/orders/{orderId}/documents
// All documents for an order

// GET /api/v1/customer/orders/{orderId}/mtr
// Get MTRs for order (convenience endpoint)
interface MtrRequest {
  orderId: string;
  lineNumbers?: number[];        // Specific lines, or all
  format?: 'INDIVIDUAL' | 'COMBINED';  // Combined into single PDF
}

interface MtrResponse {
  orderId: string;
  documents: {
    lineNumber: number;
    productSku: string;
    heatNumber: string;
    mtrDocument: DocumentSummary;
  }[];
  combinedDocument?: DocumentSummary;  // If requested
}

// POST /api/v1/customer/documents/request
// Request a document that's not yet available
interface DocumentRequestRequest {
  orderId: string;
  documentType: 'MTR' | 'COC' | 'BOL' | 'OTHER';
  lineNumbers?: number[];
  notes?: string;
}
```

### 7.3 Document Generation & Linking

```typescript
// Internal: Link MTR to order line
interface MtrLinkage {
  orderLineId: string;
  productId: string;
  heatNumber: string;
  
  // Source MTR
  mtrDocumentId: string;
  mtrSource: 'MILL' | 'SUPPLIER' | 'INTERNAL_LAB';
  
  // Traceability
  coilId?: string;
  lotNumber?: string;
  
  // Verification
  verifiedBy?: string;
  verifiedAt?: Date;
}

// Auto-link MTR when processing
async function linkMtrToOrderLine(
  orderLineId: string, 
  inventoryUnitId: string
): Promise<void> {
  // Get inventory unit's heat info
  const unit = await inventoryRepo.getUnit(inventoryUnitId);
  const heat = await heatRepo.getByNumber(unit.heatNumber);
  
  // Find or create MTR document
  let mtrDoc = await documentRepo.findMtr(heat.heatNumber);
  
  if (!mtrDoc && heat.millMtrUrl) {
    // Import from mill
    mtrDoc = await documentService.importFromUrl(heat.millMtrUrl, {
      type: 'MTR',
      heatNumber: heat.heatNumber
    });
  }
  
  // Create linkage
  await mtrLinkageRepo.create({
    orderLineId,
    productId: unit.productId,
    heatNumber: heat.heatNumber,
    mtrDocumentId: mtrDoc.documentId,
    mtrSource: heat.millMtrUrl ? 'MILL' : 'SUPPLIER'
  });
  
  // Notify customer if they subscribed
  await notificationService.documentAvailable(orderLineId, 'MTR');
}
```

---

## 8. CUSTOMER PORTAL UX MODEL

### 8.1 Portal Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      CUSTOMER PORTAL ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           CUSTOMER PORTAL                               │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │                        HEADER / NAV                             │   │   │
│  │  │  [Logo] Dashboard  Orders  Quotes  Shipments  Documents  Account│   │   │
│  │  │                                          [Search] [Notifications]│   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │                        MAIN CONTENT                             │   │   │
│  │  │                                                                 │   │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │   │   │
│  │  │  │  DASHBOARD  │  │   ORDERS    │  │       ORDER DETAIL      │ │   │   │
│  │  │  │             │  │             │  │                         │ │   │   │
│  │  │  │ • Summary   │  │ • List View │  │ • Header/Status         │ │   │   │
│  │  │  │ • Recent    │  │ • Filters   │  │ • Line Items            │ │   │   │
│  │  │  │ • Alerts    │  │ • Search    │  │ • Shipments             │ │   │   │
│  │  │  │ • Quick     │  │ • Export    │  │ • Documents             │ │   │   │
│  │  │  │   Actions   │  │             │  │ • Timeline              │ │   │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────────┘ │   │   │
│  │  │                                                                 │   │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │   │   │
│  │  │  │   QUOTES    │  │  SHIPMENTS  │  │       DOCUMENTS         │ │   │   │
│  │  │  │             │  │             │  │                         │ │   │   │
│  │  │  │ • Active    │  │ • In Transit│  │ • MTRs                  │ │   │   │
│  │  │  │ • History   │  │ • Track     │  │ • Invoices              │ │   │   │
│  │  │  │ • Accept/   │  │ • POD       │  │ • BOLs                  │ │   │   │
│  │  │  │   Reject    │  │             │  │ • Search/Filter         │ │   │   │
│  │  │  │ • RFQ       │  │             │  │ • Bulk Download         │ │   │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────────┘ │   │   │
│  │  │                                                                 │   │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │   │   │
│  │  │  │  INVOICES   │  │   ACCOUNT   │  │      REORDER            │ │   │   │
│  │  │  │             │  │             │  │                         │ │   │   │
│  │  │  │ • Open      │  │ • Profile   │  │ • Past Orders           │ │   │   │
│  │  │  │ • Paid      │  │ • Addresses │  │ • Quick Add             │ │   │   │
│  │  │  │ • Pay Now   │  │ • Users     │  │ • Saved Lists           │ │   │   │
│  │  │  │ • Statements│  │ • Prefs     │  │ • Templates             │ │   │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────────┘ │   │   │
│  │  │                                                                 │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Portal Screen Mockups

**Dashboard**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  CUSTOMER PORTAL - Dashboard                                    🔔 John Smith ▼│
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Good morning, John                                         ABC Manufacturing   │
│                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  QUICK STATS                                                               ││
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐           ││
│  │  │     5      │  │     2      │  │     3      │  │     1      │           ││
│  │  │  Open      │  │  In        │  │  Ready     │  │  Quote     │           ││
│  │  │  Orders    │  │ Production │  │  to Ship   │  │  Pending   │           ││
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘           ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                 │
│  ┌─────────────────────────────────┐  ┌────────────────────────────────────────┐│
│  │  RECENT ORDERS                  │  │  SHIPMENTS IN TRANSIT                  ││
│  │                                 │  │                                        ││
│  │  ORD-2026-4521  •  Processing   │  │  ┌────────────────────────────────┐   ││
│  │  $12,450  •  Est. 01/20         │  │  │ SHP-8834 → Dallas, TX          │   ││
│  │  [View Details]                 │  │  │ UPS 1Z999AA10123456784         │   ││
│  │                                 │  │  │ Est. Delivery: Today by 5PM    │   ││
│  │  ORD-2026-4519  •  Shipped      │  │  │ [Track] [Documents]            │   ││
│  │  $8,200   •  Delivered 01/15    │  │  └────────────────────────────────┘   ││
│  │  [View Details] [Reorder]       │  │                                        ││
│  │                                 │  │  ┌────────────────────────────────┐   ││
│  │  ORD-2026-4515  •  Delivered    │  │  │ SHP-8830 → Houston, TX         │   ││
│  │  $15,800  •  Delivered 01/12    │  │  │ FedEx Freight 794644790005     │   ││
│  │  [View Details] [Reorder]       │  │  │ Est. Delivery: Tomorrow        │   ││
│  │                                 │  │  │ [Track] [Documents]            │   ││
│  │  [View All Orders →]            │  │  └────────────────────────────────┘   ││
│  └─────────────────────────────────┘  └────────────────────────────────────────┘│
│                                                                                 │
│  ┌─────────────────────────────────┐  ┌────────────────────────────────────────┐│
│  │  ACTION REQUIRED                │  │  DOCUMENTS AVAILABLE                   ││
│  │                                 │  │                                        ││
│  │  ⚠️  Quote Q-2026-0789 expires  │  │  📄 Invoice INV-2026-4519             ││
│  │     in 2 days                   │  │     Order ORD-2026-4519                ││
│  │     [Review Quote]              │  │     [Download PDF]                     ││
│  │                                 │  │                                        ││
│  │  ⚠️  Invoice INV-2026-4500      │  │  📄 MTR for Heat #H2026-1234          ││
│  │     due in 5 days               │  │     Order ORD-2026-4515                ││
│  │     [View Invoice] [Pay Now]    │  │     [Download PDF]                     ││
│  │                                 │  │                                        ││
│  └─────────────────────────────────┘  └────────────────────────────────────────┘│
│                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │  QUICK ACTIONS                                                             ││
│  │                                                                             ││
│  │  [🛒 New Order]  [📝 Request Quote]  [🔄 Reorder Previous]  [📄 Find MTR]  ││
│  │                                                                             ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Order Detail**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  CUSTOMER PORTAL - Order Detail                                 🔔 John Smith ▼│
├─────────────────────────────────────────────────────────────────────────────────┤
│  ← Back to Orders                                                               │
│                                                                                 │
│  ORDER ORD-2026-4521                                                           │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Status: IN PRODUCTION          PO#: ABC-PO-2026-123                    │   │
│  │  Order Date: Jan 15, 2026       Est. Ship: Jan 20, 2026                 │   │
│  │                                                                         │   │
│  │  ░░░░░░░░░░░░░░░░░████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   │
│  │  Ordered      Confirmed      In Production      Ready      Shipped      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  LINE ITEMS                                                       3 items│   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │ 1. 1/4" x 48" x 96" A36 Hot Rolled Plate                        │   │   │
│  │  │    SKU: STL-A36-PL-250-48-96                                    │   │   │
│  │  │    Qty: 10 EA  •  $850.00/EA  •  Ext: $8,500.00                 │   │   │
│  │  │    Status: ⚙️ In Production (Plasma Cut)                        │   │   │
│  │  │    [View MTR when ready]                                        │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │ 2. 1/2" x 4" x 20' A36 Flat Bar                                 │   │   │
│  │  │    SKU: STL-A36-FB-500-4-240                                    │   │   │
│  │  │    Qty: 20 EA  •  $125.00/EA  •  Ext: $2,500.00                 │   │   │
│  │  │    Status: ✅ Ready                                              │   │   │
│  │  │    [Download MTR]                                               │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │ 3. 3/8" x 12" x 12' A572-50 Plate                               │   │   │
│  │  │    SKU: STL-A572-PL-375-12-144                                  │   │   │
│  │  │    Qty: 5 EA  •  $290.00/EA  •  Ext: $1,450.00                  │   │   │
│  │  │    Status: ⚙️ In Production (Saw Cut)                           │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌──────────────────────────────┐  ┌────────────────────────────────────────┐  │
│  │  ORDER SUMMARY               │  │  SHIP TO                               │  │
│  │                              │  │                                        │  │
│  │  Subtotal:      $12,450.00   │  │  ABC Manufacturing                     │  │
│  │  Processing:       $350.00   │  │  1234 Industrial Blvd                  │  │
│  │  Shipping:         $425.00   │  │  Dallas, TX 75201                      │  │
│  │  Tax:              $987.50   │  │                                        │  │
│  │  ─────────────────────────   │  │  Contact: Mike Johnson                 │  │
│  │  TOTAL:         $14,212.50   │  │  Phone: (214) 555-1234                 │  │
│  │                              │  │                                        │  │
│  └──────────────────────────────┘  └────────────────────────────────────────┘  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  TIMELINE                                                               │   │
│  │                                                                         │   │
│  │  ● Jan 17, 2:30 PM   Line 1 plasma cutting started                     │   │
│  │  ● Jan 17, 9:15 AM   Line 2 ready for shipment                         │   │
│  │  ● Jan 16, 4:00 PM   Production started                                │   │
│  │  ● Jan 15, 2:15 PM   Order confirmed                                   │   │
│  │  ● Jan 15, 10:30 AM  Order placed                                      │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  DOCUMENTS                                                              │   │
│  │                                                                         │   │
│  │  📄 Order Confirmation    [Download]                                   │   │
│  │  📄 MTR - Line 2          [Download]                                   │   │
│  │  ⏳ Invoice               (Available after shipment)                   │   │
│  │  ⏳ BOL                   (Available after shipment)                   │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  [💬 Contact Sales Rep]   [🔄 Reorder]   [📤 Export Order]                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Document Search (MTR Finder)**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  CUSTOMER PORTAL - Documents                                    🔔 John Smith ▼│
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  DOCUMENTS                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│  [MTRs] [Invoices] [BOLs] [Quotes] [All Documents]                             │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  🔍 SEARCH MTRs                                                         │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  Order #, PO #, Heat #, or Product                              │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  Date Range: [Last 90 Days ▼]    Grade: [All ▼]    [Search]            │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  RESULTS                                                        47 MTRs │   │
│  │                                                                         │   │
│  │  ☐ Select All                                        [Download Selected]│   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │ ☐  MTR-2026-1234                                                │   │   │
│  │  │    Heat: H2026-5678    Grade: A36    Mill: Nucor                │   │   │
│  │  │    Order: ORD-2026-4515  •  Line 1  •  Jan 12, 2026             │   │   │
│  │  │    Product: 1/4" x 48" x 96" A36 Plate                          │   │   │
│  │  │    [View] [Download] [Share Link]                               │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │ ☐  MTR-2026-1233                                                │   │   │
│  │  │    Heat: H2026-5677    Grade: A572-50    Mill: SDI              │   │   │
│  │  │    Order: ORD-2026-4510  •  Lines 1-3  •  Jan 10, 2026          │   │   │
│  │  │    Product: 3/8" x 12" x 12' A572-50 Plate                      │   │   │
│  │  │    [View] [Download] [Share Link]                               │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │ ☐  MTR-2026-1230                                                │   │   │
│  │  │    Heat: H2026-5670    Grade: 304SS    Mill: AK Steel           │   │   │
│  │  │    Order: ORD-2026-4505  •  Line 2  •  Jan 8, 2026              │   │   │
│  │  │    Product: 16ga x 48" x 120" 304 Stainless Sheet               │   │   │
│  │  │    [View] [Download] [Share Link]                               │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  [Load More...]                                                        │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  💡 TIP: Can't find an MTR? Some materials may take 24-48 hours       │   │
│  │     after delivery for MTR to be available.                            │   │
│  │     [Request MTR] if you need it sooner.                               │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. INTEGRATION WORKFLOWS

### 9.1 E-Commerce Order Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    E-COMMERCE ORDER INTEGRATION FLOW                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  STOREFRONT                              STEELWISE                              │
│  ══════════                              ═════════                              │
│                                                                                 │
│  ┌─────────────────┐                                                           │
│  │ 1. Customer     │                                                           │
│  │    browses      │                                                           │
│  │    products     │                                                           │
│  └────────┬────────┘                                                           │
│           │                                                                     │
│           │ GET /catalog/products                                              │
│           │─────────────────────────────────────────▶ Catalog API              │
│           │◀───────────────────────────────────────── (cached on storefront)   │
│           │                                                                     │
│  ┌────────┴────────┐                                                           │
│  │ 2. Customer     │                                                           │
│  │    views        │                                                           │
│  │    pricing      │                                                           │
│  └────────┬────────┘                                                           │
│           │                                                                     │
│           │ GET /pricing/products/{id}?customerId=X                            │
│           │─────────────────────────────────────────▶ Pricing API              │
│           │◀───────────────────────────────────────── (customer-specific price)│
│           │                                                                     │
│  ┌────────┴────────┐                                                           │
│  │ 3. Customer     │                                                           │
│  │    adds to      │                                                           │
│  │    cart         │                                                           │
│  └────────┬────────┘                                                           │
│           │                                                                     │
│           │ POST /inventory/reserve                                            │
│           │─────────────────────────────────────────▶ Inventory API            │
│           │◀───────────────────────────────────────── (15 min reservation)     │
│           │                                                                     │
│  ┌────────┴────────┐                                                           │
│  │ 4. Customer     │                                                           │
│  │    checks out   │                                                           │
│  └────────┬────────┘                                                           │
│           │                                                                     │
│           │ POST /pricing/cart (validate prices)                               │
│           │─────────────────────────────────────────▶ Pricing API              │
│           │◀───────────────────────────────────────── (confirmed pricing)      │
│           │                                                                     │
│           │ POST /orders (create order)                                        │
│           │─────────────────────────────────────────▶ Order API                │
│           │◀───────────────────────────────────────── (order created)          │
│           │                                                                     │
│  ┌────────┴────────┐                    ┌─────────────────────────────────┐    │
│  │ 5. Order        │                    │ SteelWise Order Management      │    │
│  │    confirmation │◀───────────────────│                                 │    │
│  │    displayed    │  webhook/callback  │ • Order created                 │    │
│  └─────────────────┘                    │ • Work orders generated         │    │
│                                         │ • Inventory allocated           │    │
│                                         │ • Sales notified                │    │
│                                         └─────────────────────────────────┘    │
│                                                                                 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                                                                 │
│  STATUS UPDATES (ongoing)                                                       │
│                                                                                 │
│  ┌─────────────────┐                    ┌─────────────────────────────────┐    │
│  │ Storefront      │◀───────────────────│ SteelWise sends webhooks:       │    │
│  │ receives        │   POST webhook     │                                 │    │
│  │ status updates  │                    │ • order.status_changed          │    │
│  └────────┬────────┘                    │ • order.shipped                 │    │
│           │                             │ • shipment.tracking_update      │    │
│           ▼                             │ • document.available            │    │
│  ┌─────────────────┐                    │ • invoice.created               │    │
│  │ Customer sees   │                    │                                 │    │
│  │ updated status  │                    └─────────────────────────────────┘    │
│  │ in account      │                                                           │
│  └─────────────────┘                                                           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 RFQ Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         RFQ PROCESSING FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  CUSTOMER                    STEELWISE                          SALES           │
│  ════════                    ═════════                          ═════           │
│                                                                                 │
│  ┌──────────────┐                                                              │
│  │ Submit RFQ   │                                                              │
│  │ via Portal   │                                                              │
│  │ or Storefront│                                                              │
│  └──────┬───────┘                                                              │
│         │                                                                       │
│         │ POST /rfqs                                                           │
│         │─────────────────────────▶ ┌──────────────────┐                       │
│         │                          │ RFQ Created       │                       │
│         │                          │ Status: SUBMITTED │                       │
│         │                          └─────────┬────────┘                        │
│         │                                    │                                  │
│         │◀─ Email: "RFQ Received"            │ Route to Sales                  │
│         │                                    ▼                                  │
│         │                          ┌──────────────────┐    ┌──────────────────┐│
│         │                          │ Assign to        │───▶│ Notification     ││
│         │                          │ Sales Rep        │    │ "New RFQ"        ││
│         │                          └─────────┬────────┘    └──────────────────┘│
│         │                                    │                        │        │
│         │                                    │                        ▼        │
│         │                                    │              ┌──────────────────┐│
│         │                                    │              │ Sales reviews    ││
│         │                                    │              │ RFQ, checks      ││
│         │                                    │              │ availability,    ││
│         │                                    │              │ pricing          ││
│         │                                    │              └─────────┬────────┘│
│         │                                    │                        │        │
│         │                                    │              ┌─────────▼────────┐│
│         │                                    │              │ Creates Quote    ││
│         │                                    │              │ Q-2026-0789      ││
│         │                          ┌─────────┴────────┐     └─────────┬────────┘│
│         │                          │ Quote linked     │◀──────────────┘        │
│         │                          │ to RFQ           │                        │
│         │                          │ Status: QUOTED   │                        │
│         │                          └─────────┬────────┘                        │
│         │                                    │                                  │
│         │◀─ Email: "Your Quote is Ready"     │ Issue Quote                     │
│         │   + Quote PDF attached             │                                  │
│         │                                    ▼                                  │
│  ┌──────┴───────┐                  ┌──────────────────┐                        │
│  │ Customer     │ GET /quotes/{id} │ Quote            │                        │
│  │ reviews      │◀─────────────────│ Status: ISSUED   │                        │
│  │ quote        │                  │ Valid: 30 days   │                        │
│  └──────┬───────┘                  └──────────────────┘                        │
│         │                                                                       │
│    ┌────┴────┐                                                                  │
│    │         │                                                                  │
│    ▼         ▼                                                                  │
│  ACCEPT    REJECT                                                               │
│    │         │                                                                  │
│    │ POST    │ POST /quotes/{id}/reject                                        │
│    │ /accept │──────────────────────────────────────────────────────────▶      │
│    │         │                          Quote marked REJECTED                   │
│    │         │                          RFQ closed                              │
│    │                                                                            │
│    │ POST /quotes/{id}/accept                                                  │
│    │─────────────────────────▶ ┌──────────────────┐                            │
│    │                          │ Order Created     │                            │
│    │                          │ from Quote        │                            │
│    │                          │ ORD-2026-XXXX     │                            │
│    │                          └─────────┬────────┘                             │
│    │                                    │                                       │
│    │◀─ Order Confirmation               │ Work orders generated                │
│    │                                    ▼                                       │
│    │                            FULFILLMENT                                     │
│    │                                                                            │
└────┴────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. API SURFACE SUMMARY

### 10.1 Complete API Endpoint List

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| **Catalog** | `/catalog/products` | GET | List products with filters |
| | `/catalog/products/{id}` | GET | Single product detail |
| | `/catalog/products/bulk` | GET | Bulk product fetch |
| | `/catalog/categories` | GET | Category tree |
| | `/catalog/search` | GET | Product search with facets |
| **Pricing** | `/pricing/products/{id}` | GET | Product price (customer-specific) |
| | `/pricing/cart` | POST | Price entire cart |
| | `/pricing/refresh` | POST | Trigger price refresh |
| | `/pricing/changes` | GET | Poll for price changes |
| **Inventory** | `/inventory/products/{id}` | GET | Product inventory |
| | `/inventory/products/bulk` | GET | Bulk inventory check |
| | `/inventory/availability-check` | POST | Check fulfillment availability |
| | `/inventory/reserve` | POST | Soft reserve inventory |
| **RFQ/Quotes** | `/rfqs` | POST | Submit RFQ |
| | `/rfqs/{id}` | GET | RFQ status |
| | `/quotes` | GET | List quotes |
| | `/quotes/{id}` | GET | Quote detail |
| | `/quotes/{id}/accept` | POST | Accept quote → order |
| | `/quotes/{id}/reject` | POST | Reject quote |
| **Orders** | `/orders` | POST | Create order |
| | `/customer/orders` | GET | List customer orders |
| | `/customer/orders/{id}` | GET | Order detail |
| | `/customer/orders/{id}/timeline` | GET | Order events |
| **Shipments** | `/customer/shipments` | GET | List shipments |
| | `/customer/shipments/{id}` | GET | Shipment detail |
| | `/customer/shipments/{id}/track` | GET | Carrier tracking |
| **Documents** | `/customer/documents` | GET | List documents |
| | `/customer/documents/{id}` | GET | Document metadata |
| | `/customer/documents/{id}/download` | GET | Download document |
| | `/customer/orders/{id}/mtr` | GET | Order MTRs |
| | `/customer/documents/request` | POST | Request document |
| **Webhooks** | `/webhooks/subscribe` | POST | Subscribe to events |
| | `/webhooks/subscriptions` | GET | List subscriptions |
| | `/webhooks/subscriptions/{id}` | DELETE | Unsubscribe |

### 10.2 Authentication & Authorization

```typescript
// API Authentication
interface ApiCredentials {
  // Option 1: API Key (for server-to-server)
  apiKey: string;                    // X-API-Key header
  
  // Option 2: OAuth 2.0 (for user context)
  accessToken: string;               // Bearer token
  refreshToken: string;
  expiresAt: Date;
}

// Scopes for OAuth
const apiScopes = {
  'catalog:read': 'Read product catalog',
  'pricing:read': 'Read pricing information',
  'inventory:read': 'Read inventory levels',
  'inventory:reserve': 'Reserve inventory',
  'orders:read': 'Read order information',
  'orders:write': 'Create and modify orders',
  'quotes:read': 'Read quotes',
  'quotes:write': 'Create and respond to quotes',
  'documents:read': 'Download documents',
  'webhooks:manage': 'Manage webhook subscriptions'
};

// Rate limiting
interface RateLimits {
  tier: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
  limits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
}

const rateLimitsByTier: Record<string, RateLimits['limits']> = {
  BASIC: { requestsPerMinute: 60, requestsPerHour: 1000, requestsPerDay: 10000 },
  PROFESSIONAL: { requestsPerMinute: 300, requestsPerHour: 10000, requestsPerDay: 100000 },
  ENTERPRISE: { requestsPerMinute: 1000, requestsPerHour: 50000, requestsPerDay: 500000 }
};
```

---

## 11. SUMMARY

### Integration Capabilities

| Capability | Support Level | Notes |
|------------|---------------|-------|
| **Catalog Sync** | Full | Real-time webhooks + polling fallback |
| **Customer-Specific Pricing** | Full | Contract, tier, volume pricing |
| **Inventory Visibility** | Full | Real-time with soft reservation |
| **Order Creation** | Full | Direct API with validation |
| **RFQ/Quote Flow** | Full | Complete pipeline support |
| **Order Tracking** | Full | Real-time status + carrier tracking |
| **Document Access** | Full | MTR, BOL, invoice, COC |
| **Webhooks** | Full | All key events |
| **EDI** | Partial | 850, 855, 856, 810 (Phase 2) |

### Customer Portal Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | At-a-glance order status, alerts, quick actions |
| **Order Management** | Full order history, detail, reorder |
| **Quote Management** | View, accept, reject quotes; submit RFQs |
| **Shipment Tracking** | Real-time carrier tracking integration |
| **Document Library** | Search, filter, bulk download documents |
| **Account Management** | Users, addresses, notification preferences |

### Key API Patterns

- **Authentication:** API Key (server) or OAuth 2.0 (user context)
- **Rate Limiting:** Tier-based limits with headers
- **Pagination:** Cursor-based for lists
- **Filtering:** Flexible query parameters
- **Webhooks:** Subscription-based event delivery
- **Versioning:** URL-based (`/api/v1/...`)

---

**End of E-Commerce Integration Architecture Specification**
