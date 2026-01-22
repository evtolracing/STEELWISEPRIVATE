# Phase 9: Data Model (Phase 1 Level)

**Document Version:** 1.0  
**Date:** January 17, 2026  
**Status:** Conceptual Data Model

---

## 1. EXECUTIVE SUMMARY

This document defines the conceptual data model for Phase 1 of the SteelWise service center execution platform. It focuses on:

- **Core Entities** - The fundamental objects in the system
- **Relationships** - How entities connect and depend on each other
- **Ownership Rules** - Who owns what data and access patterns
- **Multi-Division/Location Strategy** - How data is segmented across business units

**Design Principles:**
- **Simplicity First** - Model what we need for Phase 1, not everything possible
- **Traceability** - Every piece of material can be traced to its origin
- **Flexibility** - Support multiple divisions without duplication
- **Auditability** - Track who did what and when

---

## 2. ENTITY OVERVIEW

### 2.1 Entity Categories

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ENTITY CATEGORIES                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ORGANIZATIONAL                                             │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  Company → Division → Location → Department → User          │   │
│  │                                                             │   │
│  │  Defines WHO can do WHAT and WHERE                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  MASTER DATA                                                │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  Customer, Vendor, Product, Material, WorkCenter            │   │
│  │                                                             │   │
│  │  Reference data that changes infrequently                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  INVENTORY                                                  │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  InventoryItem, Heat, Lot, Remnant, Location                │   │
│  │                                                             │   │
│  │  What material exists and where it is                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  TRANSACTIONAL                                              │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  Quote, Order, OrderLine, WorkOrder, Operation              │   │
│  │                                                             │   │
│  │  Business transactions that drive operations                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  EXECUTION                                                  │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  Job, JobOperation, Package, Shipment, Delivery             │   │
│  │                                                             │   │
│  │  Shop floor activity and outbound logistics                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  FINANCIAL                                                  │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  Invoice, Payment, PriceList, Contract                      │   │
│  │                                                             │   │
│  │  Billing and pricing                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Core Entity List

| Entity | Category | Description | Division-Scoped |
|--------|----------|-------------|:---------------:|
| **Company** | Organizational | Top-level business entity | No (Global) |
| **Division** | Organizational | Business segment (Steel, Aluminum, etc.) | No (Global) |
| **Location** | Organizational | Physical facility | No (Global) |
| **User** | Organizational | System user/employee | Yes |
| **Customer** | Master | Buying entity | Yes* |
| **Vendor** | Master | Supplying entity | Yes* |
| **Product** | Master | Sellable item definition | Yes |
| **Material** | Master | Raw material specification | Shared |
| **WorkCenter** | Master | Processing equipment/station | Yes |
| **InventoryItem** | Inventory | Physical stock instance | Yes |
| **Heat** | Inventory | Mill heat/lot number | Shared |
| **Quote** | Transactional | Price proposal | Yes |
| **Order** | Transactional | Customer purchase | Yes |
| **OrderLine** | Transactional | Line item on order | Yes |
| **WorkOrder** | Transactional | Production instruction | Yes |
| **Job** | Execution | Executable work unit | Yes |
| **Package** | Execution | Shipping package/bundle | Yes |
| **Shipment** | Execution | Outbound delivery | Yes |
| **Invoice** | Financial | Customer bill | Yes |

*Customers/Vendors can be shared across divisions with division-specific settings

---

## 3. ENTITY DEFINITIONS

### 3.1 Organizational Entities

