# 03 - DATA MODEL CORE

## Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           STEELWISE CORE DATA MODEL                                      │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│    PRODUCT DOMAIN                    MATERIAL DOMAIN                                    │
│    ┌──────────────┐                  ┌──────────────┐                                   │
│    │   PRODUCT    │                  │     HEAT     │                                   │
│    │   CATALOG    │                  │   (ORIGIN)   │                                   │
│    └──────┬───────┘                  └──────┬───────┘                                   │
│           │                                 │                                            │
│           ▼                                 ▼                                            │
│    ┌──────────────┐                  ┌──────────────┐      ┌──────────────┐             │
│    │    GRADE     │─────────────────▶│     COIL     │─────▶│   MATERIAL   │             │
│    │    SPEC      │                  │    MASTER    │      │     LOT      │             │
│    └──────────────┘                  └──────────────┘      └──────────────┘             │
│                                             │                     │                      │
│                                             ▼                     ▼                      │
│    INVENTORY DOMAIN              ┌──────────────┐         ┌──────────────┐              │
│    ┌──────────────┐              │   INVENTORY  │         │   MATERIAL   │              │
│    │   LOCATION   │◀────────────▶│     ITEM     │◀────────│   MOVEMENT   │              │
│    │  (WAREHOUSE) │              │   (STOCK)    │         │   (EVENT)    │              │
│    └──────────────┘              └──────────────┘         └──────────────┘              │
│                                         │                                                │
│    COMMERCIAL DOMAIN                    │                                                │
│    ┌──────────────┐              ┌──────┴───────┐                                       │
│    │   CUSTOMER   │◀────────────▶│  ORDER LINE  │                                       │
│    │   VENDOR     │              │  ALLOCATION  │                                       │
│    └──────────────┘              └──────────────┘                                       │
│           │                             │                                                │
│           ▼                             ▼                                                │
│    ┌──────────────┐              ┌──────────────┐      ┌──────────────┐                 │
│    │    ORDER     │─────────────▶│  ORDER LINE  │─────▶│   SHIPMENT   │                 │
│    │  (PO/SO/RFQ) │              │              │      │   (LOAD)     │                 │
│    └──────────────┘              └──────────────┘      └──────────────┘                 │
│                                                               │                          │
│    QUALITY DOMAIN                                             ▼                          │
│    ┌──────────────┐              ┌──────────────┐      ┌──────────────┐                 │
│    │     TEST     │─────────────▶│     QC       │      │   DELIVERY   │                 │
│    │    RESULT    │              │    HOLD      │      │  EXCEPTION   │                 │
│    └──────────────┘              └──────────────┘      └──────────────┘                 │
│           │                                                                              │
│           ▼                                                                              │
│    ┌──────────────┐              ┌──────────────┐                                       │
│    │   DOCUMENT   │◀────────────▶│    MTR       │                                       │
│    │   (GENERIC)  │              │    CERT      │                                       │
│    └──────────────┘              └──────────────┘                                       │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏭 CORE ENTITIES

### HEAT (Origin Record)

The foundational record for all steel traceability. Every piece of steel originates from a heat.

