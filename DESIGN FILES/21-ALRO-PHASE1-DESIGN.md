# ALROWARE PHASE 1 - SERVICE CENTER PLATFORM DESIGN

> **Status notice (2026-11-19, Phase 12 certification).** This document was written before or outside the engineering quality program. It is a design, sales or set-up document, not evidence that anything it describes is built, tested or approved for production. What is built and verified is in `qa/enterprise-excellence/phase-12-system-certification.md`; the production recommendation is in `qa/enterprise-excellence/phase-12-final-report.md`.

## Tailored for Alro Steel-Style Operations

---

# 1. OVERVIEW & DESIGN GOALS

## 1.1 Platform Vision

AlroWare is a modular, permission-based ERP/MES platform built specifically for **metals and plastics service centers** operating in high-velocity, next-day delivery environments. The platform supports:

- **Multi-division operations**: Metals, Plastics, Industrial Supplies, Retail Outlet
- **Multi-location networks**: 80+ locations with varied capabilities
- **Cut-to-size processing**: Next-day delivery as a core promise
- **Toll processing + distribution**: Both customer-owned and house-owned material

## 1.2 Phase 1 Scope

| Module | Status | Description |
|--------|--------|-------------|
| Order Intake / POS | ✅ Active | Phone, rep, counter, online orders |
| Receiving | ✅ Active | Inbound material check-in |
| Processing & Manufacturing | ✅ Active | Work orders, routing, execution |
| Scheduling & Capacity | ✅ Active | Work center scheduling, SLA tracking |
| Shop Floor Execution | ✅ Active | Operator tablet interface |
| Packaging | ✅ Active | Bundle creation, labeling |
| Shipping | ✅ Active | BOL generation, dispatch |
| Billing Triggers | ✅ Active | Job completion → invoice triggers |
| Customer Portal | 🔶 Hooks | Basic status visibility |

## 1.3 Design Principles

### 1.3.1 Next-Day Promise
Every UX decision optimizes for **speed-to-ship**:
- One-click order entry from repeat customers
- Drag-and-drop scheduling
- Large touch targets for shop floor
- Real-time SLA health indicators (🟢🟡🔴)

### 1.3.2 Division-Aware
Platform understands that Metals ≠ Plastics ≠ Supplies:
- Different processing capabilities per division
- Different pricing models (weight vs linear ft vs each)
- Different tolerance standards

### 1.3.3 Location-Specific
Each location has unique:
- Work centers and capabilities
- Truck dispatch cut-off times
- Shift schedules
- Regional pricing zones

### 1.3.4 Ownership Clarity
Every material unit tracks:
- **HOUSE_OWNED**: Service center's inventory for resale
- **CUSTOMER_OWNED**: Toll processing material
- **CONSIGNMENT**: Vendor-owned, on-site

---

# 2. USER PERSONAS & JOURNEYS

## 2.1 Persona Matrix for Alro-Style Operations

| Role | Division Access | Primary Workflow | Key Screens |
|------|-----------------|------------------|-------------|
| **CSR / Inside Sales** | All | Order intake, customer lookup | Order Board, Quick Quote |
| **Counter Sales (Retail)** | Outlet | Walk-in POS, remnant sales | POS Terminal, Inventory Lookup |
| **Scheduler / Planner** | Metals, Plastics | Job scheduling, capacity | Schedule Board, Work Center View |
| **Shop Operator** | Assigned Work Center | Job execution | Shop Floor Tablet |
| **Receiving Clerk** | Assigned Location | Inbound check-in | Receiving Desk |
| **Packaging Clerk** | Assigned Location | Bundle, label, stage | Packaging Queue |
| **Shipping Clerk** | Assigned Location | Load building, BOL | Shipping Desk |
| **QC Inspector** | All | Inspection, hold/release | QC Dashboard |
| **Branch Manager** | Single Location | All local operations | Branch Dashboard |
| **Division Manager** | Single Division | Cross-location metrics | Division Analytics |
| **Regional Director** | Multi-Location | Network performance | Executive Dashboard |

---

## 2.2 Key User Journeys

### 2.2.1 Journey: Phone Order → Next-Day Delivery (CSR)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  PHONE ORDER → NEXT-DAY DELIVERY JOURNEY                                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  9:15 AM                    9:18 AM                    9:20 AM                      │
│  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐               │
│  │ PHONE RINGS │──────────▶│ LOOKUP CUST │──────────▶│ CHECK STOCK │               │
│  │             │           │  ABC Steel  │           │  HR 0.125"  │               │
│  └─────────────┘           └─────────────┘           └─────────────┘               │
│        │                         │                         │                        │
│        ▼                         ▼                         ▼                        │
│  Caller ID pops            Contract pricing           Real-time ATP                │
│  recent orders             auto-loads                 shows 12 coils               │
│                                                       in stock                      │
│                                                                                      │
│  9:22 AM                    9:25 AM                    9:30 AM                      │
│  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐               │
│  │ ADD PROCESS │──────────▶│ CONFIRM ORD │──────────▶│ AUTO-SCHED  │               │
│  │ "Slit to 6" │           │  + Pricing  │           │ JOB CREATED │               │
│  └─────────────┘           └─────────────┘           └─────────────┘               │
│        │                         │                         │                        │
│        ▼                         ▼                         ▼                        │
│  Select process            Total: $2,847.50           Job JOB-1234                 │
│  "SLITTING"                Ship: Tomorrow AM          assigned to                  │
│  Enter slit widths         Customer confirms          Slitter #1                   │
│                                                       Queue position: 3            │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**CSR Screen Flow:**
1. **Customer Lookup** (auto-pop from phone) → Shows recent orders, contract pricing, credit status
2. **Inventory Search** → Real-time ATP by location, grade, dimensions
3. **Order Entry** → Material spec, processing instructions, delivery window
4. **Confirmation** → Pricing summary, SLA indicator, one-click submit

---

### 2.2.2 Journey: Walk-In Retail Sale (Counter Sales)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  RETAIL COUNTER / METALS OUTLET JOURNEY                                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Customer walks in         Counter scans              Quick price                   │
│  with pickup truck         material tag               lookup                        │
│  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐               │
│  │   WALK-IN   │──────────▶│ SCAN / FIND │──────────▶│  POS QUOTE  │               │
│  │  CUSTOMER   │           │   REMNANT   │           │   $127.50   │               │
│  └─────────────┘           └─────────────┘           └─────────────┘               │
│        │                         │                         │                        │
│        ▼                         ▼                         ▼                        │
│  "Need 4' of               Scan barcode:              Remnant pricing              │
│   1" square tube"          TUBE-SS-1X1-48"            (discounted)                 │
│                            Rack B-14                  or list price                │
│                                                                                      │
│  Optional processing       Payment                     Load & go                    │
│  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐               │
│  │ CUT REQUEST │──────────▶│   PAYMENT   │──────────▶│   PICKUP    │               │
│  │ "Cut to 24" │           │  CC / ACCT  │           │   RECEIPT   │               │
│  └─────────────┘           └─────────────┘           └─────────────┘               │
│        │                         │                         │                        │
│        ▼                         ▼                         ▼                        │
│  Add saw cut: $15          Cash/CC/Account             Print receipt               │
│  Wait time: 10 min         Net 30 if known             + packing slip              │
│                            customer                                                 │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Counter Sales Screen Flow:**
1. **POS Terminal** → Large buttons, barcode scanner integration
2. **Inventory Lookup** → Search by description, scan tag, browse rack
3. **Quick Cut** → Simple processing (saw cuts) while-you-wait
4. **Checkout** → Multiple payment methods, account lookup

---

### 2.2.3 Journey: Shop Floor Operator (Slitter)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  SHOP FLOOR OPERATOR - SLITTER #1 SHIFT                                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  6:00 AM - Shift Start                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  LOGIN TO TABLET                                                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │    │
│  │  │   SLITTER    │  │   JOHN D.    │  │  BADGE SCAN  │  │   QUEUE: 8   │    │    │
│  │  │     #1       │  │   Operator   │  │   ✓ LOGGED   │  │    JOBS      │    │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  6:05 AM - View Queue                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  JOB QUEUE - Priority Sorted                                                 │    │
│  │  ┌───────────────────────────────────────────────────────────────────────┐  │    │
│  │  │ 🔴 HOT  JOB-1234  ABC Steel     HR 0.125"x48" → 6"x6"  Ship: 10AM   │  │    │
│  │  ├───────────────────────────────────────────────────────────────────────┤  │    │
│  │  │ 🟡 RUSH JOB-1235  Metro Mfg     CR 0.060"x36" → 4"x4"  Ship: 2PM    │  │    │
│  │  ├───────────────────────────────────────────────────────────────────────┤  │    │
│  │  │ 🟢 NORM JOB-1236  Precision     Galv 0.048"x24" → 3"   Ship: Tomorrow│  │    │
│  │  └───────────────────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  6:10 AM - Start Job                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  ACTIVE JOB: JOB-1234                                      ⏱️ 00:45:22      │    │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │    │
│  │  │  Customer: ABC Steel          Material: HR 0.125" x 48" Coil       │    │    │
│  │  │  Process: SLIT → 8 x 6.0"     Target: 24 coils                     │    │    │
│  │  │  Progress: ████████░░ 18/24   Weight: 32,450 lbs                   │    │    │
│  │  └─────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                              │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │    │
│  │  │              │  │              │  │              │  │              │    │    │
│  │  │   ⏸️ PAUSE   │  │ 📊 RECORD   │  │ ⚠️ ISSUE    │  │ ✅ COMPLETE  │    │    │
│  │  │              │  │   OUTPUT    │  │              │  │              │    │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Operator Key Interactions:**
- **BIG BUTTONS** - Touch-friendly, no precision clicking
- **Minimal typing** - Mostly taps and scans
- **Visual progress** - Always know where you are
- **Quick issue reporting** - One tap to log problem

---

## 2.3 Persona: Division-Specific Variations

### 2.3.1 Metals Division

| Process | Work Centers | Parameters Captured |
|---------|--------------|---------------------|
| Slitting | Slitter #1, #2, #3 | Slit widths, edge trim, burr side |
| Cut-to-Length | CTL Line #1, #2 | Sheet length, leveling, squareness |
| Plate Sawing | Saw #1, #2 | Cut length, tolerance, kerf |
| Shearing | Shear #1 | Cut size, squareness |
| Plasma/Laser | Plasma #1, Laser #1 | DXF file, pierce count, edge quality |
| Waterjet | Waterjet #1 | Material type, thickness, edge quality |

### 2.3.2 Plastics Division

| Process | Work Centers | Parameters Captured |
|---------|--------------|---------------------|
| CNC Saw Cutting | Plastic Saw #1 | Cut length, tolerance |
| CNC Routing | Router #1, #2 | Part program, tool path |
| CNC Milling | Mill #1 | Part program, surface finish |
| Drilling/Tapping | Drill Press #1 | Hole size, thread spec |
| Bending/Forming | Heat Bender #1 | Bend radius, temperature |
| Plastic Welding | Weld Station #1 | Weld type, rod material |
| Die Cutting | Die Cut #1 | Die number, quantity |

### 2.3.3 Industrial Supplies

| Order Type | Fulfillment | Special Handling |
|------------|-------------|------------------|
| Stock items | Pick from shelf | Barcode scan verification |
| Cut-to-size | Route to processing | Treated as metals/plastics job |
| Special order | Vendor drop-ship | PO auto-generation |
| Kitting | Assembly station | BOM-based picking |

---

## 2.4 Permissions by Role

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  ROLE-BASED ACCESS MATRIX                                                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Module              │ CSR │ Counter │ Sched │ Oper │ Recv │ Pack │ Ship │ Mgr │    │
│  ────────────────────┼─────┼─────────┼───────┼──────┼──────┼──────┼──────┼─────┤    │
│  Order Intake        │ ✅  │   ✅    │  👁️   │  ❌  │  ❌  │  ❌  │  ❌  │ ✅  │    │
│  POS / Retail        │ ❌  │   ✅    │  ❌   │  ❌  │  ❌  │  ❌  │  ❌  │ ✅  │    │
│  Order Board         │ ✅  │   👁️    │  ✅   │  👁️  │  👁️  │  👁️  │  👁️  │ ✅  │    │
│  Scheduling          │ 👁️  │   ❌    │  ✅   │  👁️  │  ❌  │  ❌  │  ❌  │ ✅  │    │
│  Shop Floor          │ ❌  │   ❌    │  👁️   │  ✅  │  ❌  │  ❌  │  ❌  │ ✅  │    │
│  Receiving           │ ❌  │   ❌    │  ❌   │  ❌  │  ✅  │  ❌  │  ❌  │ ✅  │    │
│  Packaging           │ ❌  │   ❌    │  ❌   │  ❌  │  ❌  │  ✅  │  👁️  │ ✅  │    │
│  Shipping            │ ❌  │   ❌    │  ❌   │  ❌  │  ❌  │  👁️  │  ✅  │ ✅  │    │
│  Inventory           │ 👁️  │   👁️    │  👁️   │  👁️  │  ✅  │  👁️  │  👁️  │ ✅  │    │
│  Pricing Override    │ 🔒  │   🔒    │  ❌   │  ❌  │  ❌  │  ❌  │  ❌  │ ✅  │    │
│  Reports             │ 👁️  │   ❌    │  👁️   │  ❌  │  ❌  │  ❌  │  ❌  │ ✅  │    │
│  Settings            │ ❌  │   ❌    │  ❌   │  ❌  │  ❌  │  ❌  │  ❌  │ 🔒  │    │
│                                                                                      │
│  Legend: ✅ Full Access  👁️ View Only  🔒 With Approval  ❌ No Access               │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 3. MODULE-BY-MODULE UX/UI DESIGN

## 3.1 Order Intake / POS Module

### 3.1.1 Order Sources

| Source | Entry Point | Typical User | Volume |
|--------|-------------|--------------|--------|
| **Phone** | Order Entry Screen | CSR / Inside Sales | 60% |
| **Sales Rep** | Mobile App / Web | Outside Sales | 15% |
| **Retail Counter** | POS Terminal | Counter Sales | 15% |
| **Online Store** | API Integration | Customer Self-Service | 10% |