```
┌─────────────────────────────────────────────────────────────────────┐
│  COMPANY                                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Attributes:                                                        │
│  • id                    - Unique identifier                        │
│  • name                  - Legal company name                       │
│  • taxId                 - EIN/Tax ID                               │
│  • address               - Corporate address                        │
│  • settings              - Company-wide configuration               │
│                                                                     │
│  Purpose: Root entity for multi-tenant or holding company           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  DIVISION                                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Attributes:                                                        │
│  • id                    - Unique identifier (STL, ALU, PLA, etc.) │
│  • companyId             - Parent company                           │
│  • name                  - Division name                            │
│  • code                  - Short code for prefixes                  │
│  • materialCategories    - Allowed material types                   │
│  • glAccountPrefix       - Accounting integration                   │
│  • settings              - Division-specific config                 │
│                                                                     │
│  Purpose: Segment business by product line/material type            │
│                                                                     │
│  Examples:                                                          │
│  • STL - Steel Division                                             │
│  • ALU - Aluminum Division                                          │
│  • PLA - Plastics Division                                          │
│  • SPC - Specialty Metals                                           │
│  • SUP - Industrial Supplies                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  LOCATION                                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Attributes:                                                        │
│  • id                    - Unique identifier                        │
│  • companyId             - Parent company                           │
│  • code                  - Short code (HOU, DAL, PHX)               │
│  • name                  - Location name                            │
│  • type                  - WAREHOUSE | SERVICE_CENTER | OFFICE      │
│  • address               - Physical address                         │
│  • timezone              - Local timezone                           │
│  • operatingHours        - Business hours                           │
│  • divisions             - Divisions operating at this location     │
│  • capabilities          - What processing can be done here         │
│                                                                     │
│  Purpose: Physical facility where work happens                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  USER                                                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Attributes:                                                        │
│  • id                    - Unique identifier                        │
│  • email                 - Login email                              │
│  • name                  - Display name                             │
│  • role                  - Primary role                             │
│  • locationId            - Primary location                         │
│  • divisionAccess        - List of accessible divisions             │
│  • permissions           - Granular permissions                     │
│  • isActive              - Account status                           │
│  • lastLogin             - Last access timestamp                    │
│                                                                     │
│  Purpose: System user with role-based access                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Master Data Entities

```
┌─────────────────────────────────────────────────────────────────────┐
│  CUSTOMER                                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Attributes:                                                        │
│  • id                    - Unique identifier                        │
│  • code                  - Customer code (ACME-001)                 │
│  • name                  - Legal name                               │
│  • type                  - RETAIL | COMMERCIAL | INDUSTRIAL         │
│  • status                - ACTIVE | HOLD | INACTIVE                 │
│  • taxExempt             - Tax exemption status                     │
│  • taxExemptCertId       - Certificate reference                    │
│  • defaultTerms          - Payment terms                            │
│  • creditLimit           - Credit limit amount                      │
│  • currentBalance        - Outstanding A/R                          │
│  • contacts              - List of contacts                         │
│  • addresses             - Shipping/billing addresses               │
│  • divisionSettings      - Per-division pricing/settings            │
│                                                                     │
│  Purpose: Entity that purchases from us                             │
│                                                                     │
│  Division Relationship:                                             │
│  • Customer record is global                                        │
│  • Division-specific: pricing, terms, sales rep                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  PRODUCT                                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Attributes:                                                        │
│  • id                    - Unique identifier                        │
│  • sku                   - Stock keeping unit                       │
│  • divisionId            - Owning division                          │
│  • name                  - Product name                             │
│  • description           - Full description                         │
│  • category              - Product category                         │
│  • type                  - STOCK | PROCESSED | SERVICE | SUPPLY    │
│  • materialId            - Base material (if applicable)            │
│  • specifications        - Size, grade, finish, etc.                │
│  • unitOfMeasure         - Primary UOM                              │
│  • weightPerUnit         - Weight calculation                       │
│  • stockLengths          - Available stock lengths                  │
│  • pricing               - Base pricing rules                       │
│  • isActive              - Available for sale                       │
│                                                                     │
│  Purpose: Sellable item in catalog                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  MATERIAL                                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Attributes:                                                        │
│  • id                    - Unique identifier                        │
│  • code                  - Material code                            │
│  • name                  - Material name                            │
│  • category              - STEEL | ALUMINUM | STAINLESS | PLASTIC  │
│  • grade                 - Material grade (A36, 1018, 6061, etc.)  │
│  • specification         - ASTM/AISI spec reference                │
│  • form                  - BAR | PLATE | SHEET | TUBE | BEAM       │
│  • chemistrySpec         - Chemical composition requirements        │
│  • mechanicalSpec        - Mechanical property requirements         │
│  • applicableDivisions   - Which divisions use this material       │
│                                                                     │
│  Purpose: Raw material definition (shared across divisions)         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  WORK CENTER                                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Attributes:                                                        │
│  • id                    - Unique identifier                        │
│  • code                  - Work center code (WC-SAW-01)             │
│  • locationId            - Physical location                        │
│  • divisionId            - Primary division (can serve multiple)    │
│  • name                  - Display name                             │
│  • type                  - SAW | LASER | PLASMA | BRAKE | etc.     │
│  • capabilities          - What it can process                      │
│  • capacity              - Throughput capacity                      │
│  • schedulable           - Can accept scheduled work                │
│  • status                - ACTIVE | MAINTENANCE | OFFLINE           │
│  • operatorRequired      - Needs operator assignment                │
│                                                                     │
│  Purpose: Equipment or station that performs processing             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Inventory Entities