```
┌─────────────────────────────────────────────────────────────────┐
│                          HEAT                                    │
├─────────────────────────────────────────────────────────────────┤
│ heat_id           : UUID (PK)                                   │
│ heat_number       : VARCHAR(50) - Mill's heat identifier        │
│ mill_id           : FK → Organization                           │
│ cast_date         : TIMESTAMP                                   │
│ grade_id          : FK → Grade                                  │
│ melt_type         : ENUM (BOF, EAF, AOD)                        │
│ cast_type         : ENUM (CC, INGOT)                            │
│ chemistry         : JSONB - Actual chemistry analysis           │
│ aim_chemistry     : JSONB - Target chemistry                    │
│ mechanical_props  : JSONB - Tensile, yield, elongation          │
│ total_weight_lb   : DECIMAL                                     │
│ status            : ENUM (ACTIVE, CONSUMED, ARCHIVED)           │
│ mtr_id            : FK → Document (MTR attachment)              │
│ created_at        : TIMESTAMP                                   │
│ created_by        : FK → User                                   │
└─────────────────────────────────────────────────────────────────┘

CHEMISTRY JSONB STRUCTURE:
{
  "C": 0.08,    // Carbon %
  "Mn": 1.35,   // Manganese %
  "P": 0.015,   // Phosphorus %
  "S": 0.010,   // Sulfur %
  "Si": 0.25,   // Silicon %
  "Cr": 0.15,   // Chromium %
  "Ni": 0.20,   // Nickel %
  "Mo": 0.05,   // Molybdenum %
  "V": 0.02,    // Vanadium %
  "Cu": 0.25,   // Copper %
  "N": 0.008,   // Nitrogen %
  "Al": 0.035,  // Aluminum %
  "B": 0.0005,  // Boron %
  "Cb": 0.02,   // Columbium (Niobium) %
  "Ti": 0.015,  // Titanium %
  "Ca": 0.003   // Calcium %
}

MECHANICAL_PROPS JSONB STRUCTURE:
{
  "tensile_ksi": 75.5,
  "yield_ksi": 52.0,
  "elongation_pct": 22,
  "reduction_area_pct": 45,
  "hardness_hrc": 22,
  "charpy_ft_lb": 45,
  "charpy_temp_f": -20
}
```

### COIL MASTER (Primary Material Unit)

Represents a single coil, plate, bundle, or material unit.

```
┌─────────────────────────────────────────────────────────────────┐
│                       COIL_MASTER                                │
├─────────────────────────────────────────────────────────────────┤
│ coil_id           : UUID (PK)                                   │
│ coil_number       : VARCHAR(50) - Unique coil identifier        │
│ heat_id           : FK → Heat                                   │
│ parent_coil_id    : FK → Coil_Master (for splits)               │
│ product_id        : FK → Product                                │
│ grade_id          : FK → Grade                                  │
│ form              : ENUM (COIL, SHEET, PLATE, BAR, TUBE, BEAM)  │
│                                                                  │
│ -- Dimensions --                                                 │
│ thickness_in      : DECIMAL(8,4)                                │
│ width_in          : DECIMAL(8,3)                                │
│ length_in         : DECIMAL(10,3) - NULL for coils              │
│ od_in             : DECIMAL(8,3) - Outer diameter (tube)        │
│ id_in             : DECIMAL(8,3) - Inner diameter (tube)        │
│ gauge             : INTEGER - Gauge number                      │
│                                                                  │
│ -- Weight --                                                     │
│ gross_weight_lb   : DECIMAL(12,2)                               │
│ net_weight_lb     : DECIMAL(12,2)                               │
│ theoretical_wt_lb : DECIMAL(12,2) - Calculated weight           │
│ pct_yield         : DECIMAL(5,2) - Yield from parent            │
│                                                                  │
│ -- Surface/Condition --                                          │
│ temper            : VARCHAR(20) - T1, T2, T3, etc.              │
│ finish            : VARCHAR(50) - 2B, BA, #4, etc.              │
│ coating           : VARCHAR(50) - Galv, Galvannealed, etc.      │
│ coating_weight    : VARCHAR(20) - G90, G60, etc.                │
│ edge_condition    : ENUM (MILL, SLIT, TRIMMED)                  │
│                                                                  │
│ -- Status --                                                     │
│ status            : ENUM (AVAILABLE, ALLOCATED, HOLD, CONSUMED) │
│ qc_status         : ENUM (PENDING, PASSED, FAILED, HOLD)        │
│ hold_code         : VARCHAR(20) - Reason if on hold             │
│                                                                  │
│ -- Ownership/Location --                                         │
│ owner_id          : FK → Organization                           │
│ location_id       : FK → Location                               │
│ bin_location      : VARCHAR(50) - Warehouse bin                 │
│                                                                  │
│ -- Traceability --                                               │
│ origin_order_id   : FK → Order (PO that brought it in)          │
│ created_at        : TIMESTAMP                                   │
│ created_by        : FK → User                                   │
│ modified_at       : TIMESTAMP                                   │
│ modified_by       : FK → User                                   │
└─────────────────────────────────────────────────────────────────┘
```