### 3.1.2 Order Entry Screen (Phone/Rep Orders)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  NEW ORDER                                           📞 Caller: (555) 123-4567      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  CUSTOMER ──────────────────────────────────────────────────────────────────────    │
│  ┌────────────────────────────────────────┐  ┌─────────────────────────────────┐    │
│  │ 🔍 ABC Steel Corporation         ▼    │  │ Contract: METALS-2024-ABC      │    │
│  │    Credit: ✅ $250K | Avail: $180K    │  │ Terms: Net 30                   │    │
│  └────────────────────────────────────────┘  │ Rep: Sarah Johnson             │    │
│                                              └─────────────────────────────────┘    │
│  Ship To: [Same as Bill To ▼]    Bill To: [ABC Steel - Main ▼]                     │
│                                                                                      │
│  ORDER LINES ───────────────────────────────────────────────────────────────────    │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │ Line │ Material              │ Qty  │ UOM │ Processing      │ Unit $  │ Ext $ │  │
│  ├──────┼───────────────────────┼──────┼─────┼─────────────────┼─────────┼───────┤  │
│  │  1   │ HR Coil 0.125" x 48"  │ 8    │ Ea  │ Slit → 6" x 6"  │ $0.42/lb│$2,847 │  │
│  │      │ Grade: A1011 CS-B     │      │     │ Mill edge trim  │ +$45/coi│       │  │
│  │      │ Stock: 12 avail ✅    │      │     │                 │         │       │  │
│  ├──────┼───────────────────────┼──────┼─────┼─────────────────┼─────────┼───────┤  │
│  │  2   │ CR Sheet 16ga x 60"   │ 500  │ Pcs │ Shear 24" x 36" │ $0.58/lb│$1,450 │  │
│  │      │ Grade: A1008 CS-B     │      │     │ Deburr edges    │ +$0.15/p│       │  │
│  │      │ Stock: 2,400 pcs ✅   │      │     │                 │         │       │  │
│  └──────┴───────────────────────┴──────┴─────┴─────────────────┴─────────┴───────┘  │
│  [+ Add Line]                                                                        │
│                                                                                      │
│  DELIVERY ──────────────────────────────────────────────────────────────────────    │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌────────────────────────────┐   │
│  │ Division: [Metals▼] │  │ Ship From: [Detroit]│  │ Requested: [01/18 AM    ▼] │   │
│  └─────────────────────┘  └─────────────────────┘  └────────────────────────────┘   │
│                                                                                      │
│  Priority: ○ Normal  ○ Rush (+15%)  ● HOT (+25%)     SLA: 🟢 Achievable             │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │ Notes: Customer needs by 10AM - production line down                          │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  PRICING SUMMARY ───────────────────────────────────────────────────────────────    │
│  │ Material:        $4,297.00 │ Contract discount applied: -$214.85              │  │
│  │ Processing:        $410.00 │ HOT priority surcharge:     +$85.00              │  │
│  │ Freight:           $185.00 │ ─────────────────────────────────────            │  │
│  │                            │ ORDER TOTAL:              $4,762.15              │  │
│                                                                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────────────┐    │
│  │  Save Draft    │  │  Send Quote    │  │  ✅ SUBMIT ORDER                   │    │
│  └────────────────┘  └────────────────┘  └────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1.3 Material Selection UX

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  SELECT MATERIAL                                                          [X Close] │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Division: [Metals ▼]   Form: [Coil ▼]   Grade Family: [Carbon ▼]                   │
│                                                                                      │
│  🔍 Search: [HR coil 48"                                           ]                │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │ MATCHING PRODUCTS                                          Sort: [Relevance▼] │  │
│  ├───────────────────────────────────────────────────────────────────────────────┤  │
│  │ ✅ HR Coil 0.125" x 48" - A1011 CS-B                                          │  │
│  │    Thickness: 0.125" (11 ga)  |  Width: 48"  |  Edge: Mill                    │  │
│  │    ┌─────────────────────────────────────────────────────────────────────┐    │  │
│  │    │ Location    │ Available │ Allocated │ Price/lb │ Lead Time        │    │  │
│  │    ├─────────────┼───────────┼───────────┼──────────┼──────────────────┤    │  │
│  │    │ Detroit     │ 12 coils  │ 3 coils   │ $0.42    │ Same day         │    │  │
│  │    │ Cleveland   │ 8 coils   │ 0 coils   │ $0.42    │ Next day         │    │  │
│  │    │ Chicago     │ 22 coils  │ 5 coils   │ $0.41    │ 2 days           │    │  │
│  │    └─────────────┴───────────┴───────────┴──────────┴──────────────────┘    │  │
│  │                                                            [SELECT DETROIT]  │  │
│  ├───────────────────────────────────────────────────────────────────────────────┤  │
│  │ HR Coil 0.125" x 48" - A1011 CS-A (Higher carbon)                            │  │
│  │    Thickness: 0.125" (11 ga)  |  Width: 48"  |  Edge: Mill                    │  │
│  │    Detroit: 4 coils | $0.44/lb                              [SELECT]         │  │
│  ├───────────────────────────────────────────────────────────────────────────────┤  │
│  │ HR Coil 0.120" x 48" - A1011 CS-B (Slightly thinner)                         │  │
│  │    Thickness: 0.120" (11 ga)  |  Width: 48"  |  Edge: Mill                    │  │
│  │    Detroit: 6 coils | $0.42/lb                              [SELECT]         │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1.4 Processing Instructions Builder

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  PROCESSING INSTRUCTIONS                                                 [X Close]  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Material: HR Coil 0.125" x 48" - A1011 CS-B                                        │
│                                                                                      │
│  Process Type: ● Slitting  ○ Cut-to-Length  ○ Shearing  ○ Blanking  ○ Multi-Step   │
│                                                                                      │
│  SLITTING PARAMETERS ───────────────────────────────────────────────────────────    │
│                                                                                      │
│  Pattern:  ○ Equal widths  ● Custom widths  ○ Template: [Standard 6-pack ▼]         │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  Slit Widths (total must equal master width minus trim)                      │    │
│  │                                                                               │    │
│  │  Master: 48.000"    Edge Trim: 0.250" x 2 = 0.500"    Available: 47.500"    │    │
│  │                                                                               │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │    │
│  │  │  6.000"  │  │  6.000"  │  │  6.000"  │  │  6.000"  │  │  6.000"  │       │    │
│  │  │  Qty: 8  │  │  Qty: 8  │  │  Qty: 8  │  │  Qty: 8  │  │  Qty: 8  │       │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │    │
│  │                                                                               │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  Remaining:                        │    │
│  │  │  6.000"  │  │  5.750"  │  │  5.750"  │  0.000" ✅                         │    │
│  │  │  Qty: 8  │  │  Qty: 8  │  │  Qty: 8  │                                    │    │
│  │  └──────────┘  └──────────┘  └──────────┘  [+ Add Width]                     │    │
│  │                                                                               │    │
│  │  Total Mults: 8 x 8 widths = 64 coils output                                 │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  OPTIONS ───────────────────────────────────────────────────────────────────────    │
│  ☑️ Remove edge trim (burr)      ☐ Oscillate wind                                   │
│  ☑️ ID/OD: 20" / 72" max         ☐ Paper interleave                                │
│  ☐ Recoil to weight: [____] lbs  ☑️ Band & tag each mult                           │
│                                                                                      │
│  Tolerance: [Commercial ▼]  ±0.005"                                                 │
│                                                                                      │
│  Special Instructions:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │ Customer wants mults banded in pairs for shipping                           │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  Processing charge: $45.00 per master coil x 8 = $360.00                           │
│                                                                                      │
│  ┌────────────────────────┐  ┌────────────────────────────────────────────────┐    │
│  │  Cancel                │  │  ✅ APPLY PROCESSING                           │    │
│  └────────────────────────┘  └────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1.5 POS Terminal (Retail Counter)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  🏭 METALS OUTLET - POS                                    Register: Counter-1      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────────────┐   │
│  │  CUSTOMER                       │  │  CART (3 items)            $347.25      │   │
│  │  ┌───────────────────────────┐  │  │  ┌─────────────────────────────────────┐│   │
│  │  │ ○ Walk-In (Cash/CC)       │  │  │  │ 1" Sq Tube SS 4' - Remnant         ││   │
│  │  │ ● Account: Metro Mfg      │  │  │  │ Qty: 2  @  $45.00/ea    $90.00     ││   │
│  │  │   Terms: Net 30           │  │  │  │                          [X Remove]││   │
│  │  └───────────────────────────┘  │  │  ├─────────────────────────────────────┤│   │
│  └─────────────────────────────────┘  │  │ 1/4" HR Plate 12"x24"               ││   │
│                                        │  │ Qty: 1  @  $127.50/ea   $127.50    ││   │
│  ┌─────────────────────────────────┐  │  │ + SAW CUT (2 cuts)       $15.00    ││   │
│  │  SCAN / SEARCH                  │  │  │                          [X Remove]││   │
│  │  ┌───────────────────────────┐  │  │  ├─────────────────────────────────────┤│   │
│  │  │ 🔍 [                    ] │  │  │  │ 3/8" Flat Bar 2" x 20'              ││   │
│  │  │    [SCAN] [LOOKUP]        │  │  │  │ Qty: 1  @  $114.75/ea   $114.75    ││   │
│  │  └───────────────────────────┘  │  │  │                          [X Remove]││   │
│  └─────────────────────────────────┘  │  └─────────────────────────────────────┘│   │
│                                        │                                         │   │
│  ┌─────────────────────────────────┐  │  ─────────────────────────────────────  │   │
│  │  QUICK CATEGORIES              │  │  Subtotal:                    $347.25   │   │
│  │  ┌─────────┐ ┌─────────┐       │  │  Tax (6%):                     $20.84   │   │
│  │  │  TUBE   │ │  FLAT   │       │  │  ─────────────────────────────────────  │   │
│  │  │  STOCK  │ │   BAR   │       │  │  TOTAL:                       $368.09   │   │
│  │  └─────────┘ └─────────┘       │  │                                         │   │
│  │  ┌─────────┐ ┌─────────┐       │  │  ┌─────────────────────────────────────┐│   │
│  │  │  ANGLE  │ │ CHANNEL │       │  │  │                                     ││   │
│  │  │         │ │         │       │  │  │         💳 PAY / CHARGE             ││   │
│  │  └─────────┘ └─────────┘       │  │  │                                     ││   │
│  │  ┌─────────┐ ┌─────────┐       │  │  └─────────────────────────────────────┘│   │
│  │  │  PLATE  │ │ REMNANT │       │  │                                         │   │
│  │  │         │ │  RACK   │       │  │  ┌────────────┐ ┌────────────────────┐  │   │
│  │  └─────────┘ └─────────┘       │  │  │ HOLD ORDER │ │ ADD QUICK CUT      │  │   │
│  └─────────────────────────────────┘  │  └────────────┘ └────────────────────┘  │   │
│                                        └─────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1.6 Pricing Model Support

| Pricing Type | Use Case | Configuration |
|--------------|----------|---------------|
| **List Price** | Walk-in retail | Base price per unit (lb, ft, each) |
| **Contract Price** | Named accounts | Customer-specific pricing tiers |
| **Commodity + Basis** | Large accounts | CRU/Platts index + fixed margin |
| **Remnant/Clearance** | Outlet sales | Marked-down aged inventory |
| **Processing Charges** | All orders | Per-operation or per-weight fees |
| **Rush/HOT Surcharge** | Priority orders | % markup for expedited service |
| **Freight** | Delivered orders | Zone-based or per-mile rates |

---

## 3.2 Receiving Module

### 3.2.1 Receiving Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  RECEIVING DESK - Detroit Warehouse                              Today: Jan 17, 2026│
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  📦 EXPECTED     │  │  🚛 ARRIVED      │  │  ✅ RECEIVED     │  │  ⚠️ ISSUES   │ │
│  │      TODAY       │  │     AT DOCK      │  │     TODAY        │  │              │ │
│  │       12         │  │        3         │  │       8          │  │      1       │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                                      │
│  INBOUND SHIPMENTS ─────────────────────────────────────────────────────────────    │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │ Status │ BOL#        │ Carrier      │ Vendor/Mill    │ Items │ ETA    │ Dock  │  │
│  ├────────┼─────────────┼──────────────┼────────────────┼───────┼────────┼───────┤  │
│  │ 🚛 AT  │ BOL-78234   │ ABC Trucking │ Nucor-Blythev  │ 6 coi │ NOW    │ D-3   │  │
│  │  DOCK  │             │ Truck #4521  │ PO-2024-1456   │       │        │       │  │
│  │        │             │              │                │       │ [START RECEIVE] │  │
│  ├────────┼─────────────┼──────────────┼────────────────┼───────┼────────┼───────┤  │
│  │ 🚛 AT  │ BOL-78235   │ XPO Freight  │ Steel Dynamics │ 12 coi│ NOW    │ D-1   │  │
│  │  DOCK  │             │ Pro# 456789  │ PO-2024-1460   │       │        │       │  │
│  │        │             │              │                │       │ [START RECEIVE] │  │
│  ├────────┼─────────────┼──────────────┼────────────────┼───────┼────────┼───────┤  │
│  │ 🚛 AT  │ TOLL-2024-89│ Customer Trk │ ⚠️ TOLL: ABC   │ 4 coi │ NOW    │ D-5   │  │
│  │  DOCK  │             │ ABC Steel    │ Customer-owned │       │        │       │  │
│  │        │             │              │ for processing │       │ [START RECEIVE] │  │
│  ├────────┼─────────────┼──────────────┼────────────────┼───────┼────────┼───────┤  │
│  │ 📦 EXP │ (pending)   │ Dayton Frt   │ ArcelorMittal  │ 8 coi │ 2:30PM │ TBD   │  │
│  │        │             │              │ PO-2024-1462   │       │        │       │  │
│  ├────────┼─────────────┼──────────────┼────────────────┼───────┼────────┼───────┤  │
│  │ 📦 EXP │ (pending)   │ Our Fleet    │ Cleveland Xfer │ 3 coi │ 4:00PM │ TBD   │  │
│  │        │             │ Truck #12    │ Inter-branch   │       │        │       │  │
│  └────────┴─────────────┴──────────────┴────────────────┴───────┴────────┴───────┘  │
│                                                                                      │
│  [+ Manual Receive (No PO)]    [📋 Print Dock Schedule]    [🔄 Refresh]             │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2.2 Receive Shipment Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  RECEIVE SHIPMENT: BOL-78234 (Nucor-Blytheville)                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Step 1 of 3: VERIFY ITEMS ─────────────────────────────────────────────────────    │
│                                                                                      │
│  PO: PO-2024-1456    Vendor: Nucor Steel    Expected: 6 coils                       │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │ ☑️ │ Scan/Tag        │ Description           │ Expected  │ Actual   │ Status  │  │
│  ├────┼─────────────────┼───────────────────────┼───────────┼──────────┼─────────┤  │
│  │ ✅ │ NUC-45221-A     │ HR 0.125" x 48" Coil  │ 42,500 lb │ 42,380 lb│ ✓ OK    │  │
│  │    │ Heat: H-78234   │ A1011 CS-B            │           │ SCANNED  │         │  │
│  ├────┼─────────────────┼───────────────────────┼───────────┼──────────┼─────────┤  │
│  │ ✅ │ NUC-45221-B     │ HR 0.125" x 48" Coil  │ 42,500 lb │ 42,610 lb│ ✓ OK    │  │
│  │    │ Heat: H-78234   │ A1011 CS-B            │           │ SCANNED  │         │  │
│  ├────┼─────────────────┼───────────────────────┼───────────┼──────────┼─────────┤  │
│  │ ✅ │ NUC-45222-A     │ HR 0.125" x 48" Coil  │ 40,000 lb │ 40,120 lb│ ✓ OK    │  │
│  │    │ Heat: H-78235   │ A1011 CS-B            │           │ SCANNED  │         │  │
│  ├────┼─────────────────┼───────────────────────┼───────────┼──────────┼─────────┤  │
│  │ ⬜ │ [SCAN NEXT]     │ HR 0.125" x 48" Coil  │ 40,000 lb │ ________ │ PENDING │  │
│  │    │                 │ A1011 CS-B            │           │          │         │  │
│  ├────┼─────────────────┼───────────────────────┼───────────┼──────────┼─────────┤  │
│  │ ⬜ │                 │ HR 0.125" x 48" Coil  │ 41,000 lb │ ________ │ PENDING │  │
│  ├────┼─────────────────┼───────────────────────┼───────────┼──────────┼─────────┤  │
│  │ ⬜ │                 │ HR 0.125" x 48" Coil  │ 41,000 lb │ ________ │ PENDING │  │
│  └────┴─────────────────┴───────────────────────┴───────────┴──────────┴─────────┘  │
│                                                                                      │
│  Scanned: 3 of 6    │    Weight Variance: +110 lb (0.09%)  ✅ Within tolerance      │
│                                                                                      │
│  [📷 Scan Tag]  [⌨️ Manual Entry]  [📄 Attach MTR]  [⚠️ Report Damage]              │
│                                                                                      │
│  ┌────────────────────┐  ┌────────────────────────────────────────────────────────┐ │
│  │  ← Back            │  │  Continue to Put-Away →                                │ │
│  └────────────────────┘  └────────────────────────────────────────────────────────┘ │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2.3 Toll Processing Receiving

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  ⚠️ TOLL MATERIAL RECEIVING                                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  CUSTOMER-OWNED MATERIAL - Special Handling Required                                │
│                                                                                      │
│  Customer: ABC Steel Corporation                                                    │
│  Toll Order: TOLL-2024-0089                                                         │
│  Processing: Slit 48" coil → 8 x 6" mults                                          │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  OWNERSHIP: 🔵 CUSTOMER-OWNED (Toll Processing)                               │  │
│  │                                                                                │  │
│  │  • Material remains property of ABC Steel                                     │  │
│  │  • Charge processing fee only (no material cost)                              │  │
│  │  • Scrap returns to customer or credit per agreement                          │  │
│  │  • MTR provided by customer - attach to record                                │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  INBOUND ITEMS ─────────────────────────────────────────────────────────────────    │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │ Tag          │ Description             │ Weight    │ Customer MTR  │ Status   │  │
│  ├──────────────┼─────────────────────────┼───────────┼───────────────┼──────────┤  │
│  │ CUST-ABC-001 │ HR 0.125" x 48" Coil    │ 38,450 lb │ MTR-45678 ✅  │ ✓ Recvd  │  │
│  │ CUST-ABC-002 │ HR 0.125" x 48" Coil    │ 41,200 lb │ MTR-45678 ✅  │ ✓ Recvd  │  │
│  │ CUST-ABC-003 │ HR 0.125" x 48" Coil    │ 39,800 lb │ MTR-45679 ✅  │ ✓ Recvd  │  │
│  │ CUST-ABC-004 │ HR 0.125" x 48" Coil    │ 40,100 lb │ MTR-45679 ✅  │ ✓ Recvd  │  │
│  └──────────────┴─────────────────────────┴───────────┴───────────────┴──────────┘  │
│                                                                                      │
│  Total Inbound: 159,550 lbs                                                         │
│  Expected Output: ~155,000 lbs (97% yield assumption)                              │
│  Processing Charge: $0.025/lb = $3,875.00                                          │
│                                                                                      │
│  [Link to Processing Job: JOB-1234]                                                 │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │  ✅ COMPLETE TOLL RECEIVING - Create Processing Work Orders                    │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2.4 Put-Away Assignment

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  PUT-AWAY ASSIGNMENT                                                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │ Coil Tag      │ Description        │ Weight   │ Suggested Loc │ Assigned Loc  │  │
│  ├───────────────┼────────────────────┼──────────┼───────────────┼───────────────┤  │
│  │ NUC-45221-A   │ HR 0.125"x48"      │ 42,380 lb│ Bay A-12      │ [A-12    ▼]   │  │
│  │               │                    │          │ (HR Coils)    │               │  │
│  ├───────────────┼────────────────────┼──────────┼───────────────┼───────────────┤  │
│  │ NUC-45221-B   │ HR 0.125"x48"      │ 42,610 lb│ Bay A-12      │ [A-12    ▼]   │  │
│  ├───────────────┼────────────────────┼──────────┼───────────────┼───────────────┤  │
│  │ NUC-45222-A   │ HR 0.125"x48"      │ 40,120 lb│ Bay A-12      │ [A-13    ▼]   │  │
│  │               │                    │          │ (A-12 full)   │ Override      │  │
│  └───────────────┴────────────────────┴──────────┴───────────────┴───────────────┘  │
│                                                                                      │
│  WAREHOUSE MAP ─────────────────────────────────────────────────────────────────    │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │     A         B         C         D         E         F                       │  │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐                        │  │
│  │  │ HR  │  │ CR  │  │ GALV│  │ SS  │  │ ALUM│  │ OUT │  Row 1                 │  │
│  │  │COILS│  │COILS│  │COILS│  │COILS│  │COILS│  │BOUND│                        │  │
│  │  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘                        │  │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐                        │  │
│  │  │A-12 │  │     │  │     │  │     │  │     │  │STAGE│  Row 2                 │  │
│  │  │⬛⬛⬛│  │     │  │     │  │     │  │     │  │     │                        │  │
│  │  │2 NEW│  │     │  │     │  │     │  │     │  │     │                        │  │
│  │  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘                        │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  [🖨️ Print Put-Away Tags]    [✅ Complete Put-Away]                                 │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3.3 Processing & Manufacturing Module

### 3.3.1 Processing Work Order Structure

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          PROCESSING WORK ORDER MODEL                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                        PROCESSING WORK ORDER                                 │    │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │    │
│  │  │  Job Number: JOB-2024-1234                                          │    │    │
│  │  │  Status: IN_PROCESS                                                 │    │    │
│  │  │  Priority: HOT 🔴                                                   │    │    │
│  │  │  Order Ref: SO-2024-5678 (Line 1)                                  │    │    │
│  │  │  Customer: ABC Steel Corporation                                    │    │    │
│  │  │  Due Date: 01/18/2026 10:00 AM                                     │    │    │
│  │  └─────────────────────────────────────────────────────────────────────┘    │    │
│  │                              │                                               │    │
│  │                              ▼                                               │    │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │    │
│  │  │  MATERIAL INPUT                                                     │    │    │
│  │  │  ─────────────────────────────────────────────────────────────────  │    │    │
│  │  │  Coil: NUC-45221-A          Ownership: HOUSE_OWNED                 │    │    │
│  │  │  Spec: HR 0.125" x 48"      Location: Bay A-12                     │    │    │
│  │  │  Grade: A1011 CS-B          Weight: 42,380 lbs                     │    │    │
│  │  │  Heat: H-78234              MTR: ✅ Attached                       │    │    │
│  │  └─────────────────────────────────────────────────────────────────────┘    │    │
│  │                              │                                               │    │
│  │                              ▼                                               │    │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │    │
│  │  │  OPERATION STEPS                                                    │    │    │
│  │  │  ─────────────────────────────────────────────────────────────────  │    │    │
│  │  │                                                                     │    │    │
│  │  │  Step 1: SLITTING                          Status: ✅ COMPLETE     │    │    │
│  │  │  ├─ Work Center: Slitter #1                                        │    │    │
│  │  │  ├─ Operator: John D.                                              │    │    │
│  │  │  ├─ Started: 01/17 6:15 AM                                         │    │    │
│  │  │  ├─ Completed: 01/17 7:45 AM                                       │    │    │
│  │  │  ├─ Parameters: 8 x 6.0" mults, 0.250" edge trim                  │    │    │
│  │  │  └─ Output: 8 mults @ 5,200 lbs each = 41,600 lbs                 │    │    │
│  │  │                                                                     │    │    │
│  │  │  Step 2: INSPECTION                        Status: 🔄 IN PROCESS   │    │    │
│  │  │  ├─ Work Center: QC Station #1                                     │    │    │
│  │  │  ├─ Inspector: Mary S.                                             │    │    │
│  │  │  ├─ Started: 01/17 7:50 AM                                         │    │    │
│  │  │  └─ Checks: Width tolerance, edge quality, surface                │    │    │
│  │  │                                                                     │    │    │
│  │  │  Step 3: PACKAGING                         Status: ⏳ PENDING      │    │    │
│  │  │  ├─ Work Center: Packaging #1                                      │    │    │
│  │  │  └─ Instructions: Band in pairs, customer tags                    │    │    │
│  │  │                                                                     │    │    │
│  │  └─────────────────────────────────────────────────────────────────────┘    │    │
│  │                              │                                               │    │
│  │                              ▼                                               │    │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │    │
│  │  │  MATERIAL OUTPUT                                                    │    │    │
│  │  │  ─────────────────────────────────────────────────────────────────  │    │    │
│  │  │  8 x Slit Coils (6.0" x 0.125")                                    │    │    │
│  │  │  ├─ MULT-45221-A-01 ... MULT-45221-A-08                           │    │    │
│  │  │  ├─ Total Output: 41,600 lbs                                       │    │    │
│  │  │  ├─ Scrap: 780 lbs (edge trim)                                    │    │    │
│  │  │  └─ Yield: 98.2%                                                   │    │    │
│  │  └─────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.3.2 Routing Templates (Alro-Style)

| Template Name | Division | Steps | Parameters |
|---------------|----------|-------|------------|
| **Standard Slit** | Metals | Slit → Inspect → Pack | Width pattern, edge trim, tolerance |
| **CTL Standard** | Metals | Level → Cut → Pack | Sheet length, flatness, stack height |
| **Plate Saw** | Metals | Saw → Deburr → Pack | Cut lengths, tolerance, edge finish |
| **Plasma Parts** | Metals | Plasma → Deburr → Pack | DXF file, pierce count, edge quality |
| **Waterjet Complex** | Metals/Plastics | Waterjet → Deburr → Pack | DXF file, taper, surface finish |
| **Plastic Saw** | Plastics | Saw → Deburr → Pack | Cut length, chip-free edge |
| **CNC Route** | Plastics | Route → Deburr → Pack | Program, tool path, edge quality |
| **Plastic Fab** | Plastics | Cut → Bend → Weld → Pack | Multiple programs/temps |

### 3.3.3 Multi-Step Job Example

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  MULTI-STEP PROCESSING JOB                                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  JOB-2024-1250: Fabricated Steel Bracket Assembly                                   │
│  Customer: Industrial Corp        Due: 01/19/2026                                   │
│                                                                                      │
│  INPUT                           PROCESS FLOW                        OUTPUT         │
│  ─────                           ────────────                        ──────         │
│                                                                                      │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐  │
│  │ HR Plate │────▶│ PLASMA   │────▶│ DEBURR   │────▶│ BEND     │────▶│ Bracket  │  │
│  │ 0.25"    │     │ CUT      │     │ GRIND    │     │ FORM     │     │ Parts    │  │
│  │ 4'x8'    │     │ 2 hours  │     │ 30 min   │     │ 45 min   │     │ 24 pcs   │  │
│  └──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘  │
│       │                │                │                │                │         │
│       │                ▼                ▼                ▼                │         │
│       │          ┌──────────┐     ┌──────────┐     ┌──────────┐          │         │
│       │          │ Plasma   │     │ Grinder  │     │ Press    │          │         │
│       │          │ Table #1 │     │ Station  │     │ Brake #1 │          │         │
│       │          │ John D.  │     │ Mike T.  │     │ Steve R. │          │         │
│       │          │ ✅ DONE  │     │ ✅ DONE  │     │ 🔄 ACTIVE│          │         │
│       │          └──────────┘     └──────────┘     └──────────┘          │         │
│       │                                                                   │         │
│       │           Scrap: 45 lbs                                          │         │
│       │           Yield: 82%                                             │         │
│       └──────────────────────────────────────────────────────────────────┘         │
│                                                                                      │
│  Timeline:                                                                          │
│  ├─ Plasma Cut:  01/17 8:00 AM - 10:00 AM  ✅                                      │
│  ├─ Deburr:      01/17 10:15 AM - 10:45 AM ✅                                      │
│  ├─ Bend/Form:   01/17 11:00 AM - 11:45 AM 🔄 (75% complete)                       │
│  └─ Pack & Ship: 01/17 12:00 PM (estimated)                                        │
│                                                                                      │
│  SLA Status: 🟢 On track for 01/19 delivery                                        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 4. INDUSTRY & OPERATIONAL ANALYSIS

## 4.1 Defining the Service Center Business

### 4.1.1 What Is a Service Center?

A **metals/plastics service center** is a value-added intermediary that sits between primary producers (mills, extruders, foundries) and end users (manufacturers, fabricators, contractors). The service center model exists because:

| Player | Core Function | Typical Lead Time | Min Order | Value Add |
|--------|---------------|-------------------|-----------|-----------|
| **Mill** | Primary production | 6-16 weeks | 40,000+ lbs | Economies of scale |
| **Service Center** | Inventory + Processing | Same day - 1 week | 1 piece | Speed, flexibility, processing |
| **Distributor** | Stock & ship | 1-3 days | Case/bundle | Convenience, credit |
| **Fabricator** | Custom manufacturing | 2-8 weeks | Project-based | Engineering, assembly |

### 4.1.2 Industry Value Chain Position

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        METALS/PLASTICS VALUE CHAIN                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  RAW MATERIAL          PRIMARY              SERVICE              END                │
│  EXTRACTION           PRODUCTION            CENTER              USER                │
│                                                                                      │
│  ┌─────────┐         ┌─────────┐         ┌─────────┐         ┌─────────┐           │
│  │  Iron   │         │  Steel  │         │  ALRO   │         │  OEM    │           │
│  │  Ore    │────────▶│  Mill   │────────▶│  STYLE  │────────▶│  Fab    │           │
│  │  Scrap  │         │         │         │  S.C.   │         │  Constr │           │
│  └─────────┘         └─────────┘         └─────────┘         └─────────┘           │
│                            │                   │                   │                │
│                            │                   │                   │                │
│                            ▼                   ▼                   ▼                │
│                      ┌───────────────────────────────────────────────┐             │
│                      │            VALUE ADDITION                     │             │
│                      ├───────────────────────────────────────────────┤             │
│                      │                                               │             │
│                      │  Mill:        Service Center:    End User:   │             │
│                      │  • Volume     • Breaking bulk    • Consumes  │             │
│                      │  • Grade      • Cut-to-size      • Transforms│             │
│                      │  • Quality    • Processing       • Assembles │             │
│                      │  • Cert       • Inventory risk   • Ships     │             │
│                      │               • Credit/Terms     • product   │             │
│                      │               • Speed            │             │
│                      │               • Certification    │             │
│                      │               • Logistics        │             │
│                      │                                               │             │
│                      └───────────────────────────────────────────────┘             │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.1.3 Why Service Centers Exist

**The fundamental value proposition:**

> *"Buy truckloads. Sell pounds. Add value. Deliver tomorrow."*

| Mill Constraint | Service Center Solution |
|-----------------|-------------------------|
| 6-16 week lead times | Same-day / next-day from stock |
| 40,000 lb minimums | Sell 1 piece to 1 truckload |
| Limited product forms | Process: slit, cut, saw, shape |
| No processing | Extensive first-stage processing |
| No regional presence | 80+ locations, local delivery |
| No credit terms | Net 30, credit management |
| No technical support | Application engineering, specs |

### 4.1.4 Differentiators of a Modern Service Center

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    COMPETITIVE DIFFERENTIATORS                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  1. SPEED                         2. PROCESSING                                     │
│  ─────────────────────────────    ─────────────────────────────                     │
│  • Same-day shipping              • Metals: slit, CTL, saw, plasma,                │
│  • Next-day delivery                laser, waterjet, shear, form                   │
│  • 2:00 PM cut-off for next AM    • Plastics: CNC route, mill, saw,               │
│  • Emergency HOT orders             bend, weld, die cut                            │
│                                   • Value-add before shipping                       │
│                                                                                      │
│  3. INVENTORY BREADTH             4. DIVERSIFICATION                               │
│  ─────────────────────────────    ─────────────────────────────                     │
│  • Carbon steel (HR, CR, Galv)    • Metals Division                                │
│  • Stainless (300/400 series)     • Plastics Division                              │
│  • Aluminum (all alloys)          • Industrial Supplies                            │
│  • Engineering plastics           • Retail Outlet (walk-in)                        │
│  • Specialty alloys               • E-commerce channel                             │
│                                                                                      │
│  5. LOGISTICS                     6. CERTIFICATIONS                                │
│  ─────────────────────────────    ─────────────────────────────                     │
│  • Own fleet + common carrier     • Full MTR traceability                          │
│  • 80+ branch locations           • Aerospace (AS9100) qualified                   │
│  • Regional coverage              • Automotive (IATF 16949) ready                  │
│  • Will-call / pickup option      • Defense (DFARS) compliant                      │
│                                   • RoHS/REACH documentation                        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4.2 Material Domains

### 4.2.1 Metals Division

| Category | Forms | Common Grades | Typical Customers |
|----------|-------|---------------|-------------------|
| **Carbon Steel** | Coil, sheet, plate, bar, tube, structural | A36, A572, A1011, A1008 | Fab shops, construction, OEM |
| **Stainless Steel** | Coil, sheet, plate, bar, tube | 304, 316, 409, 430, 17-4 | Food equip, medical, marine |
| **Aluminum** | Sheet, plate, bar, tube, extrusion | 6061, 5052, 3003, 2024, 7075 | Aerospace, transport, marine |
| **Specialty** | Various | Nickel alloys, titanium, tool steel | Aerospace, energy, tooling |

**Metals Processing Capabilities:**

| Process | Equipment | Typical Tolerance | Throughput |
|---------|-----------|-------------------|------------|
| Slitting | Slitter lines (48"-72" wide) | ±0.005" width | 50,000+ lbs/shift |
| Cut-to-Length | CTL lines | ±0.030" length | 40,000+ lbs/shift |
| Plate Sawing | Band saws, circular saws | ±0.030" | 10,000+ lbs/shift |
| Shearing | Hydraulic shears | ±0.030" | 20,000+ lbs/shift |
| Plasma Cutting | CNC plasma tables | ±0.030" | Part-dependent |
| Laser Cutting | Fiber/CO2 lasers | ±0.005" | Part-dependent |
| Waterjet | Abrasive waterjet | ±0.005" | Part-dependent |
| Forming | Press brakes, rolls | ±0.030" | Part-dependent |

### 4.2.2 Plastics Division

| Category | Forms | Common Materials | Typical Customers |
|----------|-------|------------------|-------------------|
| **Engineering Plastics** | Sheet, rod, tube, film | UHMW, HDPE, Nylon, Acetal, PTFE | Machine builders, food, conveyors |
| **Acrylics** | Sheet, rod, tube | Cast acrylic, extruded | Signage, displays, glazing |
| **Polycarbonate** | Sheet, film | Lexan, Makrolon | Safety glazing, machine guards |
| **High-Performance** | Sheet, rod | PEEK, Ultem, Torlon | Aerospace, medical, semiconductor |

**Plastics Processing Capabilities:**

| Process | Equipment | Applications |
|---------|-----------|--------------|
| CNC Saw Cutting | Precision saws | Cut-to-length bars, sheets |
| CNC Routing | 3-5 axis routers | Profile cutting, pocketing |
| CNC Milling | Vertical/horizontal mills | Precision parts |
| Drilling/Tapping | Drill presses, CNC | Hole patterns, threads |
| Bending/Forming | Heat benders, ovens | Formed shapes, enclosures |
| Plastic Welding | Hot gas, extrusion | Fabricated assemblies |
| Die Cutting | Clicker presses | Gaskets, seals, washers |

### 4.2.3 Industrial Supplies

| Category | Examples | Distribution Model |
|----------|----------|-------------------|
| **Cutting Tools** | Saw blades, drill bits, end mills | Stock & ship |
| **Abrasives** | Grinding wheels, sandpaper, belts | Stock & ship |
| **Fasteners** | Bolts, nuts, screws, rivets | Stock & ship, some kitting |
| **Safety** | Gloves, glasses, hearing protection | Stock & ship |
| **Welding** | Wire, rod, gas, equipment | Stock & ship |
| **Maintenance** | Lubricants, cleaners, tools | Stock & ship |

---

## 4.3 Customer Profiles

### 4.3.1 Customer Segmentation

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         CUSTOMER SEGMENTATION                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  HIGH VOLUME                                           LOW VOLUME                   │
│  ◄────────────────────────────────────────────────────────────────────────────────► │
│                                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │     OEM     │  │   LARGE     │  │  REGIONAL   │  │    JOB      │  │  WALK-IN  │ │
│  │  CONTRACT   │  │    FAB      │  │    FAB      │  │   SHOP      │  │  RETAIL   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘ │
│                                                                                      │
│  Volume:         Volume:         Volume:          Volume:         Volume:           │
│  $500K-$5M/yr    $100K-$500K/yr  $25K-$100K/yr    $5K-$25K/yr     $50-$5K/visit    │
│                                                                                      │
│  Pricing:        Pricing:        Pricing:         Pricing:        Pricing:          │
│  Contract/Index  Contract        Volume discount  List price      List + Remnant   │
│                                                                                      │
│  Service:        Service:        Service:         Service:        Service:          │
│  Dedicated rep   Named rep       Inside sales     Counter/phone   Counter/online   │
│  VMI possible    JIT delivery    Next-day         Will-call OK    Immediate        │
│                                                                                      │
│  Processing:     Processing:     Processing:      Processing:     Processing:       │
│  High volume     Moderate        Light            Minimal         Saw cuts only    │
│  Scheduled       Flexible        As-needed        Simple          While-you-wait   │
│                                                                                      │
│  % of Revenue:   % of Revenue:   % of Revenue:    % of Revenue:   % of Revenue:    │
│  30-40%          25-30%          15-20%           10-15%          5-10%            │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.3.2 Customer Profile Details

| Segment | Definition | Needs | Pain Points | Service Center Value |
|---------|------------|-------|-------------|---------------------|
| **OEM / Contract** | Large manufacturers with blanket orders | Consistent quality, JIT delivery, price stability | Mill lead times, inventory carrying costs | Take inventory risk, provide processing, guaranteed delivery |
| **Large Fabricator** | Metal fab shops with $5M+ revenue | Variety of materials, quick turnaround, processing | Managing multiple suppliers, quoting speed | One-stop shop, fast quotes, processing saves labor |
| **Regional Fab** | Local metal/plastic fabricators | Reliable next-day, technical support | Can't buy mill-direct, limited storage | Local stock, small quantities, technical advice |
| **Job Shop** | Small custom manufacturers | Flexibility, odd sizes, fast turnaround | Unpredictable demand, small quantities | Will-call, remnants, no minimums |
| **Construction** | Contractors, erectors | Structural, plate, on-site delivery | Project timing, site logistics | Field delivery, cut-to-length, certs |
| **MRO** | Maintenance, repair operations | Immediate availability, small quantities | Emergency needs, downtime costs | Same-day, will-call, broad inventory |
| **Retail / Walk-in** | Hobbyists, small contractors, DIY | Cash-and-carry, remnants, advice | Don't know specs, small quantities | Counter service, remnant pricing, guidance |
| **E-commerce** | Online buyers (B2B and B2C) | Self-service, transparent pricing, shipping | Can't inspect material, shipping costs | Product configurator, calculators, ship nationwide |

---

## 4.4 Operational Constraints

### 4.4.1 The Service Center Operating Equation

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    THE SERVICE CENTER OPERATING EQUATION                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│                                                                                      │
│    ┌─────────────────────────────────────────────────────────────────────────────┐  │
│    │                                                                              │  │
│    │   REVENUE  =  Material Sold  +  Processing Revenue  +  Freight Recovery    │  │
│    │                                                                              │  │
│    │   COST     =  Material Cost  +  Processing Labor    +  Freight Expense     │  │
│    │              +  Inventory Carry  +  Scrap/Yield Loss  +  Overhead           │  │
│    │                                                                              │  │
│    │   MARGIN   =  Material Spread  +  Processing Margin  -  Operational Drag   │  │
│    │                                                                              │  │
│    └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│    KEY METRICS:                                                                     │
│    ─────────────────────────────────────────────────────────────────────────────    │
│                                                                                      │
│    │ Metric                  │ Target      │ Why It Matters                      │  │
│    ├─────────────────────────┼─────────────┼─────────────────────────────────────│  │
│    │ Inventory Turns         │ 4-6x/year   │ Cash efficiency, freshness          │  │
│    │ Gross Margin            │ 18-25%      │ Spread between buy and sell         │  │
│    │ Processing Margin       │ 35-50%      │ Labor + equipment vs revenue        │  │
│    │ On-Time Delivery        │ 95%+        │ Customer promise, repeat business   │  │
│    │ Yield (Processing)      │ 95-98%      │ Scrap is direct cost                │  │
│    │ Quote-to-Order Rate     │ 30-40%      │ Sales effectiveness                 │  │
│    │ Quote Response Time     │ < 2 hours   │ Speed wins orders                   │  │
│    │ Order-to-Ship (stock)   │ < 24 hours  │ Core promise                        │  │
│    │ Order-to-Ship (process) │ 24-72 hours │ Processing lead time                │  │
│    │ Truck Utilization       │ 80%+        │ Freight cost efficiency             │  │
│    │ Slow-Moving Inventory   │ < 10%       │ Aged inventory = dead capital       │  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.4.2 Operational Constraints Matrix

| Constraint | Description | Impact | Mitigation |
|------------|-------------|--------|------------|
| **Lead Time Promise** | Next-day is the expectation | Late delivery = lost customer | Scheduling discipline, capacity buffers |
| **Processing Capacity** | Finite machine hours per day | Bottlenecks cause delays | Balance load, overtime, outsource peaks |
| **Inventory Investment** | $50-200M+ tied up in stock | Cash flow, obsolescence risk | Turn optimization, demand forecasting |
| **Labor Availability** | Skilled operators are scarce | Training time, quality variance | Cross-training, retention programs |
| **Truck Dispatch Windows** | 2PM cutoff for next-AM delivery | Orders after cutoff slip a day | Clear customer communication, HOT lanes |
| **Pricing Volatility** | Commodity prices fluctuate | Margin squeeze, quote expiration | Index-based pricing, short quote validity |
| **Certification Requirements** | Customers require MTR, certs | Manual paperwork, errors | Document automation, traceability |
| **Tolerance Specifications** | Customers expect precision | Scrap if out-of-spec | Operator training, measurement tools |
| **Scrap & Yield Loss** | Every cut generates waste | Direct hit to margin | Optimize patterns, remnant sales |
| **Credit Exposure** | Extend terms to customers | Bad debt risk | Credit checks, limits, collections |

### 4.4.3 The Capacity vs. Promise Trade-off

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    CAPACITY VS. PROMISE TRADE-OFF                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Promise Date                                                                       │
│       ▲                                                                             │
│       │                                                                             │
│   5+  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                     │
│  days │  ░░░░░░░░░░░░░░ COMFORTABLE ZONE ░░░░░░░░░░░░░░░░░░░░░                     │
│       │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                     │
│   3   │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                     │
│  days │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░                     │
│       │  ▓▓▓▓▓▓▓▓▓▓▓▓▓ COMPETITIVE ZONE ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░                     │
│   2   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░                     │
│  days │  ████████████████████████████████████████████████▓▓▓░                       │
│       │  ███████████████ PREMIUM ZONE ███████████████████▓▓▓░                       │
│ NEXT  │  ████████████████████████████████████████████████▓▓▓░                       │
│  DAY  │  ████████████████████████████████████████████████▓▓▓░                       │
│       │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░                     │
│ SAME  │  ░░░░░░░░░░ EXCEPTIONAL (HOT) ░░░░░░░░░░░░░░░░░░░░░░░                       │
│  DAY  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                     │
│       └─────────────────────────────────────────────────────────────────────────▶   │
│            20%        40%        60%        80%       100%     Capacity             │
│                                                              Utilization            │
│                                                                                      │
│  Legend:                                                                            │
│  █ Premium Zone: Can promise next-day with confidence (< 70% utilized)             │
│  ▓ Competitive Zone: Need careful scheduling (70-85% utilized)                     │
│  ░ Risky Zone: May need to extend lead times or decline (> 85%)                    │
│                                                                                      │
│  REALITY: Most service centers operate at 70-85% capacity to balance:              │
│  • Ability to take rush orders                                                      │
│  • Machine utilization economics                                                    │
│  • Labor scheduling flexibility                                                     │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4.5 Growth Levers

### 4.5.1 Organic Growth Strategies

| Strategy | Description | Investment | Payback | Risk |
|----------|-------------|------------|---------|------|
| **Branch Expansion** | Open new locations in underserved markets | $5-15M per branch | 3-5 years | Market demand uncertainty |
| **Processing Expansion** | Add capabilities (laser, waterjet, forming) | $500K-$3M per line | 2-4 years | Utilization risk |
| **Division Expansion** | Add plastics or supplies to metals branches | $1-3M inventory + equipment | 2-3 years | Learning curve |
| **E-commerce** | Online ordering, configurators, ship nationwide | $500K-$2M platform | 1-3 years | Fulfillment complexity |
| **Contract Manufacturing** | Long-term processing agreements with OEMs | Minimal (use existing) | Immediate | Dependency on few customers |
| **Toll Processing** | Process customer-owned material | Minimal (use existing) | Immediate | No material margin |

### 4.5.2 Competitive Environment

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                       COMPETITIVE LANDSCAPE                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  COMPETITOR TYPE           THREAT LEVEL     DIFFERENTIATION                         │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  National Service Centers  ████████████     Scale, network, processing              │
│  (Reliance, Ryerson)       HIGH             Investment capacity, contracts          │
│                                                                                      │
│  Regional Service Centers  ████████░░░      Local relationships, speed              │
│  (Metal Supermarkets, etc) MEDIUM-HIGH      Niche focus, flexibility                │
│                                                                                      │
│  Mill Direct Sales         ██████░░░░░      Price (no middleman margin)             │
│                             MEDIUM          Volume requirements, lead time          │
│                                                                                      │
│  Online Metals Retailers   █████░░░░░░      Convenience, transparency               │
│  (Online Metals, Metals D) MEDIUM           Limited processing, shipping time       │
│                                                                                      │
│  Local Metal Yards         ████░░░░░░░      Price, cash sales, no paperwork         │
│                             LOW-MEDIUM      Limited selection, no certs             │
│                                                                                      │
│  Fabricators with Capacity ███░░░░░░░░      Bundled with fabrication                │
│                             LOW             Limited product range                   │
│                                                                                      │
│  EMERGING THREATS:                                                                  │
│  • Amazon Business (industrial supplies, small metals)                              │
│  • 3D printing (reduced need for some machined parts)                              │
│  • Reshoring (increased demand, but also new competitors)                          │
│  • Mill consolidation (fewer sources, pricing power)                               │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4.6 Strategic Challenges

### 4.6.1 The Ten Critical Challenges

| Challenge | Description | Consequence of Failure | System Solution |
|-----------|-------------|------------------------|-----------------|
| **1. Inventory Investment** | $50-200M tied up in stock | Cash flow crisis, obsolescence | Turn analytics, demand forecasting |
| **2. Labor Scarcity** | Skilled operators hard to find/keep | Capacity constraints, quality issues | Training tracking, retention tools |
| **3. Promise Date Accuracy** | Committing to dates you can't hit | Lost customers, reputation damage | Real-time capacity visibility |
| **4. Quoting Speed** | Customers expect quotes in hours | Lost orders to faster competitors | Quote builder, pricing rules engine |
| **5. Scheduling Complexity** | Balancing jobs across work centers | Bottlenecks, missed dates | Visual scheduling, load balancing |
| **6. Scrap & Yield Loss** | 2-5% of material becomes scrap | Direct margin hit | Pattern optimization, remnant tracking |
| **7. Pricing Accuracy** | Getting margin right on every order | Margin erosion or lost bids | Cost build-up, margin analysis |
| **8. Certification & Traceability** | MTR, certs, chain of custody | Compliance failures, recalls | Document automation, heat tracking |
| **9. Multi-Location Coordination** | Inventory visibility, transfers | Suboptimal stock, excess freight | Network inventory view, transfer tools |
| **10. Customer Visibility** | Customers want self-service status | High call volume, frustration | Customer portal, notifications |

### 4.6.2 Success Factors

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    SUCCESS FACTORS: MANDATORY vs. OPTIONAL                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  MANDATORY (Table Stakes)              OPTIONAL (Competitive Advantage)             │
│  ════════════════════════════════      ════════════════════════════════════════     │
│                                                                                      │
│  ✓ Next-day delivery capability        ○ Same-day delivery for stock items         │
│  ✓ Basic processing (saw, shear)       ○ Advanced processing (laser, waterjet)     │
│  ✓ MTR/certification management        ○ Full heat-level traceability              │
│  ✓ Credit/AR management                ○ Automated credit decisioning              │
│  ✓ Basic inventory visibility          ○ Real-time ATP across network              │
│  ✓ Order entry system                  ○ Customer self-service portal              │
│  ✓ Quote generation                    ○ Instant online quotes                     │
│  ✓ Shipping/BOL generation             ○ Integrated carrier management             │
│  ✓ Basic scheduling                    ○ Visual capacity planning                  │
│                                                                                      │
│  EMERGING MANDATORY                    FUTURE DIFFERENTIATORS                       │
│  ═══════════════════════════           ═══════════════════════════════════════      │
│                                                                                      │
│  ◐ E-commerce ordering                 ○ AI-driven pricing optimization            │
│  ◐ Customer portal (status)            ○ Predictive demand planning                │
│  ◐ Mobile-friendly interfaces          ○ IoT equipment monitoring                  │
│  ◐ Barcode/RFID tracking               ○ Automated nesting/pattern optimization    │
│  ◐ EDI/API integration                 ○ Carbon footprint tracking                 │
│                                                                                      │
│  Legend: ✓ Essential  ◐ Becoming Essential  ○ Differentiator                        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.6.3 Trade-offs Every Service Center Makes

| Trade-off | Option A | Option B | Typical Resolution |
|-----------|----------|----------|-------------------|
| **Inventory Breadth vs. Turns** | Wide selection (more SKUs) | High turns (less capital) | Segment by velocity, prune slow movers |
| **Price vs. Speed** | Lowest price (thin margin) | Premium for speed | Tiered pricing (standard, rush, HOT) |
| **Capacity Buffer vs. Utilization** | Reserve capacity for rush | Maximize equipment ROI | Target 75-85% utilization |
| **Service Level vs. Cost** | 99% on-time (expensive) | 90% on-time (cheaper) | 95% target with HOT exceptions |
| **Centralized vs. Local Stock** | Network optimization | Local availability | Hub-and-spoke with fast transfer |
| **Standard vs. Custom** | Standardize for efficiency | Customize for margin | Templates with override capability |
| **Automation vs. Flexibility** | Automate routine tasks | Manual for exceptions | Rules engine with human override |

---

## 4.7 Operating Model Summary

### 4.7.1 The Alro-Style Operating Model

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    ALRO-STYLE OPERATING MODEL                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  MARKET POSITION: Premier multi-material service center with processing             │
│  VALUE PROPOSITION: "Quality Materials. Precision Processing. On Time."            │
│  GEOGRAPHIC SCOPE: 80+ locations with next-day delivery coverage                   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                         REVENUE STREAMS                                      │    │
│  │                                                                              │    │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐   │    │
│  │  │   MATERIAL    │  │  PROCESSING   │  │   FREIGHT     │  │  SUPPLIES   │   │    │
│  │  │    SALES      │  │   SERVICES    │  │   RECOVERY    │  │   SALES     │   │    │
│  │  │    (65%)      │  │    (25%)      │  │    (5%)       │  │    (5%)     │   │    │
│  │  └───────────────┘  └───────────────┘  └───────────────┘  └─────────────┘   │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                         DIVISION STRUCTURE                                   │    │
│  │                                                                              │    │
│  │  METALS              PLASTICS           SUPPLIES          RETAIL            │    │
│  │  ───────             ────────           ────────          ──────            │    │
│  │  • Carbon steel      • Engineering      • Cutting tools   • Walk-in sales   │    │
│  │  • Stainless         • Acrylic          • Abrasives       • Remnants        │    │
│  │  • Aluminum          • Polycarbonate    • Fasteners       • Small cuts      │    │
│  │  • Specialty         • High-perf        • Safety          • Cash/CC         │    │
│  │                                                                              │    │
│  │  Processing:         Processing:        Fulfillment:      Service:          │    │
│  │  Full capability     CNC focus          Pick/pack/ship    Counter sales     │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                         OPERATIONAL PILLARS                                  │    │
│  │                                                                              │    │
│  │  1. INVENTORY        2. PROCESSING       3. LOGISTICS      4. SERVICE       │    │
│  │  ─────────────       ─────────────       ──────────────    ──────────       │    │
│  │  • $150M+ stock      • 8+ process types  • Own fleet       • Inside sales   │    │
│  │  • 4-5x turns        • Same/next-day     • Common carrier  • Outside reps   │    │
│  │  • 80+ locations     • Tight tolerances  • Next-AM promise • Tech support   │    │
│  │  • Full certs        • Quality first     • Will-call       • Online portal  │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                         KEY PERFORMANCE TARGETS                              │    │
│  │                                                                              │    │
│  │  │ Metric                   │ Target    │ Frequency  │                      │    │
│  │  ├──────────────────────────┼───────────┼────────────┤                      │    │
│  │  │ On-Time Delivery         │ 95%+      │ Daily      │                      │    │
│  │  │ Quote Response           │ < 2 hours │ Per quote  │                      │    │
│  │  │ Inventory Turns          │ 4-5x      │ Annual     │                      │    │
│  │  │ Gross Margin             │ 20-25%    │ Monthly    │                      │    │
│  │  │ Processing Yield         │ 97%+      │ Per job    │                      │    │
│  │  │ Customer Satisfaction    │ 90%+      │ Quarterly  │                      │    │
│  │  │ Safety (Recordables)     │ < 1.0     │ Annual     │                      │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 5. JOB LIFECYCLE & STATE MACHINE

## 5.1 Job Status Flow

### 5.1.1 Complete State Machine

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         JOB LIFECYCLE STATE MACHINE                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│                              ┌─────────────┐                                        │
│                              │   ORDERED   │  ← Order created                       │
│                              │   (Gray)    │                                        │
│                              └──────┬──────┘                                        │
│                                     │                                               │
│                     ┌───────────────┼───────────────┐                               │
│                     │               │               │                               │
│                     ▼               ▼               │                               │
│              ┌─────────────┐ ┌─────────────┐       │                               │
│              │  RECEIVED   │ │  SCHEDULED  │◄──────┘  (Stock orders skip RECEIVED) │
│              │   (Blue)    │ │  (Orange)   │                                        │
│              └──────┬──────┘ └──────┬──────┘                                        │
│                     │               │                                               │
│                     └───────┬───────┘                                               │
│                             │                                                       │
│                             ▼                                                       │
│                      ┌─────────────┐                                               │
│              ┌──────▶│ IN_PROCESS  │◄──────┐  ← Operator starts job               │
│              │       │   (Green)   │       │                                       │
│              │       └──────┬──────┘       │                                       │
│              │              │              │                                       │
│              │   (Resume)   │   (QC Fail)  │                                       │
│              │              ▼              │                                       │
│              │       ┌─────────────┐       │                                       │
│              └───────┤ WAITING_QC  ├───────┘  ← Optional QC inspection            │
│                      │  (Purple)   │                                               │
│                      └──────┬──────┘                                               │
│                             │ (QC Pass)                                            │
│                             ▼                                                       │
│                      ┌─────────────┐                                               │
│                      │  PACKAGING  │  ← Bundle, label, stage                      │
│                      │   (Cyan)    │                                               │
│                      └──────┬──────┘                                               │
│                             │                                                       │
│                             ▼                                                       │
│                      ┌─────────────┐                                               │
│                      │READY_TO_SHIP│  ← Staged at shipping dock                   │
│                      │   (Indigo)  │                                               │
│                      └──────┬──────┘                                               │
│                             │                                                       │
│                             ▼                                                       │
│                      ┌─────────────┐                                               │
│                      │   SHIPPED   │  ← On truck, BOL generated                   │
│                      │   (Teal)    │                                               │
│                      └──────┬──────┘                                               │
│                             │                                                       │
│                             ▼                                                       │
│                      ┌─────────────┐                                               │
│                      │  COMPLETED  │  ← Delivered, job closed                     │
│                      │   (Green)   │                                               │
│                      └──────┬──────┘                                               │
│                             │                                                       │
│                             ▼                                                       │
│                      ┌─────────────┐                                               │
│                      │   BILLED    │  ← Invoice generated                         │
│                      │   (Gray)    │                                               │
│                      └─────────────┘                                               │
│                                                                                      │
│  EXCEPTION STATES:                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                                 │
│  │    HOLD     │  │  CANCELLED  │  │   PARTIAL   │                                 │
│  │   (Red)     │  │   (Gray)    │  │   (Yellow)  │                                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                                 │
│  Can occur from    Can occur from    Partial ship,                                 │
│  any active state  any pre-ship      remainder continues                           │
│                    state                                                            │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.1.2 State Definitions

| Status | Description | Entry Trigger | Exit Trigger | Typical Duration |
|--------|-------------|---------------|--------------|------------------|
| **ORDERED** | Job created from order | Order submitted | Material received or scheduled | < 24 hours |
| **RECEIVED** | Material checked in (toll jobs) | Inbound material scanned | Job scheduled | < 4 hours |
| **SCHEDULED** | Assigned to work center + date | Planner assigns | Operator starts job | 4-48 hours |
| **IN_PROCESS** | Actively being worked | Operator taps START | Processing complete | 15 min - 8 hours |
| **WAITING_QC** | Pending quality inspection | Operator completes, QC required | Inspector approves | 15-60 min |
| **PACKAGING** | Being bundled/labeled | QC passed or processing done | Packaging complete | 15-60 min |
| **READY_TO_SHIP** | Staged at dock | Packaging complete | Loaded on truck | < 24 hours |
| **SHIPPED** | In transit | Truck departs | Delivery confirmed | 1-5 days |
| **COMPLETED** | Delivered to customer | POD received | Invoice generated | < 24 hours |
| **BILLED** | Invoice sent | Invoice created | Payment received | 30-60 days |

### 5.1.3 Valid State Transitions

```javascript
// Allowed transitions for each status
const STATE_TRANSITIONS = {
  ORDERED: ['RECEIVED', 'SCHEDULED', 'CANCELLED'],
  RECEIVED: ['SCHEDULED', 'HOLD', 'CANCELLED'],
  SCHEDULED: ['IN_PROCESS', 'HOLD', 'CANCELLED'],
  IN_PROCESS: ['WAITING_QC', 'PACKAGING', 'SCHEDULED', 'HOLD'], // Can pause back to SCHEDULED
  WAITING_QC: ['PACKAGING', 'IN_PROCESS', 'HOLD'], // QC fail returns to IN_PROCESS
  PACKAGING: ['READY_TO_SHIP', 'HOLD'],
  READY_TO_SHIP: ['SHIPPED', 'HOLD'],
  SHIPPED: ['COMPLETED', 'PARTIAL'],
  COMPLETED: ['BILLED'],
  BILLED: [], // Terminal state
  HOLD: ['SCHEDULED', 'CANCELLED'], // Can release or cancel
  CANCELLED: [], // Terminal state
  PARTIAL: ['SHIPPED', 'COMPLETED'], // Remainder can ship or close
}
```

### 5.1.4 SLA Health Indicator

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         SLA HEALTH CALCULATION                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  For each job, calculate:                                                           │
│                                                                                      │
│  Time Remaining = Due Date - Now                                                    │
│  Time Needed = Estimated Processing + Queue Position + Packaging + Shipping Buffer │
│  Slack = Time Remaining - Time Needed                                              │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                               │  │
│  │  🟢 GREEN (On Track)      Slack > 4 hours                                    │  │
│  │     "Comfortable buffer, no action needed"                                    │  │
│  │                                                                               │  │
│  │  🟡 YELLOW (At Risk)      0 < Slack ≤ 4 hours                                │  │
│  │     "Achievable but no room for delays"                                       │  │
│  │                                                                               │  │
│  │  🔴 RED (Late Risk)       Slack ≤ 0                                          │  │
│  │     "Will miss unless expedited"                                              │  │
│  │                                                                               │  │
│  │  ⚫ BLACK (Missed)         Due Date < Now                                     │  │
│  │     "Already past due"                                                        │  │
│  │                                                                               │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  EXAMPLE:                                                                           │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Job JOB-1234                                                                       │
│  • Due Date: Tomorrow 10:00 AM (18 hours from now)                                 │
│  • Status: SCHEDULED                                                                │
│  • Queue Position: 3rd on Slitter #1                                               │
│  • Estimated Processing: 90 minutes                                                 │
│  • Jobs Ahead: 2.5 hours                                                            │
│  • Packaging Buffer: 30 minutes                                                     │
│  • Shipping Cut-off: Today 2:00 PM (must ship today for AM delivery)              │
│                                                                                      │
│  Time Remaining to Cut-off: 4 hours                                                │
│  Time Needed: 2.5 + 1.5 + 0.5 = 4.5 hours                                         │
│  Slack: 4.0 - 4.5 = -0.5 hours                                                     │
│                                                                                      │
│  Result: 🔴 RED - Need to move up in queue or work overtime                        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 6. SCHEDULING & CAPACITY DESIGN

## 6.1 Scheduling Board Overview

### 6.1.1 Visual Scheduling Interface

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  SCHEDULING BOARD - Detroit                              Today: Jan 17, 2026        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  View: [Schedule ▼]  Date: [◄ Jan 17] [Today] [Jan 18 ►]  Filter: [All Types ▼]    │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │     │ 6AM  7AM  8AM  9AM  10AM 11AM 12PM 1PM  2PM  3PM  4PM  5PM  6PM │ Load  │  │
│  ├─────┼────────────────────────────────────────────────────────────────┼───────┤  │
│  │     │      ████████████████                                          │       │  │
│  │SLIT │ 1234 ████ ABC ██████ 1235 ████████████ 1236 ██████            │ 78%   │  │
│  │ #1  │      ████████████████      Metro Mfg          Precision       │ 🟢    │  │
│  │     │      🔴 HOT                🟡 RUSH             🟢 NORMAL       │       │  │
│  ├─────┼────────────────────────────────────────────────────────────────┼───────┤  │
│  │     │           ██████████████████████                               │       │  │
│  │SLIT │           1240 ██████████████████ 1241 ████████████           │ 65%   │  │
│  │ #2  │           Industrial Corp         Steel Solutions             │ 🟢    │  │
│  │     │           🟢 NORMAL               🟢 NORMAL                   │       │  │
│  ├─────┼────────────────────────────────────────────────────────────────┼───────┤  │
│  │     │ ████████████████                   ████████████████████████   │       │  │
│  │CTL  │ 1242 ██████████ 1243 ██████       1244 ████████████████████   │ 92%   │  │
│  │ #1  │ Metro Mfg       ABC Steel         Construction Inc            │ 🟡    │  │
│  │     │ 🟡 RUSH         🟢 NORMAL         🔴 HOT                      │       │  │
│  ├─────┼────────────────────────────────────────────────────────────────┼───────┤  │
│  │     │      ██████████                                                │       │  │
│  │SAW  │      1250 █████ 1251 ████████                                 │ 45%   │  │
│  │ #1  │      Fab Shop   Job Shop                                      │ 🟢    │  │
│  │     │      🟢 NORMAL  🟢 NORMAL                                     │       │  │
│  ├─────┼────────────────────────────────────────────────────────────────┼───────┤  │
│  │     │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │       │  │
│  │SHEAR│ (No jobs scheduled)                                           │ 0%    │  │
│  │ #1  │                                                                │ ⚪    │  │
│  └─────┴────────────────────────────────────────────────────────────────┴───────┘  │
│                                                                                      │
│  UNSCHEDULED JOBS (12)                                           [+ New Job]        │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🔴 JOB-1260 ABC Steel      Slit 48"→6x8"    Due: TODAY 4PM    Est: 2.5 hrs   │  │
│  │ 🟡 JOB-1261 Metro Mfg      CTL 60"→24x48"   Due: TOMORROW     Est: 1.5 hrs   │  │
│  │ 🟢 JOB-1262 Precision      Saw 12"x20'      Due: Jan 19       Est: 45 min    │  │
│  │ 🟢 JOB-1263 Industrial     Shear 4x8        Due: Jan 19       Est: 30 min    │  │
│  │                                                                [Show All...]  │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  Drag jobs to schedule │ Click job for details │ Right-click for options           │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.1.2 Drag-and-Drop Scheduling

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         DRAG-AND-DROP SCHEDULING                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  USER ACTION                           SYSTEM RESPONSE                              │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  1. Drag job from Unscheduled          • Highlight compatible work centers         │
│     ┌─────────────┐                    • Show capacity indicators                  │
│     │ 🔴 JOB-1260 │ ←─ Dragging        • Gray out incompatible machines           │
│     │ Slit 48"    │                                                                │
│     └─────────────┘                                                                │
│                                                                                      │
│  2. Hover over time slot               • Show insertion preview                    │
│     ┌─────────────────────────────┐    • Calculate new SLA status                  │
│     │ SLIT #1  │ ▓▓▓ ░░░░ ▓▓▓    │    • Show jobs that would shift               │
│     │          │     ↑            │                                                │
│     │          │  Insert here?    │                                                │
│     └─────────────────────────────┘                                                │
│                                                                                      │
│  3. Drop job                           • Assign work center + time                 │
│     ┌─────────────────────────────┐    • Update SLA indicators                     │
│     │ SLIT #1  │ ▓▓▓ ███ ▓▓▓     │    • Shift subsequent jobs                     │
│     │          │     ↑            │    • Log scheduling event                      │
│     │          │  JOB-1260 placed │    • Notify operator (optional)               │
│     └─────────────────────────────┘                                                │
│                                                                                      │
│  4. Reorder within work center         • Recalculate all SLAs                      │
│     Drag existing job to new slot      • Warn if SLA impact                        │
│                                         • Confirm if jobs go RED                   │
│                                                                                      │
│  5. Move between work centers          • Validate compatibility                    │
│     Drag job to different machine      • Adjust time estimate                      │
│                                         • Update capacity for both                  │
│                                                                                      │
│  VALIDATION RULES:                                                                  │
│  • Cannot schedule on incompatible work center (e.g., slit job on saw)            │
│  • Cannot schedule past work center capacity                                       │
│  • Warn if move causes other jobs to go RED                                        │
│  • Require confirmation to schedule past shift end                                 │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.1.3 Capacity Planning View

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  CAPACITY PLANNING - Week of Jan 17, 2026                                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Work Center  │ Mon 17  │ Tue 18  │ Wed 19  │ Thu 20  │ Fri 21  │ Weekly │          │
│  ─────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┤          │
│               │         │         │         │         │         │        │          │
│  Slitter #1   │ ████░░  │ █████░  │ ███░░░  │ ██░░░░  │ ░░░░░░  │  58%   │          │
│  (8 hrs/day)  │  78%    │  85%    │  62%    │  45%    │  0%     │        │          │
│               │ 🟢      │ 🟡      │ 🟢      │ 🟢      │ ⚪      │        │          │
│               │         │         │         │         │         │        │          │
│  Slitter #2   │ ████░░  │ ███░░░  │ █████░  │ ████░░  │ ██░░░░  │  68%   │          │
│  (8 hrs/day)  │  65%    │  55%    │  88%    │  72%    │  35%    │        │          │
│               │ 🟢      │ 🟢      │ 🟡      │ 🟢      │ 🟢      │        │          │
│               │         │         │         │         │         │        │          │
│  CTL Line #1  │ ██████  │ █████░  │ ██████  │ ████░░  │ ███░░░  │  82%   │          │
│  (8 hrs/day)  │  92%    │  78%    │  95%    │  68%    │  55%    │        │          │
│               │ 🔴      │ 🟢      │ 🔴      │ 🟢      │ 🟢      │        │          │
│               │         │         │         │         │         │        │          │
│  Saw #1       │ ███░░░  │ ██░░░░  │ ████░░  │ ██░░░░  │ █░░░░░  │  42%   │          │
│  (8 hrs/day)  │  45%    │  38%    │  65%    │  32%    │  15%    │        │          │
│               │ 🟢      │ 🟢      │ 🟢      │ 🟢      │ 🟢      │        │          │
│               │         │         │         │         │         │        │          │
│  Shear #1     │ ░░░░░░  │ █░░░░░  │ ██░░░░  │ █░░░░░  │ ░░░░░░  │  12%   │          │
│  (8 hrs/day)  │  0%     │  18%    │  28%    │  12%    │  0%     │        │          │
│               │ ⚪      │ 🟢      │ 🟢      │ 🟢      │ ⚪      │        │          │
│                                                                                      │
│  SUMMARY:                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │ Total Capacity: 200 hrs/week │ Scheduled: 126 hrs │ Available: 74 hrs      │    │
│  │ Bottleneck: CTL Line #1 (Mon, Wed at capacity)                              │    │
│  │ Recommendation: Consider shifting CTL work to Tue/Thu                       │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  Legend: ████ Scheduled  ░░░░ Available  🟢 OK  🟡 Tight  🔴 Over  ⚪ Empty        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.1.4 Auto-Scheduling Rules

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         AUTO-SCHEDULING LOGIC                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  When a new job is created, the system suggests optimal scheduling:                 │
│                                                                                      │
│  STEP 1: Identify Compatible Work Centers                                          │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  • Match processing type to work center capabilities                               │
│  • Filter by material compatibility (gauge range, width capacity)                  │
│  • Exclude work centers under maintenance                                          │
│                                                                                      │
│  STEP 2: Calculate Time Estimate                                                   │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  • Base time from processing type + parameters                                     │
│  • Adjust for material weight/quantity                                             │
│  • Add setup time for changeovers                                                  │
│  • Factor in historical performance for this job type                              │
│                                                                                      │
│  STEP 3: Find Available Slots                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  For each compatible work center:                                                  │
│  • Find first available slot before due date                                       │
│  • Calculate resulting SLA status                                                  │
│  • Score by: SLA health, utilization balance, setup reduction                     │
│                                                                                      │
│  STEP 4: Suggest Best Option                                                       │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Present top 3 options with trade-offs:                                            │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │ SCHEDULING OPTIONS for JOB-1260                                               │  │
│  ├───────────────────────────────────────────────────────────────────────────────┤  │
│  │ ● Option 1 (Recommended)                                                      │  │
│  │   Slitter #1 | Today 1:30 PM | SLA: 🟢 Green (+2.5 hrs buffer)               │  │
│  │   Note: Fits between existing jobs, no impact to others                      │  │
│  │                                                                               │  │
│  │ ○ Option 2                                                                    │  │
│  │   Slitter #2 | Today 2:00 PM | SLA: 🟡 Yellow (+30 min buffer)               │  │
│  │   Note: Less utilized machine, but tighter on SLA                            │  │
│  │                                                                               │  │
│  │ ○ Option 3                                                                    │  │
│  │   Slitter #1 | Tomorrow 6:00 AM | SLA: 🟢 Green (+18 hrs buffer)             │  │
│  │   Note: Maximum buffer but delays until tomorrow                             │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  PRIORITY RULES:                                                                    │
│  • HOT jobs: Insert at next available slot (bump NORMAL if needed)                 │
│  • RUSH jobs: Schedule within 4 hours if possible                                  │
│  • NORMAL jobs: Optimize for utilization balance                                   │
│  • Same-customer jobs: Group to reduce material handling                           │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 7. SHOP FLOOR UX

## 7.1 Design Principles for Shop Floor

### 7.1.1 Operator-First Design

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         SHOP FLOOR UX PRINCIPLES                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  1. BIG TOUCH TARGETS                     2. MINIMAL TEXT INPUT                     │
│  ────────────────────────────             ────────────────────────────              │
│  • Buttons minimum 60x60 pixels           • Scan barcodes/QR codes                  │
│  • Generous spacing between elements      • Tap to select from lists               │
│  • Works with gloves                      • Voice input for notes (future)          │
│  • Clear visual feedback on tap           • Numeric pad for quantities              │
│                                                                                      │
│  3. GLANCEABLE STATUS                     4. OFFLINE-CAPABLE                        │
│  ────────────────────────────             ────────────────────────────              │
│  • Color-coded job priority               • Queue jobs locally                      │
│  • Large progress indicators              • Sync when connected                     │
│  • Clear "what's next" hierarchy          • Never lose operator input               │
│  • Time elapsed always visible            • Graceful reconnection                   │
│                                                                                      │
│  5. FORGIVING WORKFLOW                    6. MINIMAL NAVIGATION                     │
│  ────────────────────────────             ────────────────────────────              │
│  • Undo/correct mistakes easily           • Maximum 2 taps to any action           │
│  • Confirm destructive actions            • Stay on one screen during job           │
│  • No dead ends                           • Persistent job context                  │
│  • Clear error messages                   • Back always available                   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.1.2 Operator Login Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│                         ┌─────────────────────────────────┐                         │
│                         │                                 │                         │
│                         │         🏭 ALROWARE             │                         │
│                         │                                 │                         │
│                         │       SHOP FLOOR LOGIN          │                         │
│                         │                                 │                         │
│                         └─────────────────────────────────┘                         │
│                                                                                      │
│                         ┌─────────────────────────────────┐                         │
│                         │                                 │                         │
│                         │    SELECT YOUR WORK CENTER      │                         │
│                         │                                 │                         │
│                         │  ┌───────────┐  ┌───────────┐   │                         │
│                         │  │           │  │           │   │                         │
│                         │  │ SLITTER   │  │ SLITTER   │   │                         │
│                         │  │    #1     │  │    #2     │   │                         │
│                         │  │  5 jobs   │  │  3 jobs   │   │                         │
│                         │  └───────────┘  └───────────┘   │                         │
│                         │                                 │                         │
│                         │  ┌───────────┐  ┌───────────┐   │                         │
│                         │  │           │  │           │   │                         │
│                         │  │  CTL #1   │  │  SAW #1   │   │                         │
│                         │  │           │  │           │   │                         │
│                         │  │  4 jobs   │  │  2 jobs   │   │                         │
│                         │  └───────────┘  └───────────┘   │                         │
│                         │                                 │                         │
│                         └─────────────────────────────────┘                         │
│                                                                                      │
│                         ┌─────────────────────────────────┐                         │
│                         │                                 │                         │
│                         │    SCAN BADGE OR ENTER ID       │                         │
│                         │                                 │                         │
│                         │    ┌─────────────────────────┐  │                         │
│                         │    │  👤  ________________   │  │                         │
│                         │    └─────────────────────────┘  │                         │
│                         │                                 │                         │
│                         │    [  📷 SCAN BADGE  ]          │                         │
│                         │                                 │                         │
│                         └─────────────────────────────────┘                         │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.1.3 Main Operator Screen

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  SLITTER #1                                              👤 John D. │ 🕐 2:35 PM   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                              │    │
│  │  ACTIVE JOB                                                     ⏱️ 01:23:45 │    │
│  │  ════════════════════════════════════════════════════════════════════════   │    │
│  │                                                                              │    │
│  │  🔴 HOT    JOB-1234                                                         │    │
│  │                                                                              │    │
│  │  Customer: ABC STEEL CORPORATION                                            │    │
│  │  Material: HR COIL 0.125" x 48" - A1011                                     │    │
│  │  Process:  SLIT → 8 x 6.0" (Edge trim 0.250")                              │    │
│  │  Source:   Coil NUC-45221-A (Bay A-12)                                     │    │
│  │                                                                              │    │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │    │
│  │  │  PROGRESS                                                           │    │    │
│  │  │                                                                     │    │    │
│  │  │  ████████████████████████████████░░░░░░░░░░░░  18 / 24 mults       │    │    │
│  │  │                                                   75%               │    │    │
│  │  │                                                                     │    │    │
│  │  │  Output: 37,440 lbs    Scrap: 580 lbs    Yield: 98.5%              │    │    │
│  │  └─────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                              │    │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │    │
│  │  │                │  │                │  │                │                 │    │
│  │  │                │  │                │  │                │                 │    │
│  │  │   ⏸️ PAUSE     │  │  📊 RECORD    │  │  ⚠️ ISSUE     │                 │    │
│  │  │                │  │    OUTPUT     │  │                │                 │    │
│  │  │                │  │                │  │                │                 │    │
│  │  └────────────────┘  └────────────────┘  └────────────────┘                 │    │
│  │                                                                              │    │
│  │  ┌──────────────────────────────────────────────────────────────────────┐   │    │
│  │  │                                                                      │   │    │
│  │  │                    ✅ COMPLETE JOB                                   │   │    │
│  │  │                                                                      │   │    │
│  │  └──────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  QUEUE (4 more)                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │ 🟡 RUSH  JOB-1235  Metro Mfg        CR 0.060"→4x4"       Est: 1.5 hrs     │    │
│  │ 🟢 NORM  JOB-1236  Precision        Galv 0.048"→3"       Est: 45 min      │    │
│  │ 🟢 NORM  JOB-1237  Industrial       HR 0.090"→12x2"      Est: 2.0 hrs     │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.1.4 Record Output Dialog

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│                         RECORD OUTPUT                                    [X]        │
│                         ─────────────────────────────────────────────────           │
│                                                                                      │
│                         JOB-1234 | ABC Steel                                        │
│                                                                                      │
│                         ┌─────────────────────────────────────────────┐             │
│                         │                                             │             │
│                         │            GOOD PIECES                      │             │
│                         │                                             │             │
│                         │    ┌─────┐  ┌───────────┐  ┌─────┐         │             │
│                         │    │  -  │  │     6     │  │  +  │         │             │
│                         │    │     │  │   mults   │  │     │         │             │
│                         │    └─────┘  └───────────┘  └─────┘         │             │
│                         │                                             │             │
│                         │    Quick: [1] [2] [4] [8] [All Remaining]  │             │
│                         │                                             │             │
│                         └─────────────────────────────────────────────┘             │
│                                                                                      │
│                         ┌─────────────────────────────────────────────┐             │
│                         │                                             │             │
│                         │            SCRAP (lbs)                      │             │
│                         │                                             │             │
│                         │    ┌─────┐  ┌───────────┐  ┌─────┐         │             │
│                         │    │  -  │  │    85     │  │  +  │         │             │
│                         │    │     │  │    lbs    │  │     │         │             │
│                         │    └─────┘  └───────────┘  └─────┘         │             │
│                         │                                             │             │
│                         │    Reason: [Edge Trim          ▼]          │             │
│                         │                                             │             │
│                         └─────────────────────────────────────────────┘             │
│                                                                                      │
│                         Running Total:                                              │
│                         • Good: 18 + 6 = 24 mults                                   │
│                         • Scrap: 580 + 85 = 665 lbs                                │
│                         • Yield: 98.4%                                              │
│                                                                                      │
│                         ┌───────────────────────────────────────────────────────┐   │
│                         │                                                       │   │
│                         │               ✅ SAVE OUTPUT                          │   │
│                         │                                                       │   │
│                         └───────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.1.5 Report Issue Dialog

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│                         ⚠️ REPORT ISSUE                                  [X]        │
│                         ─────────────────────────────────────────────────           │
│                                                                                      │
│                         JOB-1234 | ABC Steel                                        │
│                                                                                      │
│                         ISSUE TYPE                                                  │
│                         ┌────────────────┐  ┌────────────────┐                      │
│                         │                │  │                │                      │
│                         │   🔧 MACHINE   │  │  📦 MATERIAL  │                      │
│                         │     ISSUE      │  │    DEFECT     │                      │
│                         │                │  │                │                      │
│                         └────────────────┘  └────────────────┘                      │
│                                                                                      │
│                         ┌────────────────┐  ┌────────────────┐                      │
│                         │                │  │                │                      │
│                         │   📐 QUALITY   │  │  👷 SAFETY    │                      │
│                         │    CONCERN     │  │    ISSUE      │                      │
│                         │                │  │                │                      │
│                         └────────────────┘  └────────────────┘                      │
│                                                                                      │
│                         SEVERITY                                                    │
│                         ○ Minor - Can continue working                             │
│                         ● Blocking - Need help to continue                         │
│                         ○ Critical - Stop work immediately                         │
│                                                                                      │
│                         NOTES (optional)                                            │
│                         ┌─────────────────────────────────────────────────────┐     │
│                         │ Blade showing wear, edge quality declining         │     │
│                         │                                                     │     │
│                         └─────────────────────────────────────────────────────┘     │
│                                                                                      │
│                         ☐ Pause job until resolved                                  │
│                         ☑️ Notify supervisor                                        │
│                                                                                      │
│                         ┌───────────────────────────────────────────────────────┐   │
│                         │                                                       │   │
│                         │               ⚠️ SUBMIT ISSUE                         │   │
│                         │                                                       │   │
│                         └───────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.1.6 Job Completion Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│                         ✅ COMPLETE JOB                                  [X]        │
│                         ─────────────────────────────────────────────────           │
│                                                                                      │
│                         JOB-1234 | ABC Steel                                        │
│                                                                                      │
│                         FINAL SUMMARY                                               │
│                         ┌─────────────────────────────────────────────────────┐     │
│                         │                                                     │     │
│                         │  Target:    24 mults                               │     │
│                         │  Completed: 24 mults  ✅                           │     │
│                         │                                                     │     │
│                         │  Input Weight:    42,380 lbs                       │     │
│                         │  Output Weight:   41,600 lbs                       │     │
│                         │  Scrap:              780 lbs                       │     │
│                         │  Yield:            98.2%  ✅                       │     │
│                         │                                                     │     │
│                         │  Run Time:      1:45:22                            │     │
│                         │  Rate:          22.8 mults/hr                      │     │
│                         │                                                     │     │
│                         └─────────────────────────────────────────────────────┘     │
│                                                                                      │
│                         NEXT STEP                                                   │
│                         ┌────────────────┐  ┌────────────────┐                      │
│                         │                │  │                │                      │
│                         │  → SEND TO QC  │  │ → PACKAGING   │                      │
│                         │   (Inspection) │  │   (Skip QC)   │                      │
│                         │                │  │                │                      │
│                         └────────────────┘  └────────────────┘                      │
│                                                                                      │
│                         OUTPUT LOCATION                                             │
│                         [ Staging Area F-1          ▼ ]                             │
│                                                                                      │
│                         ┌───────────────────────────────────────────────────────┐   │
│                         │                                                       │   │
│                         │            ✅ COMPLETE & START NEXT                   │   │
│                         │                                                       │   │
│                         └───────────────────────────────────────────────────────┘   │
│                                                                                      │
│                         Next up: 🟡 JOB-1235 Metro Mfg (Auto-start in 5 sec...)    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 8. E-COMMERCE INTEGRATION MODEL