```
┌─────────────────────────────────────────────────────────────────────┐
│  INVENTORY ITEM                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Attributes:                                                        │
│  • id                    - Unique identifier                        │
│  • productId             - Product definition                       │
│  • divisionId            - Owning division                          │
│  • locationId            - Physical location                        │
│  • heatId                - Mill heat reference                      │
│  • status                - AVAILABLE | ALLOCATED | RESERVED | HOLD │
│  • type                  - STOCK | REMNANT | WIP | CONSIGNMENT     │
│  • quantity              - Current quantity                         │
│  • quantityUOM           - Unit (pieces, feet, lbs)                 │
│  • weight                - Weight in lbs                            │
│  • dimensions            - L × W × H or length                      │
│  • binLocation           - Rack/bin location code                   │
│  • receivedDate          - When received                            │
│  • receivedFromPO        - Purchase order reference                 │
│  • allocatedToOrder      - If allocated, which order                │
│  • lastMovedAt           - Last physical movement                   │
│  • certifications        - Associated MTR, COC, etc.                │
│                                                                     │
│  Purpose: Physical piece of material in inventory                   │
│                                                                     │
│  Key Concept: Each physical piece is a separate inventory item.    │
│  A bundle of 10 bars received together = 10 inventory items        │
│  with same heat# and received date.                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  HEAT                                                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Attributes:                                                        │
│  • id                    - Unique identifier                        │
│  • heatNumber            - Mill heat number                         │
│  • millId                - Producing mill/vendor                    │
│  • materialId            - Material specification                   │
│  • pourDate              - When heat was poured                     │
│  • chemistry             - Actual chemical analysis                 │
│  • mechanicalProps       - Actual mechanical properties             │
│  • mtrDocument           - Mill test report document                │
│  • countryOfOrigin       - Melt origin                              │
│  • meltCountry           - DFARS compliance                         │
│                                                                     │
│  Purpose: Traceability to mill production lot                       │
│                                                                     │
│  Note: Heat is shared across all divisions - same heat can         │
│  be received at multiple locations or sold to different divisions. │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  BIN LOCATION                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Attributes:                                                        │
│  • id                    - Unique identifier                        │
│  • locationId            - Parent location/warehouse                │
│  • code                  - Location code (A-15-B)                   │
│  • zone                  - Zone designation                         │
│  • type                  - RACK | FLOOR | STAGING | SHIPPING       │
│  • capacity              - Max weight/volume                        │
│  • currentWeight         - Current load                             │
│  • productRestrictions   - What can be stored here                  │
│                                                                     │
│  Purpose: Physical storage location within warehouse                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.4 Transactional Entities

```
┌─────────────────────────────────────────────────────────────────────┐
│  QUOTE                                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Attributes:                                                        │
│  • id                    - Unique identifier                        │
│  • quoteNumber           - Display number (Q-2026-xxxxx)            │
│  • divisionId            - Issuing division                         │
│  • locationId            - Issuing location                         │
│  • customerId            - Customer being quoted                    │
│  • status                - DRAFT | SENT | ACCEPTED | EXPIRED       │
│  • validUntil            - Expiration date                          │
│  • lines                 - Quote line items                         │
│  • subtotal              - Before tax/freight                       │
│  • tax                   - Tax amount                               │
│  • freight               - Freight estimate                         │
│  • total                 - Grand total                              │
│  • convertedToOrderId    - If converted, order reference           │
│  • createdBy             - User who created                         │
│  • createdAt             - Creation timestamp                       │
│                                                                     │
│  Purpose: Price proposal before order commitment                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  ORDER                                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Attributes:                                                        │
│  • id                    - Unique identifier                        │
│  • orderNumber           - Display number (ORD-2026-xxxxx)          │
│  • divisionId            - Owning division                          │
│  • locationId            - Fulfilling location                      │
│  • customerId            - Purchasing customer                      │
│  • customerPO            - Customer's PO number                     │
│  • status                - Order status (see state machine)         │
│  • type                  - STANDARD | WILL_CALL | BLANKET          │
│  • orderDate             - When order was placed                    │
│  • requestedDate         - Customer requested delivery              │
│  • promisedDate          - Our committed delivery                   │
│  • lines                 - Order line items                         │
│  • shipToAddress         - Delivery address                         │
│  • shipMethod            - Shipping method preference               │
│  • subtotal              - Before tax/freight                       │
│  • tax                   - Tax amount                               │
│  • freight               - Freight charges                          │
│  • total                 - Grand total                              │
│  • paymentTerms          - Net 30, COD, etc.                       │
│  • sourceQuoteId         - If from quote                            │
│  • salesRepId            - Assigned sales rep                       │
│  • notes                 - Order notes                              │
│  • createdBy             - User who created                         │
│  • createdAt             - Creation timestamp                       │
│                                                                     │
│  Purpose: Customer purchase commitment                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  ORDER LINE                                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Attributes:                                                        │
│  • id                    - Unique identifier                        │
│  • orderId               - Parent order                             │
│  • lineNumber            - Sequence number                          │
│  • productId             - Product being ordered                    │
│  • description           - Line description                         │
│  • quantityOrdered       - Ordered quantity                         │
│  • quantityShipped       - Shipped so far                           │
│  • quantityBackordered   - On backorder                             │
│  • unitPrice             - Price per unit                           │
│  • unitOfMeasure         - UOM for price                            │
│  • extendedPrice         - Line total                               │
│  • processingRequired    - Needs shop floor work                    │
│  • processingInstructions - Cut length, drawing, etc.               │
│  • allocatedInventory    - Inventory items allocated                │
│  • workOrderId           - Generated work order                     │
│  • status                - PENDING | PROCESSING | COMPLETE | SHIP  │
│                                                                     │
│  Purpose: Individual item on an order                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  WORK ORDER                                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Attributes:                                                        │
│  • id                    - Unique identifier                        │
│  • workOrderNumber       - Display number (WO-2026-xxxxx)           │
│  • divisionId            - Division                                 │
│  • locationId            - Location                                 │
│  • orderId               - Parent sales order                       │
│  • orderLineId           - Specific order line                      │
│  • status                - CREATED | RELEASED | IN_PROCESS | DONE  │
│  • priority              - 1-5 priority level                       │
│  • productId             - What we're making                        │
│  • quantity              - Quantity to produce                      │
│  • materialAllocations   - Allocated inventory items                │
│  • routingTemplateId     - Processing template used                 │
│  • operations            - List of operations                       │
│  • scheduledStart        - Planned start                            │
│  • scheduledEnd          - Planned completion                       │
│  • actualStart           - When work began                          │
│  • actualEnd             - When work completed                      │
│  • notes                 - Production notes                         │
│                                                                     │
│  Purpose: Production instruction for shop floor                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.5 Execution Entities