### PRODUCT (Catalog Item)

Defines sellable products with specifications.

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCT                                  │
├─────────────────────────────────────────────────────────────────┤
│ product_id        : UUID (PK)                                   │
│ sku               : VARCHAR(50) - Internal SKU                  │
│ name              : VARCHAR(200) - Descriptive name             │
│ description       : TEXT                                        │
│ category_id       : FK → Category                               │
│ product_type      : ENUM (FLAT, LONG, TUBE, STRUCTURAL)         │
│ form              : ENUM (COIL, SHEET, PLATE, BAR, TUBE, BEAM)  │
│                                                                  │
│ -- Specifications --                                             │
│ grade_id          : FK → Grade (default grade)                  │
│ spec_standard     : VARCHAR(50) - ASTM A36, A572, etc.          │
│ thickness_min_in  : DECIMAL(8,4)                                │
│ thickness_max_in  : DECIMAL(8,4)                                │
│ width_min_in      : DECIMAL(8,3)                                │
│ width_max_in      : DECIMAL(8,3)                                │
│                                                                  │
│ -- Pricing --                                                    │
│ base_price_cwt    : DECIMAL(10,2) - Price per hundredweight     │
│ price_unit        : ENUM (CWT, LB, TON, EACH, LF)               │
│ commodity_link    : VARCHAR(50) - Link to commodity index       │
│                                                                  │
│ -- Flags --                                                      │
│ is_active         : BOOLEAN                                     │
│ requires_mtr      : BOOLEAN                                     │
│ requires_cert     : BOOLEAN                                     │
│ is_hazmat         : BOOLEAN                                     │
│                                                                  │
│ created_at        : TIMESTAMP                                   │
│ modified_at       : TIMESTAMP                                   │
└─────────────────────────────────────────────────────────────────┘
```

### GRADE (Steel Grade Definition)

```
┌─────────────────────────────────────────────────────────────────┐
│                          GRADE                                   │
├─────────────────────────────────────────────────────────────────┤
│ grade_id          : UUID (PK)                                   │
│ grade_code        : VARCHAR(50) - A36, 1018, 304, etc.          │
│ grade_name        : VARCHAR(200)                                │
│ grade_family      : ENUM (CARBON, ALLOY, STAINLESS, TOOL)       │
│ spec_standard     : VARCHAR(50) - ASTM, SAE, AMS, etc.          │
│                                                                  │
│ -- Chemistry Limits --                                           │
│ chemistry_min     : JSONB - Minimum % for each element          │
│ chemistry_max     : JSONB - Maximum % for each element          │
│                                                                  │
│ -- Mechanical Limits --                                          │
│ tensile_min_ksi   : DECIMAL(6,2)                                │
│ tensile_max_ksi   : DECIMAL(6,2)                                │
│ yield_min_ksi     : DECIMAL(6,2)                                │
│ yield_max_ksi     : DECIMAL(6,2)                                │
│ elongation_min    : DECIMAL(5,2)                                │
│ hardness_min      : DECIMAL(5,2)                                │
│ hardness_max      : DECIMAL(5,2)                                │
│                                                                  │
│ -- Equivalents --                                                │
│ equivalent_grades : JSONB - [{standard, grade}, ...]            │
│                                                                  │
│ is_active         : BOOLEAN                                     │
│ created_at        : TIMESTAMP                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 INVENTORY ENTITIES

### INVENTORY_ITEM (Stock Record)