## 8.1 Multi-Channel Order Flow

### 8.1.1 Channel Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         ORDER CHANNEL ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │             │  │             │  │             │  │             │  │           │  │
│  │   WEBSITE   │  │    PHONE    │  │   COUNTER   │  │     EDI     │  │    API    │  │
│  │  e-commerce │  │   CSR Entry │  │    POS      │  │  (OEM/MRO)  │  │ (Partner) │  │
│  │             │  │             │  │             │  │             │  │           │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘  │
│         │                │                │                │              │         │
│         └────────────────┴────────────────┴────────────────┴──────────────┘         │
│                                          │                                          │
│                                          ▼                                          │
│                          ┌───────────────────────────────┐                          │
│                          │                               │                          │
│                          │      UNIFIED ORDER ENGINE     │                          │
│                          │                               │                          │
│                          │  • Validation & Pricing       │                          │
│                          │  • Inventory Allocation       │                          │
│                          │  • Credit Check               │                          │
│                          │  • Job Creation               │                          │
│                          │  • Routing to Location        │                          │
│                          │                               │                          │
│                          └───────────────┬───────────────┘                          │
│                                          │                                          │
│                    ┌─────────────────────┼─────────────────────┐                    │
│                    │                     │                     │                    │
│                    ▼                     ▼                     ▼                    │
│           ┌──────────────┐      ┌──────────────┐      ┌──────────────┐              │
│           │  Detroit     │      │  Cleveland   │      │  Chicago     │              │
│           │  Service     │      │  Service     │      │  Service     │              │
│           │  Center      │      │  Center      │      │  Center      │              │
│           └──────────────┘      └──────────────┘      └──────────────┘              │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 8.1.2 E-Commerce User Experience

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         ALRO ONLINE - CUSTOMER PORTAL                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─ NAVIGATION ──────────────────────────────────────────────────────────────────┐  │
│  │  [Shop Metals ▼] [Shop Plastics ▼] [Industrial ▼] [My Orders] [My Account]    │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌─ PRODUCT SEARCH ──────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  Search: [ hot rolled steel sheet 0.125 x 48                    ] [🔍]       │  │
│  │                                                                                │  │
│  │  Filters:                                                                      │  │
│  │  Material: [Steel ▼]  Form: [Sheet/Plate ▼]  Gauge: [0.125" ▼]  Width: [48" ▼]│  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌─ SEARCH RESULTS ──────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │  HR STEEL SHEET - A1011 CS TYPE B                                        │ │  │
│  │  │  0.125" x 48" x 120"                                                     │ │  │
│  │  │                                                                          │ │  │
│  │  │  In Stock: ✅ Detroit (12 pcs) | Cleveland (8 pcs) | Chicago (5 pcs)    │ │  │
│  │  │                                                                          │ │  │
│  │  │  Price: $0.58/lb  |  Sheet Weight: 245 lbs  |  $142.10/pc               │ │  │
│  │  │                                                                          │ │  │
│  │  │  Qty: [  1  ]  [ ADD TO CART ]  [ REQUEST QUOTE ]                       │ │  │
│  │  │                                                                          │ │  │
│  │  │  🔧 Processing Options:                                                  │ │  │
│  │  │  ☐ Cut to size  ☐ Shear  ☐ Deburr  ☐ Prime/Paint                       │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │  HR STEEL SHEET - A1011 CS TYPE B                                        │ │  │
│  │  │  0.125" x 48" x 96"                                                      │ │  │
│  │  │                                                                          │ │  │
│  │  │  In Stock: ✅ Detroit (28 pcs) | Cleveland (15 pcs)                     │ │  │
│  │  │                                                                          │ │  │
│  │  │  Price: $0.58/lb  |  Sheet Weight: 196 lbs  |  $113.68/pc               │ │  │
│  │  │  ...                                                                     │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 8.1.3 Processing Configuration (Web)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         CONFIGURE PROCESSING - Web Order                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Product: HR STEEL COIL - A1011 CS TYPE B                                          │
│  Size: 0.125" x 48" (Master Coil)                                                  │
│  Source Location: Detroit                                                           │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 1: Select Processing Type                                             │    │
│  ├─────────────────────────────────────────────────────────────────────────────┤    │
│  │                                                                              │    │
│  │  ○ No Processing (ship as-is)                                               │    │
│  │  ● Slitting (cut to narrower widths)                                        │    │
│  │  ○ Cut-to-Length (cut to sheets/blanks)                                     │    │
│  │  ○ Shearing (straight cuts)                                                  │    │
│  │  ○ Combination (slit + CTL)                                                  │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 2: Specify Dimensions                                                 │    │
│  ├─────────────────────────────────────────────────────────────────────────────┤    │
│  │                                                                              │    │
│  │  Master Width: 48"    Available for slitting: 47.5" (0.25" edge trim each)  │    │
│  │                                                                              │    │
│  │  Output Widths (must sum to ≤ 47.5"):                                       │    │
│  │                                                                              │    │
│  │  Width 1: [ 12.0  ] inches  x  Qty: [ 4 ]  = 48.0" ⚠️ Over by 0.5"         │    │
│  │                                                                              │    │
│  │  Suggested correction:                                                       │    │
│  │  Width 1: [ 11.875 ] inches  x  Qty: [ 4 ]  = 47.5" ✅                      │    │
│  │                                                                              │    │
│  │  [ + Add Another Width ]                                                     │    │
│  │                                                                              │    │
│  │  Output Form:                                                                │    │
│  │  ● Oscillate wound coils (standard)                                         │    │
│  │  ○ Ribbon wound coils                                                        │    │
│  │  ○ Cut sheets (specify length: ______)                                       │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 3: Quantity & Pricing                                                 │    │
│  ├─────────────────────────────────────────────────────────────────────────────┤    │
│  │                                                                              │    │
│  │  Input Weight Required:    12,500 lbs                                       │    │
│  │  Output Weight (est.):     12,280 lbs (98.2% yield)                         │    │
│  │  Scrap (edge trim):           220 lbs                                       │    │
│  │                                                                              │    │
│  │  ─────────────────────────────────────────────────────────────────────────  │    │
│  │  Material Cost:         12,500 lbs x $0.52/lb    =    $6,500.00            │    │
│  │  Slitting Charge:       12,500 lbs x $0.035/lb   =      $437.50            │    │
│  │  Scrap Credit:          220 lbs x $0.12/lb       =      -$26.40            │    │
│  │  ─────────────────────────────────────────────────────────────────────────  │    │
│  │  TOTAL:                                               $6,911.10            │    │
│  │                                                                              │    │
│  │  Lead Time: 2 business days                                                  │    │
│  │  Delivery: [ Standard Ground  ▼ ]  Est: Jan 21-22, 2026                     │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  [ ← Back ]                    [ Add to Cart - $6,911.10 ]                         │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 8.1.4 Customer Order Tracking

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         MY ORDERS - Customer Portal                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Filter: [All Orders ▼]  Status: [All ▼]  Date: [Last 30 days ▼]  [🔍 Search]      │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                              │    │
│  │  ORDER #WEB-78432                                         Placed: Jan 15    │    │
│  │  ═══════════════════════════════════════════════════════════════════════    │    │
│  │                                                                              │    │
│  │  Status: 🟢 IN PROCESSING                                                   │    │
│  │                                                                              │    │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │    │
│  │  │ ✅ Ordered  →  ✅ Confirmed  →  🔄 Processing  →  ○ Shipping  →  ○ Delivered │    │
│  │  │ Jan 15         Jan 15           Jan 17           Jan 18         Jan 19   │    │
│  │  └─────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                              │    │
│  │  Items:                                                                      │    │
│  │  • HR Coil 0.125" x 48" → Slit to 4 x 12" (12,500 lbs)                     │    │
│  │    Job JOB-1234: Currently on Slitter #1, 75% complete                      │    │
│  │                                                                              │    │
│  │  Est. Ship: Tomorrow AM    |    Total: $6,911.10                            │    │
│  │                                                                              │    │
│  │  [ View Details ]  [ Track Shipment ]  [ Reorder ]                          │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                              │    │
│  │  ORDER #WEB-78401                                         Placed: Jan 12    │    │
│  │  ═══════════════════════════════════════════════════════════════════════    │    │
│  │                                                                              │    │
│  │  Status: ✅ DELIVERED                                                       │    │
│  │                                                                              │    │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │    │
│  │  │ ✅ Ordered  →  ✅ Confirmed  →  ✅ Processing  →  ✅ Shipped  →  ✅ Delivered │    │
│  │  │ Jan 12         Jan 12           Jan 13           Jan 14         Jan 15   │    │
│  │  └─────────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                              │    │
│  │  Items:                                                                      │    │
│  │  • Aluminum Sheet 6061-T6 0.090" x 48" x 96" (qty 12)                      │    │
│  │                                                                              │    │
│  │  Delivered: Jan 15, 10:42 AM    |    Total: $2,847.60                       │    │
│  │                                                                              │    │
│  │  [ View Details ]  [ View Invoice ]  [ Reorder ]  [ Request Cert ]          │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## 8.2 E-Commerce ↔ ERP Integration

### 8.2.1 Real-Time Sync Points

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         E-COMMERCE INTEGRATION FLOWS                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  E-COMMERCE PLATFORM                              ALROWARE ERP                      │
│  ───────────────────                              ────────────                      │
│                                                                                      │
│  ┌─────────────────────┐                          ┌─────────────────────┐           │
│  │ Product Catalog     │  ◄────── Sync ───────►  │ Item Master         │           │
│  │ • SKUs, descriptions│                          │ • Pricing rules     │           │
│  │ • Images, specs     │                          │ • Dimensions        │           │
│  └─────────────────────┘                          └─────────────────────┘           │
│                                                                                      │
│  ┌─────────────────────┐                          ┌─────────────────────┐           │
│  │ Inventory Display   │  ◄──── Real-time ─────  │ Inventory Engine    │           │
│  │ • Stock levels      │       (every 5 min)      │ • ATP by location   │           │
│  │ • Location avail.   │                          │ • Reservations      │           │
│  └─────────────────────┘                          └─────────────────────┘           │
│                                                                                      │
│  ┌─────────────────────┐                          ┌─────────────────────┐           │
│  │ Shopping Cart       │  ────── Push ─────────► │ Quote Engine        │           │
│  │ • Line items        │      (on checkout)       │ • Price calculation │           │
│  │ • Config options    │                          │ • Credit check      │           │
│  └─────────────────────┘                          └─────────────────────┘           │
│                                                                                      │
│  ┌─────────────────────┐                          ┌─────────────────────┐           │
│  │ Order Placed        │  ────── Push ─────────► │ Order Management    │           │
│  │ • Order details     │       (immediate)        │ • Job creation      │           │
│  │ • Payment auth      │                          │ • Inventory alloc   │           │
│  └─────────────────────┘                          └─────────────────────┘           │
│                                                                                      │
│  ┌─────────────────────┐                          ┌─────────────────────┐           │
│  │ Order Status Page   │  ◄──── Real-time ─────  │ Job Status          │           │
│  │ • Progress tracker  │       (webhooks)         │ • State changes     │           │
│  │ • Tracking numbers  │                          │ • Shipment events   │           │
│  └─────────────────────┘                          └─────────────────────┘           │
│                                                                                      │
│  ┌─────────────────────┐                          ┌─────────────────────┐           │
│  │ Invoice/Docs        │  ◄──── Pull ──────────  │ Billing Engine      │           │
│  │ • PDF invoices      │      (on demand)         │ • Invoice gen       │           │
│  │ • Mill certs        │                          │ • Document store    │           │
│  └─────────────────────┘                          └─────────────────────┘           │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 9. PERMISSIONS & MODULE TOGGLES

## 9.1 Role-Based Access Control

### 9.1.1 Permission Matrix

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         PERMISSION MATRIX                                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│                        │ ADMIN │ MANAGER │ CSR │ SCHEDULER │ OPERATOR │ VIEWER     │
│  ──────────────────────┼───────┼─────────┼─────┼───────────┼──────────┼────────     │
│                        │       │         │     │           │          │             │
│  ORDERS MODULE         │       │         │     │           │          │             │
│  ├ View Orders         │   ✅  │    ✅   │  ✅ │     ✅    │    ⚡    │    ✅       │
│  ├ Create Orders       │   ✅  │    ✅   │  ✅ │     ⚡    │    ❌    │    ❌       │
│  ├ Edit Orders         │   ✅  │    ✅   │  ✅ │     ⚡    │    ❌    │    ❌       │
│  ├ Cancel Orders       │   ✅  │    ✅   │  ⚡ │     ❌    │    ❌    │    ❌       │
│  └ Override Pricing    │   ✅  │    ⚡   │  ❌ │     ❌    │    ❌    │    ❌       │
│                        │       │         │     │           │          │             │
│  SCHEDULING MODULE     │       │         │     │           │          │             │
│  ├ View Schedule       │   ✅  │    ✅   │  ✅ │     ✅    │    ⚡    │    ✅       │
│  ├ Schedule Jobs       │   ✅  │    ✅   │  ⚡ │     ✅    │    ❌    │    ❌       │
│  ├ Reschedule Jobs     │   ✅  │    ✅   │  ⚡ │     ✅    │    ❌    │    ❌       │
│  └ Override Capacity   │   ✅  │    ✅   │  ❌ │     ⚡    │    ❌    │    ❌       │
│                        │       │         │     │           │          │             │
│  SHOP FLOOR MODULE     │       │         │     │           │          │             │
│  ├ View Jobs           │   ✅  │    ✅   │  ✅ │     ✅    │    ✅    │    ✅       │
│  ├ Start/Stop Jobs     │   ✅  │    ✅   │  ❌ │     ⚡    │    ✅    │    ❌       │
│  ├ Record Output       │   ✅  │    ✅   │  ❌ │     ⚡    │    ✅    │    ❌       │
│  ├ Report Issues       │   ✅  │    ✅   │  ✅ │     ✅    │    ✅    │    ❌       │
│  └ Close Jobs          │   ✅  │    ✅   │  ❌ │     ⚡    │    ✅    │    ❌       │
│                        │       │         │     │           │          │             │
│  INVENTORY MODULE      │       │         │     │           │          │             │
│  ├ View Inventory      │   ✅  │    ✅   │  ✅ │     ✅    │    ⚡    │    ✅       │
│  ├ Receive Material    │   ✅  │    ✅   │  ⚡ │     ⚡    │    ⚡    │    ❌       │
│  ├ Adjust Inventory    │   ✅  │    ✅   │  ❌ │     ❌    │    ❌    │    ❌       │
│  └ Cycle Count         │   ✅  │    ✅   │  ⚡ │     ⚡    │    ⚡    │    ❌       │
│                        │       │         │     │           │          │             │
│  SHIPPING MODULE       │       │         │     │           │          │             │
│  ├ View Shipments      │   ✅  │    ✅   │  ✅ │     ✅    │    ⚡    │    ✅       │
│  ├ Create BOL          │   ✅  │    ✅   │  ✅ │     ⚡    │    ⚡    │    ❌       │
│  ├ Ship Orders         │   ✅  │    ✅   │  ✅ │     ⚡    │    ⚡    │    ❌       │
│  └ Manage Carriers     │   ✅  │    ✅   │  ❌ │     ❌    │    ❌    │    ❌       │
│                        │       │         │     │           │          │             │
│  PRICING MODULE        │       │         │     │           │          │             │
│  ├ View Prices         │   ✅  │    ✅   │  ✅ │     ⚡    │    ❌    │    ✅       │
│  ├ Update Prices       │   ✅  │    ✅   │  ❌ │     ❌    │    ❌    │    ❌       │
│  └ Configure Rules     │   ✅  │    ⚡   │  ❌ │     ❌    │    ❌    │    ❌       │
│                        │       │         │     │           │          │             │
│  ADMIN MODULE          │       │         │     │           │          │             │
│  ├ Manage Users        │   ✅  │    ⚡   │  ❌ │     ❌    │    ❌    │    ❌       │
│  ├ Manage Locations    │   ✅  │    ❌   │  ❌ │     ❌    │    ❌    │    ❌       │
│  └ System Config       │   ✅  │    ❌   │  ❌ │     ❌    │    ❌    │    ❌       │
│                        │       │         │     │           │          │             │
│  Legend: ✅ Full  ⚡ Limited  ❌ None                                               │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 9.1.2 Location-Based Permissions

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         LOCATION-BASED ACCESS                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Users can be assigned to one or more locations:                                    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  USER: John Smith (Scheduler)                                                │    │
│  │                                                                              │    │
│  │  Assigned Locations:                                                         │    │
│  │  ☑️ Detroit Service Center                                                   │    │
│  │  ☑️ Cleveland Service Center                                                 │    │
│  │  ☐ Chicago Service Center                                                   │    │
│  │  ☐ Indianapolis Warehouse                                                   │    │
│  │                                                                              │    │
│  │  Access Level: SCHEDULER                                                     │    │
│  │                                                                              │    │
│  │  Result:                                                                     │    │
│  │  • Can view/schedule jobs at Detroit and Cleveland                          │    │
│  │  • Cannot see Chicago or Indianapolis data                                  │    │
│  │  • Dashboard shows combined metrics for assigned locations                  │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  REGIONAL MANAGER OVERRIDE:                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  USER: Sarah Johnson (Regional Manager)                                      │    │
│  │                                                                              │    │
│  │  Region: Midwest                                                             │    │
│  │  ☑️ ALL locations in region (auto-assigned)                                  │    │
│  │                                                                              │    │
│  │  Access Level: MANAGER                                                       │    │
│  │                                                                              │    │
│  │  Result:                                                                     │    │
│  │  • Full visibility across all Midwest locations                             │    │
│  │  • Can transfer jobs between locations                                      │    │
│  │  • Sees regional roll-up dashboard                                          │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## 9.2 Module Toggle System

### 9.2.1 Feature Flags by Location

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         MODULE TOGGLES - Location Config                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Location: Detroit Service Center                                                   │
│                                                                                      │
│  ┌─ CORE MODULES ────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ☑️ Order Management              ☑️ Inventory Management                     │  │
│  │  ☑️ Job Scheduling                ☑️ Shop Floor                               │  │
│  │  ☑️ Receiving                     ☑️ Shipping                                 │  │
│  │  ☑️ Counter Sales (POS)           ☑️ Dashboard                                │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌─ PROCESSING CAPABILITIES ─────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ☑️ Slitting                      ☑️ Cut-to-Length                            │  │
│  │  ☑️ Shearing                      ☑️ Sawing                                   │  │
│  │  ☐ Blanking                       ☐ Leveling                                  │  │
│  │  ☐ Plasma Cutting                 ☐ Waterjet                                  │  │
│  │                                                                                │  │
│  │  Note: Disabled capabilities won't appear in order entry or scheduling       │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌─ OPTIONAL MODULES ────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ☑️ QA/QC Inspection              ☐ Metallurgy Lab                           │  │
│  │  ☑️ Packaging & Bundling          ☑️ Traceability (MTR)                       │  │
│  │  ☐ Customer Returns               ☑️ Analytics Dashboard                     │  │
│  │  ☐ Toll Processing                ☐ Consignment Inventory                    │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌─ INTEGRATIONS ────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ☑️ E-commerce Sync               ☐ EDI (856, 810, 850)                       │  │
│  │  ☑️ Carrier Integration           ☑️ Scale Integration                        │  │
│  │  ☐ Barcode Printing               ☑️ Document Generation                     │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  [ Save Configuration ]  [ Copy from Another Location ]  [ Reset to Defaults ]     │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 10. HIGH-LEVEL DATA MODEL

## 10.1 Core Entities

### 10.1.1 Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         CORE DATA MODEL                                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│                                ┌───────────────┐                                    │
│                                │   CUSTOMER    │                                    │
│                                │───────────────│                                    │
│                                │ id            │                                    │
│                                │ name          │                                    │
│                                │ accountNumber │                                    │
│                                │ creditLimit   │                                    │
│                                │ priceLevel    │                                    │
│                                └───────┬───────┘                                    │
│                                        │                                            │
│                                        │ places                                     │
│                                        ▼                                            │
│  ┌───────────────┐            ┌───────────────┐            ┌───────────────┐        │
│  │    QUOTE      │───────────▶│     ORDER     │◀───────────│   LOCATION    │        │
│  │───────────────│  converts  │───────────────│  assigned  │───────────────│        │
│  │ id            │            │ id            │            │ id            │        │
│  │ quoteNumber   │            │ orderNumber   │            │ name          │        │
│  │ validUntil    │            │ status        │            │ type          │        │
│  │ total         │            │ dueDate       │            │ address       │        │
│  └───────────────┘            │ priority      │            │ capabilities  │        │
│                               └───────┬───────┘            └───────────────┘        │
│                                       │                                             │
│                                       │ contains                                    │
│                                       ▼                                             │
│                               ┌───────────────┐                                     │
│                               │  ORDER_LINE   │                                     │
│                               │───────────────│                                     │
│                               │ id            │                                     │
│                               │ productId     │                                     │
│                               │ quantity      │                                     │
│                               │ unitPrice     │                                     │
│                               │ processing    │                                     │
│                               └───────┬───────┘                                     │
│                                       │                                             │
│                                       │ generates                                   │
│                                       ▼                                             │
│  ┌───────────────┐            ┌───────────────┐            ┌───────────────┐        │
│  │ WORK_CENTER   │◀───────────│      JOB      │───────────▶│  INVENTORY    │        │
│  │───────────────│  scheduled │───────────────│  consumes  │───────────────│        │
│  │ id            │     on     │ id            │            │ id            │        │
│  │ name          │            │ jobNumber     │            │ productId     │        │
│  │ type          │            │ status        │            │ locationId    │        │
│  │ capacity      │            │ scheduledDate │            │ quantity      │        │
│  │ locationId    │            │ instructions  │            │ lotNumber     │        │
│  └───────────────┘            └───────┬───────┘            │ heatNumber    │        │
│                                       │                    └───────────────┘        │
│                                       │ produces                                    │
│                                       ▼                                             │
│                               ┌───────────────┐            ┌───────────────┐        │
│                               │  JOB_OUTPUT   │───────────▶│   SHIPMENT    │        │
│                               │───────────────│  ships in  │───────────────│        │
│                               │ id            │            │ id            │        │
│                               │ jobId         │            │ shipmentNumber│        │
│                               │ quantity      │            │ carrier       │        │
│                               │ weight        │            │ trackingNumber│        │
│                               │ bundleTag     │            │ status        │        │
│                               └───────────────┘            └───────────────┘        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 10.1.2 Product Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         PRODUCT HIERARCHY                                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                           PRODUCT CATEGORY                                   │    │
│  │  ─────────────────────────────────────────────────────────────────────────  │    │
│  │  Examples: Steel, Aluminum, Stainless, Brass, Plastics                      │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                          │                                          │
│                                          ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                           PRODUCT FAMILY                                     │    │
│  │  ─────────────────────────────────────────────────────────────────────────  │    │
│  │  Examples: Hot Rolled, Cold Rolled, Galvanized, Aluminum Sheet             │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                          │                                          │
│                                          ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                           PRODUCT (SKU)                                      │    │
│  │  ─────────────────────────────────────────────────────────────────────────  │    │
│  │  id: PRD-001                                                                │    │
│  │  name: HR Steel Sheet A1011 CS-B                                            │    │
│  │  category: Steel                                                            │    │
│  │  family: Hot Rolled                                                         │    │
│  │  form: Sheet                                                                │    │
│  │  spec: ASTM A1011                                                           │    │
│  │  grade: CS Type B                                                           │    │
│  │  dimensions: null (defined at variant level)                                │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                          │                                          │
│                                          ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                           PRODUCT VARIANT                                    │    │
│  │  ─────────────────────────────────────────────────────────────────────────  │    │
│  │  id: VAR-001-125-48-96                                                      │    │
│  │  productId: PRD-001                                                         │    │
│  │  thickness: 0.125"                                                          │    │
│  │  width: 48"                                                                 │    │
│  │  length: 96"                                                                │    │
│  │  weightPerPiece: 196 lbs                                                    │    │
│  │  uom: EA                                                                    │    │
│  │  pricingUom: LB                                                             │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                          │                                          │
│                                          ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                           INVENTORY ITEM (LOT)                               │    │
│  │  ─────────────────────────────────────────────────────────────────────────  │    │
│  │  id: INV-45221                                                              │    │
│  │  variantId: VAR-001-125-48-96                                               │    │
│  │  locationId: LOC-DETROIT                                                    │    │
│  │  quantity: 45 pcs                                                           │    │
│  │  weight: 8,820 lbs                                                          │    │
│  │  heatNumber: NUC-45221                                                      │    │
│  │  millCert: attached                                                         │    │
│  │  bayLocation: A-12                                                          │    │
│  │  receivedDate: 2026-01-10                                                   │    │
│  │  ownership: HOUSE (owned inventory)                                         │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 10.1.3 Job & Processing Model

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         JOB DATA MODEL                                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  JOB (Primary Work Unit)                                                            │
│  ═══════════════════════════════════════════════════════════════════════════════    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  id: JOB-1234                                                               │    │
│  │  orderLineId: OL-5678                                                       │    │
│  │  status: IN_PROCESS                                                         │    │
│  │  priority: HOT                                                              │    │
│  │                                                                              │    │
│  │  ┌─ Processing Info ────────────────────────────────────────────────────┐   │    │
│  │  │  processingType: SLITTING                                            │   │    │
│  │  │  workCenterId: WC-SLIT-01                                            │   │    │
│  │  │  scheduledDate: 2026-01-17                                           │   │    │
│  │  │  scheduledTime: 08:00                                                │   │    │
│  │  │  estimatedDuration: 90 min                                           │   │    │
│  │  └──────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                              │    │
│  │  ┌─ Instructions ───────────────────────────────────────────────────────┐   │    │
│  │  │  inputMaterial:                                                      │   │    │
│  │  │    inventoryId: INV-45221                                            │   │    │
│  │  │    product: "HR Coil 0.125 x 48"                                     │   │    │
│  │  │    weight: 42,380 lbs                                                │   │    │
│  │  │                                                                      │   │    │
│  │  │  outputSpec:                                                         │   │    │
│  │  │    widths: [12.0, 12.0, 12.0, 11.5]                                 │   │    │
│  │  │    edgeTrim: 0.25 each side                                          │   │    │
│  │  │    outputForm: OSCILLATE_WOUND                                       │   │    │
│  │  │    targetQuantity: 24 mults                                          │   │    │
│  │  │                                                                      │   │    │
│  │  │  specialInstructions: "Customer requires OD max 24 inches"           │   │    │
│  │  └──────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                              │    │
│  │  ┌─ Tracking ───────────────────────────────────────────────────────────┐   │    │
│  │  │  startedAt: 2026-01-17T09:15:00                                      │   │    │
│  │  │  startedBy: user-john                                                │   │    │
│  │  │  completedAt: null                                                   │   │    │
│  │  │  actualDuration: null                                                │   │    │
│  │  └──────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                              │    │
│  │  ┌─ Output Records ─────────────────────────────────────────────────────┐   │    │
│  │  │  outputs: [                                                          │   │    │
│  │  │    { width: 12.0, quantity: 6, weight: 10,400 lbs, tag: "A" },      │   │    │
│  │  │    { width: 12.0, quantity: 6, weight: 10,400 lbs, tag: "B" },      │   │    │
│  │  │    { width: 12.0, quantity: 6, weight: 10,400 lbs, tag: "C" },      │   │    │
│  │  │    ... in progress                                                   │   │    │
│  │  │  ]                                                                   │   │    │
│  │  │  totalOutput: 18 mults                                               │   │    │
│  │  │  scrap: [                                                            │   │    │
│  │  │    { reason: "EDGE_TRIM", weight: 580 lbs }                         │   │    │
│  │  │  ]                                                                   │   │    │
│  │  │  yield: 98.5%                                                        │   │    │
│  │  └──────────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 11. PHASE 2+ IDEAS

## 11.1 Future Module Roadmap

### 11.1.1 Phase 2: Advanced Operations

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 2 MODULES                                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─ ADVANCED INVENTORY ────────────────────────────────────────────────────────┐    │
│  │                                                                              │    │
│  │  • Multi-Location Transfer Management                                       │    │
│  │    - Inter-branch transfers with transit tracking                          │    │
│  │    - Automatic rebalancing suggestions                                      │    │
│  │    - Transfer cost allocation                                               │    │
│  │                                                                              │    │
│  │  • Consignment Inventory                                                    │    │
│  │    - Customer-owned inventory at service center                            │    │
│  │    - Automatic replenishment triggers                                      │    │
│  │    - Usage billing                                                          │    │
│  │                                                                              │    │
│  │  • Toll Processing (Customer-Owned Material)                               │    │
│  │    - Receive customer coils                                                 │    │
│  │    - Track through processing                                               │    │
│  │    - Charge processing only (no material)                                  │    │
│  │                                                                              │    │
│  └──────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─ QUALITY MANAGEMENT ────────────────────────────────────────────────────────┐    │
│  │                                                                              │    │
│  │  • Inspection Workflows                                                     │    │
│  │    - Configurable inspection checklists                                    │    │
│  │    - Pass/fail with measurements                                           │    │
│  │    - Photo documentation                                                    │    │
│  │                                                                              │    │
│  │  • Non-Conformance Tracking                                                 │    │
│  │    - NCR creation and workflow                                              │    │
│  │    - Root cause analysis                                                    │    │
│  │    - Corrective actions                                                     │    │
│  │                                                                              │    │
│  │  • Calibration Management                                                   │    │
│  │    - Equipment calibration schedules                                        │    │
│  │    - Calibration records                                                    │    │
│  │    - Compliance reporting                                                   │    │
│  │                                                                              │    │
│  └──────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─ ADVANCED ANALYTICS ────────────────────────────────────────────────────────┐    │
│  │                                                                              │    │
│  │  • Operational Dashboards                                                   │    │
│  │    - Real-time production metrics                                          │    │
│  │    - OEE (Overall Equipment Effectiveness)                                 │    │
│  │    - Yield analysis by operator/machine                                    │    │
│  │                                                                              │    │
│  │  • Customer Analytics                                                       │    │
│  │    - Customer profitability analysis                                       │    │
│  │    - Order pattern recognition                                              │    │
│  │    - Churn prediction                                                       │    │
│  │                                                                              │    │
│  │  • Inventory Optimization                                                   │    │
│  │    - Demand forecasting                                                     │    │
│  │    - Safety stock recommendations                                          │    │
│  │    - Slow-moving inventory alerts                                          │    │
│  │                                                                              │    │
│  └──────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 11.1.2 Phase 3: Enterprise Features

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 3 MODULES                                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─ MULTI-DIVISION SUPPORT ────────────────────────────────────────────────────┐    │
│  │                                                                              │    │
│  │  • Division Configuration                                                   │    │
│  │    - Metals Division (steel, aluminum, stainless)                          │    │
│  │    - Plastics Division (sheets, rods, tubes)                               │    │
│  │    - Industrial Supplies (tools, safety, welding)                          │    │
│  │    - Separate P&Ls, shared customers                                        │    │
│  │                                                                              │    │
│  │  • Cross-Division Ordering                                                  │    │
│  │    - Single order, multiple divisions                                      │    │
│  │    - Consolidated shipping                                                  │    │
│  │    - Combined invoicing                                                     │    │
│  │                                                                              │    │
│  └──────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─ FINANCIAL INTEGRATION ─────────────────────────────────────────────────────┐    │
│  │                                                                              │    │
│  │  • Accounts Receivable                                                      │    │
│  │    - Invoice generation                                                     │    │
│  │    - Payment processing                                                     │    │
│  │    - Collections management                                                 │    │
│  │                                                                              │    │
│  │  • Accounts Payable                                                         │    │
│  │    - Purchase order management                                              │    │
│  │    - Vendor invoice matching                                                │    │
│  │    - Payment scheduling                                                     │    │
│  │                                                                              │    │
│  │  • General Ledger Integration                                               │    │
│  │    - Cost accounting                                                        │    │
│  │    - Revenue recognition                                                    │    │
│  │    - Period close                                                           │    │
│  │                                                                              │    │
│  └──────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─ MOBILE APPLICATIONS ───────────────────────────────────────────────────────┐    │
│  │                                                                              │    │
│  │  • Driver App                                                               │    │
│  │    - Route optimization                                                     │    │
│  │    - Proof of delivery capture                                              │    │
│  │    - Customer signature                                                     │    │
│  │                                                                              │    │
│  │  • Sales Rep App                                                            │    │
│  │    - Customer visit logging                                                 │    │
│  │    - Quick quote generation                                                 │    │
│  │    - Inventory lookup                                                       │    │
│  │                                                                              │    │
│  │  • Warehouse Scanner App                                                    │    │
│  │    - Barcode scanning                                                       │    │
│  │    - Inventory moves                                                        │    │
│  │    - Cycle counting                                                         │    │
│  │                                                                              │    │
│  └──────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 11.1.3 AI/ML Opportunities

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         AI/ML FUTURE FEATURES                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─ DEMAND FORECASTING ────────────────────────────────────────────────────────┐    │
│  │                                                                              │    │
│  │  • Historical Pattern Analysis                                              │    │
│  │    - Seasonal demand prediction                                             │    │
│  │    - Customer order pattern recognition                                     │    │
│  │    - New product demand estimation                                          │    │
│  │                                                                              │    │
│  │  • Inventory Optimization                                                   │    │
│  │    - Optimal reorder points                                                 │    │
│  │    - Safety stock recommendations                                           │    │
│  │    - Location balancing suggestions                                         │    │
│  │                                                                              │    │
│  └──────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─ INTELLIGENT SCHEDULING ────────────────────────────────────────────────────┐    │
│  │                                                                              │    │
│  │  • Job Sequencing Optimization                                              │    │
│  │    - Minimize setup times                                                   │    │
│  │    - Group similar jobs                                                     │    │
│  │    - Balance machine utilization                                            │    │
│  │                                                                              │    │
│  │  • Predictive Lead Times                                                    │    │
│  │    - Actual vs. estimated analysis                                         │    │
│  │    - More accurate promise dates                                            │    │
│  │    - Early warning for delays                                               │    │
│  │                                                                              │    │
│  └──────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─ QUALITY PREDICTION ────────────────────────────────────────────────────────┐    │
│  │                                                                              │    │
│  │  • Defect Prediction                                                        │    │
│  │    - Flag jobs likely to have quality issues                               │    │
│  │    - Recommend additional inspection                                        │    │
│  │    - Suggest process parameter adjustments                                  │    │
│  │                                                                              │    │
│  │  • Yield Optimization                                                       │    │
│  │    - Optimal cut patterns                                                   │    │
│  │    - Scrap minimization                                                     │    │
│  │    - Nesting algorithms for sheet cutting                                   │    │
│  │                                                                              │    │
│  └──────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─ CUSTOMER INTELLIGENCE ─────────────────────────────────────────────────────┐    │
│  │                                                                              │    │
│  │  • Churn Prediction                                                         │    │
│  │    - Identify at-risk customers                                             │    │
│  │    - Recommend retention actions                                            │    │
│  │    - Track engagement metrics                                               │    │
│  │                                                                              │    │
│  │  • Cross-Sell/Up-Sell                                                       │    │
│  │    - Product recommendations                                                │    │
│  │    - "Customers also bought" suggestions                                   │    │
│  │    - Processing service suggestions                                         │    │
│  │                                                                              │    │
│  │  • Pricing Intelligence                                                     │    │
│  │    - Competitive price monitoring                                           │    │
│  │    - Price elasticity analysis                                              │    │
│  │    - Margin optimization                                                    │    │
│  │                                                                              │    │
│  └──────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 12. APPENDIX

## 12.1 Glossary of Terms

| Term | Definition |
|------|------------|
| **ATP** | Available-to-Promise - inventory not yet allocated to orders |
| **BOL** | Bill of Lading - shipping document |
| **Coil** | Steel wound into a roll; primary form for sheet products |
| **CTL** | Cut-to-Length - processing coil into flat sheets |
| **EDI** | Electronic Data Interchange - automated B2B order exchange |
| **Heat Number** | Mill lot identifier for traceability |
| **Master Coil** | Full-width coil as received from mill |
| **MTR** | Mill Test Report - chemical/mechanical properties certificate |
| **Mult** | Multiple - one strip of slit coil (e.g., 8 mults = 8 narrower coils) |
| **OEE** | Overall Equipment Effectiveness - production efficiency metric |
| **PO** | Purchase Order |
| **POD** | Proof of Delivery |
| **SLA** | Service Level Agreement - delivery time commitment |
| **Slitting** | Process of cutting coil into narrower widths |
| **Toll Processing** | Processing customer-owned material for a fee |

## 12.2 Color Palette Reference

| Use | Color | Hex | Usage |
|-----|-------|-----|-------|
| Primary | Steel Blue | `#1E3A5F` | Headers, primary buttons |
| Secondary | Industrial Orange | `#FF6B35` | CTAs, alerts, highlights |
| Success | Green | `#2E7D32` | On track, completed, positive |
| Warning | Amber | `#F9A825` | At risk, attention needed |
| Error | Red | `#C62828` | Late, critical, errors |
| Info | Blue | `#1976D2` | Information, links |
| Background | Light Gray | `#F5F5F5` | Page backgrounds |
| Surface | White | `#FFFFFF` | Cards, dialogs |
| Text Primary | Dark Gray | `#212121` | Main text |
| Text Secondary | Medium Gray | `#757575` | Secondary text, labels |

## 12.3 Status Color Mapping

| Status | Color | Background | Chip Style |
|--------|-------|------------|------------|
| ORDERED | Gray | `#9E9E9E` | Outlined |
| RECEIVED | Blue | `#2196F3` | Filled |
| SCHEDULED | Orange | `#FF9800` | Filled |
| IN_PROCESS | Green | `#4CAF50` | Filled |
| WAITING_QC | Purple | `#9C27B0` | Filled |
| PACKAGING | Cyan | `#00BCD4` | Filled |
| READY_TO_SHIP | Indigo | `#3F51B5` | Filled |
| SHIPPED | Teal | `#009688` | Filled |
| COMPLETED | Green | `#2E7D32` | Filled |
| BILLED | Gray | `#607D8B` | Outlined |
| HOLD | Red | `#F44336` | Filled |
| CANCELLED | Gray | `#9E9E9E` | Outlined, strikethrough |

---

*End of Phase 1 Design Document*
*Version 1.0 - January 2026*
*AlroWare Platform - Service Center Operations*