```
┌─────────────────────────────────────────────────────────────────────┐
│  JOB                                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Attributes:                                                        │
│  • id                    - Unique identifier                        │
│  • jobNumber             - Display number (J-xxxxx)                 │
│  • workOrderId           - Parent work order                        │
│  • status                - Job lifecycle status                     │
│  • currentOperation      - Active operation step                    │
│  • currentWorkCenter     - Where job is now                         │
│  • assignedOperator      - Current operator                         │
│  • startedAt             - When processing began                    │
│  • completedAt           - When processing finished                 │
│  • outputQuantity        - Actual quantity produced                 │
│  • scrapQuantity         - Scrap generated                          │
│  • laborMinutes          - Total labor time                         │
│                                                                     │
│  Purpose: Trackable unit of work on shop floor                      │
│                                                                     │
│  Note: Job is the entity operators interact with.                  │
│  One work order may generate one or more jobs.                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  JOB OPERATION                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Attributes:                                                        │
│  • id                    - Unique identifier                        │
│  • jobId                 - Parent job                               │
│  • sequence              - Operation sequence (10, 20, 30...)       │
│  • operationType         - SAW, LASER, QC, PACK, etc.              │
│  • workCenterId          - Assigned work center                     │
│  • status                - PENDING | IN_PROGRESS | COMPLETE | SKIP │
│  • instructions          - Operator instructions                    │
│  • estimatedMinutes      - Planned time                             │
│  • actualMinutes         - Actual time taken                        │
│  • startedAt             - When started                             │
│  • completedAt           - When finished                            │
│  • completedBy           - Operator who completed                   │
│  • measurements          - Recorded measurements                    │
│  • notes                 - Operator notes                           │
│                                                                     │
│  Purpose: Single step in processing sequence                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  PACKAGE                                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Attributes:                                                        │
│  • id                    - Unique identifier                        │
│  • packageNumber         - Display number (PKG-xxxxx or BDL-xxxxx) │
│  • shipmentId            - Parent shipment                          │
│  • type                  - BUNDLE | BOX | PALLET | CRATE | LOOSE  │
│  • contents              - List of items/quantities                 │
│  • dimensions            - L × W × H                                │
│  • weight                - Package weight                           │
│  • labelPrinted          - Label printed flag                       │
│  • createdAt             - When packaged                            │
│  • createdBy             - Who packaged                             │
│                                                                     │
│  Purpose: Physical shipping package                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  SHIPMENT                                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Attributes:                                                        │
│  • id                    - Unique identifier                        │
│  • shipmentNumber        - Display number (SHP-2026-xxxxx)          │
│  • orderId               - Parent order                             │
│  • status                - Shipment status                          │
│  • carrierType           - OWN_FLEET | LTL | FTL | PARCEL          │
│  • carrierId             - Carrier reference                        │
│  • proNumber             - Carrier PRO/tracking                     │
│  • bolNumber             - Bill of lading number                    │
│  • packages              - List of packages                         │
│  • totalWeight           - Total shipment weight                    │
│  • shipDate              - When shipped                             │
│  • deliveryDate          - When delivered                           │
│  • podCaptured           - POD received                             │
│  • podDocument           - POD reference                            │
│                                                                     │
│  Purpose: Outbound delivery of order                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.6 Financial Entities

```
┌─────────────────────────────────────────────────────────────────────┐
│  INVOICE                                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Attributes:                                                        │
│  • id                    - Unique identifier                        │
│  • invoiceNumber         - Display number (INV-2026-xxxxx)          │
│  • divisionId            - Billing division                         │
│  • orderId               - Source order                             │
│  • shipmentId            - Triggering shipment                      │
│  • customerId            - Bill-to customer                         │
│  • status                - DRAFT | SENT | PARTIAL | PAID | VOID   │
│  • invoiceDate           - Invoice date                             │
│  • dueDate               - Payment due date                         │
│  • lines                 - Invoice line items                       │
│  • subtotal              - Before tax                               │
│  • tax                   - Tax amount                               │
│  • freight               - Freight charges                          │
│  • total                 - Grand total                              │
│  • amountPaid            - Payments received                        │
│  • balance               - Remaining balance                        │
│                                                                     │
│  Purpose: Customer billing document                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  PRICE LIST                                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Attributes:                                                        │
│  • id                    - Unique identifier                        │
│  • divisionId            - Division                                 │
│  • name                  - Price list name                          │
│  • type                  - STANDARD | CONTRACT | PROMOTIONAL       │
│  • effectiveDate         - Start date                               │
│  • expirationDate        - End date                                 │
│  • customerId            - If customer-specific                     │
│  • entries               - Product/price entries                    │
│  • status                - ACTIVE | EXPIRED | DRAFT                │
│                                                                     │
│  Purpose: Pricing structure for products                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. RELATIONSHIP MAP

### 4.1 Core Relationships Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ENTITY RELATIONSHIP MAP                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                              ┌──────────┐                                       │
│                              │ COMPANY  │                                       │
│                              └────┬─────┘                                       │
│                                   │ 1:N                                         │
│                    ┌──────────────┼──────────────┐                              │
│                    │              │              │                              │
│               ┌────▼────┐   ┌─────▼─────┐  ┌─────▼─────┐                        │
│               │DIVISION │   │ LOCATION  │  │   USER    │                        │
│               └────┬────┘   └─────┬─────┘  └───────────┘                        │
│                    │              │                                             │
│        ┌───────────┼───────────┐  │                                             │
│        │           │           │  │                                             │
│   ┌────▼────┐ ┌────▼────┐ ┌────▼────┐                                          │
│   │ PRODUCT │ │CUSTOMER*│ │WORK     │                                          │
│   │         │ │         │ │CENTER   │◄────────────────────┐                    │
│   └────┬────┘ └────┬────┘ └────┬────┘                     │                    │
│        │           │           │                          │                    │
│        │           │           │                          │                    │
│   ┌────▼────┐      │      ┌────▼────┐                     │                    │
│   │INVENTORY│      │      │   JOB   │─────────────────────┘                    │
│   │  ITEM   │      │      │OPERATION│                                          │
│   └────┬────┘      │      └─────────┘                                          │
│        │           │           ▲                                               │
│        │           │           │                                               │
│        │      ┌────▼────┐ ┌────┴────┐                                          │
│        │      │  ORDER  │ │   JOB   │                                          │
│        │      └────┬────┘ └────┬────┘                                          │
│        │           │           │                                               │
│        │      ┌────▼────┐ ┌────▼────┐                                          │
│        └──────►ORDER    │ │  WORK   │                                          │
│               │  LINE   │◄┤  ORDER  │                                          │
│               └────┬────┘ └─────────┘                                          │
│                    │                                                            │
│               ┌────▼────┐      ┌─────────┐      ┌─────────┐                    │
│               │ SHIPMENT│──────│ PACKAGE │      │ INVOICE │                    │
│               └────┬────┘      └─────────┘      └────┬────┘                    │
│                    │                                  │                         │
│                    └──────────────────────────────────┘                         │
│                         (triggers billing)                                      │
│                                                                                 │
│  * Customers can be shared across divisions with division-specific settings    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Relationship Definitions