```
┌─────────────────────────────────────────────────────────────────┐
│                      INVENTORY_ITEM                              │
├─────────────────────────────────────────────────────────────────┤
│ inventory_id      : UUID (PK)                                   │
│ coil_id           : FK → Coil_Master                            │
│ location_id       : FK → Location                               │
│ owner_id          : FK → Organization                           │
│                                                                  │
│ -- Quantities --                                                 │
│ qty_on_hand       : DECIMAL(12,2)                               │
│ qty_available     : DECIMAL(12,2) - On hand minus allocated     │
│ qty_allocated     : DECIMAL(12,2) - Reserved for orders         │
│ qty_on_hold       : DECIMAL(12,2) - Quality hold                │
│ qty_in_transit    : DECIMAL(12,2) - Shipped not received        │
│ unit              : ENUM (LB, KG, EA, LF, SF)                   │
│                                                                  │
│ -- Costing --                                                    │
│ unit_cost         : DECIMAL(10,4)                               │
│ landed_cost       : DECIMAL(10,4) - Including freight           │
│ last_cost         : DECIMAL(10,4)                               │
│ avg_cost          : DECIMAL(10,4)                               │
│                                                                  │
│ -- Tracking --                                                   │
│ last_count_date   : DATE                                        │
│ last_movement     : TIMESTAMP                                   │
│ days_in_stock     : INTEGER (computed)                          │
│                                                                  │
│ status            : ENUM (ACTIVE, DEPLETED, ARCHIVED)           │
│ created_at        : TIMESTAMP                                   │
│ modified_at       : TIMESTAMP                                   │
└─────────────────────────────────────────────────────────────────┘
```

### LOCATION (Warehouse/Bin)

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOCATION                                 │
├─────────────────────────────────────────────────────────────────┤
│ location_id       : UUID (PK)                                   │
│ location_code     : VARCHAR(50) - WH01-A-01-01                  │
│ location_name     : VARCHAR(200)                                │
│ location_type     : ENUM (WAREHOUSE, YARD, RACK, BIN, FLOOR)    │
│ parent_location   : FK → Location (hierarchy)                   │
│                                                                  │
│ -- Address (for warehouses) --                                   │
│ address_line1     : VARCHAR(200)                                │
│ city              : VARCHAR(100)                                │
│ state             : VARCHAR(50)                                 │
│ postal_code       : VARCHAR(20)                                 │
│ country           : VARCHAR(50)                                 │
│ lat               : DECIMAL(10,7)                               │
│ lng               : DECIMAL(10,7)                               │
│                                                                  │
│ -- Capacity --                                                   │
│ max_weight_lb     : DECIMAL(12,2)                               │
│ max_height_in     : DECIMAL(8,2)                                │
│ is_outdoor        : BOOLEAN                                     │
│ is_covered        : BOOLEAN                                     │
│ has_crane         : BOOLEAN                                     │
│ max_crane_tons    : DECIMAL(6,2)                                │
│                                                                  │
│ owner_id          : FK → Organization                           │
│ is_active         : BOOLEAN                                     │
│ created_at        : TIMESTAMP                                   │
└─────────────────────────────────────────────────────────────────┘
```

### MATERIAL_MOVEMENT (Event Log)

```
┌─────────────────────────────────────────────────────────────────┐
│                    MATERIAL_MOVEMENT                             │
├─────────────────────────────────────────────────────────────────┤
│ movement_id       : UUID (PK)                                   │
│ coil_id           : FK → Coil_Master                            │
│ movement_type     : ENUM (RECEIVE, SHIP, TRANSFER, ADJUST,      │
│                          PROCESS, CONSUME, SCRAP, COUNT)        │
│                                                                  │
│ -- Locations --                                                  │
│ from_location_id  : FK → Location                               │
│ to_location_id    : FK → Location                               │
│                                                                  │
│ -- Quantities --                                                 │
│ qty_moved         : DECIMAL(12,2)                               │
│ unit              : ENUM (LB, KG, EA, LF)                       │
│                                                                  │
│ -- References --                                                 │
│ order_id          : FK → Order                                  │
│ work_order_id     : FK → Work_Order                             │
│ shipment_id       : FK → Shipment                               │
│                                                                  │
│ -- Details --                                                    │
│ reason_code       : VARCHAR(50)                                 │
│ notes             : TEXT                                        │
│                                                                  │
│ created_at        : TIMESTAMP                                   │
│ created_by        : FK → User                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛒 COMMERCIAL ENTITIES