| Parent | Child | Cardinality | Description |
|--------|-------|-------------|-------------|
| Company | Division | 1:N | Company has multiple divisions |
| Company | Location | 1:N | Company has multiple locations |
| Company | User | 1:N | Company has multiple users |
| Division | Product | 1:N | Products belong to one division |
| Division | Quote | 1:N | Quotes issued by one division |
| Division | Order | 1:N | Orders belong to one division |
| Division | WorkOrder | 1:N | Work orders belong to one division |
| Location | WorkCenter | 1:N | Work centers at one location |
| Location | InventoryItem | 1:N | Inventory at one location |
| Location | BinLocation | 1:N | Bins at one location |
| Customer | Order | 1:N | Customer has many orders |
| Customer | Quote | 1:N | Customer has many quotes |
| Order | OrderLine | 1:N | Order has many lines |
| Order | Shipment | 1:N | Order can have multiple shipments |
| Order | Invoice | 1:N | Order can have multiple invoices |
| OrderLine | WorkOrder | 1:1 | Each line generates one work order |
| WorkOrder | Job | 1:N | Work order may spawn multiple jobs |
| Job | JobOperation | 1:N | Job has multiple operations |
| Product | InventoryItem | 1:N | Product has many inventory instances |
| Material | Product | 1:N | Material used in many products |
| Heat | InventoryItem | 1:N | Heat applies to many items |
| Shipment | Package | 1:N | Shipment contains packages |
| Quote | Order | 0:1 | Quote may convert to order |

### 4.3 Key Foreign Keys

```typescript
interface ForeignKeyMap {
  // Organizational
  Division: { companyId: Company };
  Location: { companyId: Company };
  User: { companyId: Company, locationId: Location };
  
  // Master Data
  Product: { divisionId: Division, materialId?: Material };
  WorkCenter: { locationId: Location, divisionId?: Division };
  CustomerDivisionSettings: { customerId: Customer, divisionId: Division };
  
  // Inventory
  InventoryItem: { 
    productId: Product, 
    divisionId: Division,
    locationId: Location, 
    heatId?: Heat,
    binLocationId?: BinLocation
  };
  BinLocation: { locationId: Location };
  
  // Transactional
  Quote: { divisionId: Division, locationId: Location, customerId: Customer };
  Order: { divisionId: Division, locationId: Location, customerId: Customer };
  OrderLine: { orderId: Order, productId: Product };
  WorkOrder: { 
    divisionId: Division, 
    locationId: Location, 
    orderId: Order, 
    orderLineId: OrderLine 
  };
  
  // Execution
  Job: { workOrderId: WorkOrder };
  JobOperation: { jobId: Job, workCenterId: WorkCenter };
  Package: { shipmentId: Shipment };
  Shipment: { orderId: Order };
  
  // Financial
  Invoice: { 
    divisionId: Division, 
    orderId: Order, 
    shipmentId?: Shipment, 
    customerId: Customer 
  };
}
```

---

## 5. OWNERSHIP RULES

### 5.1 Data Ownership Matrix

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DATA OWNERSHIP MODEL                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  GLOBAL (Company-Level)                                             │
│  ─────────────────────────────────────────────────────────────────  │
│  • Company settings and configuration                               │
│  • Division definitions                                             │
│  • Location definitions                                             │
│  • User accounts (access controlled by division)                    │
│  • Material specifications (shared reference data)                  │
│  • Heat records (shared for traceability)                          │
│                                                                     │
│  Ownership: System administrators                                   │
│  Access: Read by all, write by admins                              │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                     │
│  DIVISION-OWNED (Primary ownership)                                 │
│  ─────────────────────────────────────────────────────────────────  │
│  • Products (catalog items)                                         │
│  • Inventory items                                                  │
│  • Quotes                                                           │
│  • Orders and order lines                                           │
│  • Work orders and jobs                                             │
│  • Shipments and packages                                           │
│  • Invoices                                                         │
│  • Price lists                                                      │
│                                                                     │
│  Ownership: Division managers and users                             │
│  Access: Division users only (cross-division by permission)        │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                     │
│  LOCATION-OWNED (Physical assets)                                   │
│  ─────────────────────────────────────────────────────────────────  │
│  • Work centers                                                     │
│  • Bin locations                                                    │
│  • Dock doors / staging areas                                       │
│                                                                     │
│  Ownership: Location managers                                       │
│  Access: Location users, visible to division                       │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                     │
│  SHARED (Cross-division access)                                     │
│  ─────────────────────────────────────────────────────────────────  │
│  • Customers (global record, division-specific settings)           │
│  • Vendors (global record, division-specific settings)             │
│  • Carriers                                                         │
│                                                                     │
│  Ownership: Shared across divisions                                 │
│  Access: All divisions can read, write own division settings       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Access Control Rules

```typescript
interface AccessControlRules {
  // Division Isolation
  divisionIsolation: {
    enforced: true;
    entities: [
      'Order', 'OrderLine', 'Quote', 'WorkOrder', 'Job', 
      'Shipment', 'Invoice', 'Product', 'InventoryItem'
    ];
    crossDivisionAccess: 'EXPLICIT_PERMISSION_REQUIRED';
  };
  
  // Location Visibility
  locationVisibility: {
    // Users see data from their primary location by default
    defaultScope: 'PRIMARY_LOCATION';
    // Can access other locations with permission
    multiLocationAccess: 'BY_PERMISSION';
    // Inventory always location-scoped
    inventoryStrict: true;
  };
  
  // Customer/Vendor Sharing
  sharedEntities: {
    Customer: {
      globalRecord: true;
      divisionSettings: true;  // Each division has own pricing, terms
      createAccess: 'ANY_DIVISION';
      modifyAccess: 'CREATING_DIVISION_OR_ADMIN';
    };
    Vendor: {
      globalRecord: true;
      divisionSettings: true;
      createAccess: 'PURCHASING_ROLE';
      modifyAccess: 'PURCHASING_OR_ADMIN';
    };
  };
  
  // Heat/Material Traceability
  traceability: {
    Heat: {
      visibility: 'ALL_DIVISIONS';  // Needed for compliance
      modifyAccess: 'QC_ROLE_OR_ADMIN';
    };
    Material: {
      visibility: 'ALL_DIVISIONS';
      modifyAccess: 'ADMIN_ONLY';
    };
  };
}
```

### 5.3 Record Numbering by Division

```
┌─────────────────────────────────────────────────────────────────────┐
│                  DOCUMENT NUMBERING SCHEME                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Pattern: {PREFIX}-{DIVISION}-{LOCATION}-{YEAR}-{SEQUENCE}         │
│                                                                     │
│  Examples:                                                          │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Quotes:                                                            │
│  Q-STL-HOU-2026-00542    (Steel, Houston, 542nd quote of 2026)     │
│  Q-ALU-DAL-2026-00128    (Aluminum, Dallas, 128th quote of 2026)   │
│                                                                     │
│  Orders:                                                            │
│  ORD-STL-HOU-2026-04521  (Steel, Houston, 4521st order)            │
│  ORD-PLA-PHX-2026-00892  (Plastics, Phoenix, 892nd order)          │
│                                                                     │
│  Work Orders:                                                       │
│  WO-STL-HOU-2026-08541   (Steel, Houston)                          │
│                                                                     │
│  Jobs (shorter for shop floor):                                     │
│  J-08541                 (Derived from work order)                  │
│                                                                     │
│  Shipments:                                                         │
│  SHP-STL-HOU-2026-02145  (Steel, Houston, shipment)                │
│                                                                     │
│  Invoices:                                                          │
│  INV-STL-HOU-2026-03892  (Steel, Houston, invoice)                 │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Shorter forms for high-volume:                                     │
│  • POS receipts: R-04521                                            │
│  • Packages: PKG-04521-1 (order-sequence)                          │
│  • Labels: BDL-04521-1 (bundle)                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. MULTI-DIVISION HANDLING STRATEGY

### 6.1 Division Segmentation Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                  DIVISION SEGMENTATION STRATEGY                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  APPROACH: Soft Segmentation with Division Context                  │
│                                                                     │
│  • Division is a required context for most operations              │
│  • Data is filtered by division unless explicitly cross-division   │
│  • Users have primary division + optional secondary access         │
│  • Reporting can aggregate across divisions with permission         │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                     │
│  IMPLEMENTATION PATTERN:                                            │
│                                                                     │
│  1. Every API request includes division context                     │
│     Header: X-Division-Id: STL                                      │
│     Or: Query param: ?divisionId=STL                               │
│                                                                     │
│  2. Database queries automatically filter by division              │
│     WHERE division_id = :currentDivision                           │
│                                                                     │
│  3. Cross-division access requires explicit flag                    │
│     ?crossDivision=true (checks permission first)                  │
│                                                                     │
│  4. Shared entities have division-agnostic queries                 │
│     Customers, Vendors, Heats, Materials                           │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                     │
│  UI IMPLEMENTATION:                                                 │
│                                                                     │
│  ┌────────────────────────────────────────────────────────┐        │
│  │ ████ STEELWISE          [🔩 STEEL ▾] HOU  👤 John D. │        │
│  │                              ↑                         │        │
│  │                    Division selector in header         │        │
│  │                    Persists across session             │        │
│  │                    Changes filter all data             │        │
│  └────────────────────────────────────────────────────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Cross-Division Scenarios

```
┌─────────────────────────────────────────────────────────────────────┐
│                  CROSS-DIVISION SCENARIOS                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SCENARIO 1: Customer buys from multiple divisions                  │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Customer: ACME Corporation                                         │
│  • Buys steel from STL division                                     │
│  • Buys aluminum from ALU division                                  │
│  • Buys supplies from SUP division                                  │
│                                                                     │
│  Solution:                                                          │
│  • Single Customer record (global)                                  │
│  • CustomerDivisionSettings for each active division               │
│    - Division-specific pricing tier                                 │
│    - Division-specific payment terms                                │
│    - Division-specific sales rep                                    │
│    - Division-specific credit limit allocation                      │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Customer: ACME Corp                                        │   │
│  │  ├── STL Settings: Tier A, Net 30, $50K credit             │   │
│  │  ├── ALU Settings: Tier B, Net 45, $25K credit             │   │
│  │  └── SUP Settings: Standard, COD, $5K credit               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                     │
│  SCENARIO 2: Multi-division order (consolidated)                    │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Customer wants: Steel bars + Aluminum sheet + Welding supplies    │
│                                                                     │
│  Options:                                                           │
│  A. Separate orders per division (simpler)                         │
│     • ORD-STL-2026-xxxx for steel                                  │
│     • ORD-ALU-2026-xxxx for aluminum                               │
│     • ORD-SUP-2026-xxxx for supplies                               │
│     • Consolidated shipment (if same location)                     │
│                                                                     │
│  B. Parent order with division sub-orders (complex)                │
│     • Not recommended for Phase 1                                  │
│                                                                     │
│  Phase 1 Approach: Option A - Separate orders                      │
│  • Linked by common customer PO                                    │
│  • Can ship together from same location                            │
│  • Separate invoices per division                                  │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                     │
│  SCENARIO 3: Shared work center                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Saw can cut steel AND aluminum                                     │
│                                                                     │
│  Solution:                                                          │
│  • Work center has primary division (owner)                        │
│  • Can be scheduled by other divisions                             │
│  • Cost allocation tracked per division                            │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  WorkCenter: WC-SAW-01                                      │   │
│  │  Primary Division: STL                                      │   │
│  │  Shared With: [ALU]                                         │   │
│  │  Schedule Priority: STL jobs first, then ALU                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                     │
│  SCENARIO 4: Inter-division inventory transfer                      │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Steel division has stainless that Specialty needs                 │
│                                                                     │
│  Solution:                                                          │
│  • Transfer transaction changes divisionId on inventory            │
│  • Creates audit trail                                              │
│  • Optional internal pricing/charge-back                           │
│                                                                     │
│  For Phase 1: Manual process with supervisor approval              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.3 Location + Division Matrix