### ORDER (PO/SO/RFQ/Quote)

```
┌─────────────────────────────────────────────────────────────────┐
│                          ORDER                                   │
├─────────────────────────────────────────────────────────────────┤
│ order_id          : UUID (PK)                                   │
│ order_number      : VARCHAR(50) - Auto-generated                │
│ order_type        : ENUM (RFQ, QUOTE, SO, PO, RETURN)           │
│                                                                  │
│ -- Parties --                                                    │
│ customer_id       : FK → Organization (for SO)                  │
│ vendor_id         : FK → Organization (for PO)                  │
│ bill_to_id        : FK → Address                                │
│ ship_to_id        : FK → Address                                │
│                                                                  │
│ -- Dates --                                                      │
│ order_date        : DATE                                        │
│ required_date     : DATE                                        │
│ promised_date     : DATE                                        │
│ expire_date       : DATE (for quotes)                           │
│                                                                  │
│ -- Status --                                                     │
│ status            : ENUM (DRAFT, PENDING, CONFIRMED, PARTIAL,   │
│                          COMPLETE, CANCELLED, HOLD)             │
│ approval_status   : ENUM (PENDING, APPROVED, REJECTED)          │
│                                                                  │
│ -- Totals --                                                     │
│ subtotal          : DECIMAL(14,2)                               │
│ tax_amount        : DECIMAL(12,2)                               │
│ freight_amount    : DECIMAL(12,2)                               │
│ total_amount      : DECIMAL(14,2)                               │
│ currency          : VARCHAR(3) - USD, CAD, etc.                 │
│                                                                  │
│ -- Terms --                                                      │
│ payment_terms     : VARCHAR(50) - Net30, 2/10 Net 30            │
│ freight_terms     : ENUM (PREPAID, COLLECT, 3RD_PARTY)          │
│ incoterms         : VARCHAR(10) - FOB, CIF, EXW, etc.           │
│                                                                  │
│ -- References --                                                 │
│ po_reference      : VARCHAR(100) - Customer's PO                │
│ quote_id          : FK → Order (linked quote)                   │
│ rfq_id            : FK → Order (linked RFQ)                     │
│                                                                  │
│ notes             : TEXT                                        │
│ internal_notes    : TEXT                                        │
│                                                                  │
│ created_at        : TIMESTAMP                                   │
│ created_by        : FK → User                                   │
│ modified_at       : TIMESTAMP                                   │
│ modified_by       : FK → User                                   │
└─────────────────────────────────────────────────────────────────┘
```

### ORDER_LINE (Line Items)

```
┌─────────────────────────────────────────────────────────────────┐
│                       ORDER_LINE                                 │
├─────────────────────────────────────────────────────────────────┤
│ line_id           : UUID (PK)                                   │
│ order_id          : FK → Order                                  │
│ line_number       : INTEGER                                     │
│                                                                  │
│ -- Product --                                                    │
│ product_id        : FK → Product                                │
│ description       : TEXT - Override description                 │
│                                                                  │
│ -- Specifications --                                             │
│ grade_id          : FK → Grade                                  │
│ thickness_in      : DECIMAL(8,4)                                │
│ width_in          : DECIMAL(8,3)                                │
│ length_in         : DECIMAL(10,3)                               │
│ finish            : VARCHAR(50)                                 │
│ coating           : VARCHAR(50)                                 │
│                                                                  │
│ -- Quantities --                                                 │
│ qty_ordered       : DECIMAL(12,2)                               │
│ qty_shipped       : DECIMAL(12,2)                               │
│ qty_received      : DECIMAL(12,2)                               │
│ qty_backordered   : DECIMAL(12,2)                               │
│ unit              : ENUM (LB, KG, EA, LF, CWT, TON)             │
│                                                                  │
│ -- Pricing --                                                    │
│ unit_price        : DECIMAL(10,4)                               │
│ price_unit        : ENUM (CWT, LB, TON, EACH, LF)               │
│ discount_pct      : DECIMAL(5,2)                                │
│ extended_price    : DECIMAL(14,2)                               │
│                                                                  │
│ -- Allocation --                                                 │
│ allocated_coil_id : FK → Coil_Master                            │
│ from_location_id  : FK → Location                               │
│                                                                  │
│ -- Status --                                                     │
│ line_status       : ENUM (OPEN, PARTIAL, COMPLETE, CANCELLED)   │
│                                                                  │
│ notes             : TEXT                                        │
│ created_at        : TIMESTAMP                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 QUALITY ENTITIES

### TEST_RESULT (QA/QC Data)

```
┌─────────────────────────────────────────────────────────────────┐
│                       TEST_RESULT                                │
├─────────────────────────────────────────────────────────────────┤
│ test_id           : UUID (PK)                                   │
│ coil_id           : FK → Coil_Master                            │
│ heat_id           : FK → Heat                                   │
│ test_type         : ENUM (CHEMISTRY, MECHANICAL, DIMENSIONAL,   │
│                          SURFACE, COATING, OTHER)               │
│ test_date         : TIMESTAMP                                   │
│                                                                  │
│ -- Results --                                                    │
│ results           : JSONB - Full test data                      │
│ spec_limits       : JSONB - Applied specification limits        │
│ pass_fail         : ENUM (PASS, FAIL, CONDITIONAL)              │
│                                                                  │
│ -- Equipment --                                                  │
│ equipment_id      : VARCHAR(50)                                 │
│ calibration_date  : DATE                                        │
│ lab_id            : VARCHAR(50)                                 │
│                                                                  │
│ -- Certification --                                              │
│ tested_by         : FK → User                                   │
│ approved_by       : FK → User                                   │
│ cert_number       : VARCHAR(50)                                 │
│                                                                  │
│ notes             : TEXT                                        │
│ created_at        : TIMESTAMP                                   │
└─────────────────────────────────────────────────────────────────┘
```

### QC_HOLD (Quality Holds)

```
┌─────────────────────────────────────────────────────────────────┐
│                         QC_HOLD                                  │
├─────────────────────────────────────────────────────────────────┤
│ hold_id           : UUID (PK)                                   │
│ coil_id           : FK → Coil_Master                            │
│ hold_type         : ENUM (QUALITY, CUSTOMER, PENDING_TEST,      │
│                          DAMAGE, DISPUTE, OTHER)                │
│ hold_reason       : TEXT                                        │
│ hold_date         : TIMESTAMP                                   │
│ hold_by           : FK → User                                   │
│                                                                  │
│ -- Resolution --                                                 │
│ status            : ENUM (ACTIVE, RELEASED, SCRAPPED, RETURNED) │
│ disposition       : ENUM (USE_AS_IS, REWORK, SCRAP, RETURN,     │
│                          SELL_AS_SECONDARY, PENDING)            │
│ resolved_date     : TIMESTAMP                                   │
│ resolved_by       : FK → User                                   │
│ resolution_notes  : TEXT                                        │
│                                                                  │
│ -- NCR Link --                                                   │
│ ncr_id            : FK → NCR                                    │
│                                                                  │
│ created_at        : TIMESTAMP                                   │
│ modified_at       : TIMESTAMP                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📄 DOCUMENT ENTITIES