```
┌─────────────────────────────────────────────────────────────────────┐
│              LOCATION × DIVISION CAPABILITY MATRIX                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│              │  STL   │  ALU   │  PLA   │  SPC   │  SUP   │        │
│  Location    │ Steel  │ Alum   │Plastic │Special │Supplies│        │
│  ────────────│────────│────────│────────│────────│────────│        │
│  HOU Houston │   ●    │   ●    │   ○    │   ●    │   ●    │        │
│  DAL Dallas  │   ●    │   ●    │   ○    │   ○    │   ●    │        │
│  PHX Phoenix │   ●    │   ○    │   ●    │   ○    │   ●    │        │
│  ATL Atlanta │   ●    │   ●    │   ○    │   ○    │   ●    │        │
│                                                                     │
│  ● = Full operations (inventory + processing)                       │
│  ○ = Not present at this location                                   │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                     │
│  DATA IMPLICATIONS:                                                 │
│                                                                     │
│  • Products: Only show products for divisions active at location    │
│  • Inventory: Only divisions with location presence have inventory │
│  • Work Centers: Belong to location, may serve multiple divisions  │
│  • Users: Access divisions based on location capability            │
│                                                                     │
│  Example Query: "Show me steel inventory"                           │
│  • User at HOU: Shows STL inventory at HOU                         │
│  • User at PHX: Shows STL inventory at PHX                         │
│  • Admin: Can see STL inventory at all locations                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.4 Division Context in APIs

```typescript
// Request Context
interface RequestContext {
  userId: string;
  divisionId: string;        // Current active division
  locationId: string;        // Current location
  permissions: Permission[];
  crossDivisionAccess?: boolean;
}

// Middleware applies division filter
async function divisionFilter(req, res, next) {
  const ctx = req.context;
  
  // Add division filter to all queries
  req.queryFilter = {
    divisionId: ctx.divisionId,
    // For multi-location users, optionally filter location
    ...(ctx.locationFilter && { locationId: ctx.locationId })
  };
  
  // Cross-division access check
  if (req.query.crossDivision) {
    if (!hasPermission(ctx, 'CROSS_DIVISION_READ')) {
      return res.status(403).json({ error: 'Cross-division access denied' });
    }
    delete req.queryFilter.divisionId;
  }
  
  next();
}