### DOCUMENT (Generic Document)

```
┌─────────────────────────────────────────────────────────────────┐
│                        DOCUMENT                                  │
├─────────────────────────────────────────────────────────────────┤
│ document_id       : UUID (PK)                                   │
│ document_type     : ENUM (MTR, CERT, BOL, POD, INVOICE, SPEC,   │
│                          COA, MSDS, DRAWING, OTHER)             │
│ document_number   : VARCHAR(100)                                │
│ title             : VARCHAR(200)                                │
│                                                                  │
│ -- Storage --                                                    │
│ file_name         : VARCHAR(255)                                │
│ file_type         : VARCHAR(50) - application/pdf               │
│ file_size_bytes   : BIGINT                                      │
│ storage_path      : VARCHAR(500) - S3 key                       │
│ checksum          : VARCHAR(64) - SHA-256                       │
│                                                                  │
│ -- Extracted Data --                                             │
│ extracted_data    : JSONB - OCR/parsed content                  │
│ is_verified       : BOOLEAN                                     │
│ verified_by       : FK → User                                   │
│ verified_at       : TIMESTAMP                                   │
│                                                                  │
│ -- Expiration --                                                 │
│ issue_date        : DATE                                        │
│ expiry_date       : DATE                                        │
│                                                                  │
│ owner_id          : FK → Organization                           │
│ uploaded_by       : FK → User                                   │
│ created_at        : TIMESTAMP                                   │
└─────────────────────────────────────────────────────────────────┘
```

### DOCUMENT_LINK (Many-to-Many Relationships)

```
┌─────────────────────────────────────────────────────────────────┐
│                      DOCUMENT_LINK                               │
├─────────────────────────────────────────────────────────────────┤
│ link_id           : UUID (PK)                                   │
│ document_id       : FK → Document                               │
│ entity_type       : ENUM (HEAT, COIL, ORDER, SHIPMENT, etc.)    │
│ entity_id         : UUID - Polymorphic reference                │
│ link_type         : ENUM (PRIMARY, SUPPORTING, REFERENCE)       │
│ created_at        : TIMESTAMP                                   │
│ created_by        : FK → User                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔗 KEY RELATIONSHIPS SUMMARY

| Parent Entity | Child Entity | Relationship | Cardinality |
|---------------|--------------|--------------|-------------|
| Heat | Coil_Master | Origin | 1:N |
| Coil_Master | Coil_Master | Split/Process | 1:N |
| Product | Coil_Master | Classification | 1:N |
| Grade | Heat | Specification | 1:N |
| Location | Inventory_Item | Storage | 1:N |
| Coil_Master | Inventory_Item | Stock Record | 1:1 |
| Coil_Master | Material_Movement | History | 1:N |
| Order | Order_Line | Lines | 1:N |
| Order_Line | Coil_Master | Allocation | N:N |
| Coil_Master | Test_Result | Testing | 1:N |
| Coil_Master | QC_Hold | Holds | 1:N |
| Document | Document_Link | Attachments | 1:N |

---

## 🔑 INDEXING STRATEGY

### Primary Lookup Indexes
- `heat.heat_number` - Heat lookup by number
- `coil_master.coil_number` - Coil lookup by number
- `order.order_number` - Order lookup by number
- `inventory_item(location_id, status)` - Stock by location

### Search Indexes
- `coil_master(grade_id, thickness_in, width_in)` - Product search
- `inventory_item(product_id, qty_available)` - Available stock
- `order(customer_id, status, order_date)` - Customer orders

### Full-Text Indexes (Elasticsearch)
- Product descriptions
- Document extracted text
- Notes and comments

---

*Next: [04-MODULE-PRODUCT-CATALOG.md](04-MODULE-PRODUCT-CATALOG.md) - Product catalog and materials specifications*