// Example API calls
GET /api/orders                     // Orders for current division
GET /api/orders?crossDivision=true  // All orders (with permission)
GET /api/customers                  // All customers (shared entity)
GET /api/customers/{id}/orders      // Customer's orders in current division
```

---

## 7. CONCEPTUAL DATA MODEL DIAGRAM

### 7.1 High-Level Entity Groupings

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│                              CONCEPTUAL DATA MODEL                                       │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              ORGANIZATIONAL                                      │   │
│  │                                                                                 │   │
│  │     ┌──────────┐         ┌──────────┐         ┌──────────┐                     │   │
│  │     │ COMPANY  │────────►│ DIVISION │         │ LOCATION │                     │   │
│  │     └──────────┘         └────┬─────┘         └────┬─────┘                     │   │
│  │           │                   │                    │                            │   │
│  │           │              ┌────┴────┐          ┌────┴────┐                      │   │
│  │           └─────────────►│  USER   │◄─────────┤  (link) │                      │   │
│  │                          └─────────┘          └─────────┘                      │   │
│  │                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                         │                                               │
│                                         ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                               MASTER DATA                                        │   │
│  │                                                                                 │   │
│  │   ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐              │   │
│  │   │ CUSTOMER │     │  VENDOR  │     │ MATERIAL │     │ PRODUCT  │              │   │
│  │   │  (shared)│     │  (shared)│     │  (shared)│     │(division)│              │   │
│  │   └────┬─────┘     └──────────┘     └────┬─────┘     └────┬─────┘              │   │
│  │        │                                  │                │                    │   │
│  │        │           ┌──────────┐          │                │                    │   │
│  │        │           │   HEAT   │◄─────────┘                │                    │   │
│  │        │           │  (shared)│                           │                    │   │
│  │        │           └────┬─────┘                           │                    │   │
│  │        │                │                                 │                    │   │
│  └────────┼────────────────┼─────────────────────────────────┼────────────────────┘   │
│           │                │                                 │                         │
│           ▼                ▼                                 ▼                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              INVENTORY                                           │   │
│  │                                                                                 │   │
│  │        ┌───────────────────────────────────────────────────┐                   │   │
│  │        │                INVENTORY ITEM                     │                   │   │
│  │        │  ┌─────────┐  ┌─────────┐  ┌─────────┐           │                   │   │
│  │        │  │ STOCK   │  │ REMNANT │  │   WIP   │           │                   │   │
│  │        │  └─────────┘  └─────────┘  └─────────┘           │                   │   │
│  │        └───────────────────────────────────────────────────┘                   │   │
│  │                                │                                                │   │
│  │                          ┌─────┴─────┐                                         │   │
│  │                          │    BIN    │                                         │   │
│  │                          │ LOCATION  │                                         │   │
│  │                          └───────────┘                                         │   │
│  │                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                         │                                               │
│                                         ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                            TRANSACTIONAL                                         │   │
│  │                                                                                 │   │
│  │    ┌──────────┐         ┌──────────┐         ┌──────────┐                      │   │
│  │    │  QUOTE   │────────►│  ORDER   │────────►│  ORDER   │                      │   │
│  │    │          │ convert │          │ lines   │   LINE   │                      │   │
│  │    └──────────┘         └────┬─────┘         └────┬─────┘                      │   │
│  │                              │                    │                             │   │
│  │                              │                    │ generates                   │   │
│  │                              │               ┌────▼─────┐                      │   │
│  │                              │               │  WORK    │                      │   │
│  │                              │               │  ORDER   │                      │   │
│  │                              │               └────┬─────┘                      │   │
│  │                              │                    │                             │   │
│  └──────────────────────────────┼────────────────────┼─────────────────────────────┘   │
│                                 │                    │                                  │
│                                 ▼                    ▼                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              EXECUTION                                           │   │
│  │                                                                                 │   │
│  │    ┌──────────┐         ┌──────────┐         ┌──────────┐                      │   │
│  │    │   JOB    │────────►│   JOB    │◄────────│  WORK    │                      │   │
│  │    │          │ has     │OPERATION │ at      │  CENTER  │                      │   │
│  │    └────┬─────┘         └──────────┘         └──────────┘                      │   │
│  │         │                                                                       │   │
│  │         │ packs into                                                            │   │
│  │    ┌────▼─────┐         ┌──────────┐                                           │   │
│  │    │ PACKAGE  │────────►│ SHIPMENT │                                           │   │
│  │    │          │ part of │          │                                           │   │
│  │    └──────────┘         └────┬─────┘                                           │   │
│  │                              │                                                  │   │
│  └──────────────────────────────┼──────────────────────────────────────────────────┘   │
│                                 │ triggers                                              │
│                                 ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              FINANCIAL                                           │   │
│  │                                                                                 │   │
│  │    ┌──────────┐         ┌──────────┐         ┌──────────┐                      │   │
│  │    │ INVOICE  │◄────────│ PAYMENT  │         │ PRICE    │                      │   │
│  │    │          │ applies │          │         │   LIST   │                      │   │
│  │    └──────────┘         └──────────┘         └──────────┘                      │   │
│  │                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. IMPLEMENTATION GUIDELINES

### 8.1 Database Schema Approach

```typescript
// Every division-scoped table includes these columns
interface DivisionScopedTable {
  id: string;              // UUID primary key
  divisionId: string;      // FK to Division, required, indexed
  locationId: string;      // FK to Location, often required
  createdAt: Date;
  createdBy: string;       // FK to User
  updatedAt: Date;
  updatedBy: string;
  deletedAt?: Date;        // Soft delete
}

// Global/shared tables don't have divisionId
interface GlobalTable {
  id: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

// Composite indices for common queries
// Orders: (divisionId, status, createdAt)
// Inventory: (divisionId, locationId, productId, status)
// Jobs: (divisionId, workCenterId, status)
```

### 8.2 Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Tables | PascalCase, singular | `Order`, `OrderLine`, `InventoryItem` |
| Columns | camelCase | `customerId`, `createdAt`, `orderNumber` |
| Foreign Keys | `{tableName}Id` | `orderId`, `divisionId`, `locationId` |
| Indices | `idx_{table}_{columns}` | `idx_order_division_status` |
| Enums | UPPER_SNAKE_CASE | `ORDER_STATUS`, `SHIPMENT_TYPE` |
| Display Numbers | `{PREFIX}-{YEAR}-{SEQ}` | `ORD-2026-04521` |

### 8.3 Soft Delete Strategy

```typescript
// All transactional and execution entities use soft delete
// Master data may use soft delete or status flag

interface SoftDeleteable {
  deletedAt?: Date;      // null = active, date = deleted
  deletedBy?: string;    // Who deleted
}

// Query pattern
const activeOrders = await Order.find({
  where: {
    divisionId: ctx.divisionId,
    deletedAt: IsNull()  // Only non-deleted
  }
});

// Never hard delete transactional data
// Retention policy: 7 years for financial, 3 years for operational
```

---

## 9. PHASE 1 SCOPE BOUNDARIES

### 9.1 In Scope for Phase 1

| Entity Category | Included | Notes |
|-----------------|:--------:|-------|
| Company, Division, Location | ✓ | Full implementation |
| User, Permissions | ✓ | Basic RBAC |
| Customer, Vendor | ✓ | With division settings |
| Product, Material | ✓ | Core catalog |
| Inventory Item | ✓ | Stock, Remnant types |
| Heat | ✓ | Full traceability |
| Quote, Order, OrderLine | ✓ | Core transaction flow |
| Work Order, Job, Operation | ✓ | Shop floor execution |
| Package, Shipment | ✓ | Basic outbound |
| Invoice | ✓ | Basic billing |

### 9.2 Deferred to Phase 2+

| Feature | Phase | Reason |
|---------|:-----:|--------|
| Multi-company/tenant | 2 | Single company first |
| Blanket orders/releases | 2 | Complex scheduling |
| Consignment inventory | 2 | Special handling |
| Purchase orders | 2 | Receiving flow |
| Returns/RMA | 2 | Exception handling |
| Quality holds/NCRs | 2 | QA workflow |
| Advanced pricing (tiered) | 2 | Pricing engine |
| Commission tracking | 3 | Sales compensation |
| EDI integration | 3 | Customer systems |

---

**End of Data Model (Phase 1 Level) Specification**
