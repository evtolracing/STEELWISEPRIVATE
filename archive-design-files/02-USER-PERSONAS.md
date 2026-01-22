# 02 - USER PERSONAS & JOURNEYS

## Role Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            STEELWISE USER ROLES                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  UPSTREAM                    MIDSTREAM                      DOWNSTREAM          │
│  ┌──────────┐               ┌──────────────┐               ┌──────────────┐     │
│  │   MILL   │──────────────▶│SERVICE CENTER│──────────────▶│ DISTRIBUTOR  │     │
│  │ PRODUCER │               │  PROCESSOR   │               │              │     │
│  └──────────┘               └──────────────┘               └──────────────┘     │
│       │                           │                               │              │
│       │                           ▼                               │              │
│       │                    ┌──────────────┐                       │              │
│       │                    │    BROKER    │◀──────────────────────┤              │
│       │                    │    TRADER    │                       │              │
│       │                    └──────────────┘                       │              │
│       │                           │                               │              │
│       ▼                           ▼                               ▼              │
│  ┌─────────────────────────────────────────────────────────────────────┐        │
│  │                    FABRICATOR / OEM BUYER                           │        │
│  └─────────────────────────────────────────────────────────────────────┘        │
│                                                                                  │
│  INTERNAL ROLES (Cross-cutting):                                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │  QUALITY   │  │  LOGISTICS │  │  FINANCE   │  │   ADMIN    │                │
│  │ COMPLIANCE │  │  TRUCKING  │  │ ACCOUNTING │  │  IT/SUPER  │                │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 👤 PERSONA 1: MILL PRODUCER

### Profile
| Attribute | Value |
|-----------|-------|
| **Organization Type** | Integrated steel mill, Mini-mill (EAF) |
| **Primary Users** | Production planners, Quality managers, Shipping coordinators |
| **System Usage** | Create heats, attach MTRs, release to customers |
| **Key Pain Points** | MTR generation, heat tracking, customer visibility |

### User Journey: Heat Production → Release

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   CREATE    │───▶│   RECORD    │───▶│   ATTACH    │───▶│   RELEASE   │
│    HEAT     │    │   TESTING   │    │    MTR      │    │  TO BUYER   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │                  │                  │                  │
      ▼                  ▼                  ▼                  ▼
 Heat Number         Chemistry          PDF + Data         Notify
 Grade/Spec         Mechanical         Extraction        Customer
 Cast Date          Test Results       Validation        Available
```

### Key Screens
1. **Heat Entry Form** - Create new heat with chemistry, grade, weight
2. **MTR Generation** - Generate/upload mill test reports
3. **Inventory Release** - Mark material available for sale
4. **Customer Portal** - View orders, provide tracking

### Permissions
- Create/Edit: Heats, MTRs, Production data
- View: Own inventory, Customer orders
- No Access: Pricing, Financials (unless authorized)

---

## 👤 PERSONA 2: SERVICE CENTER PROCESSOR

### Profile
| Attribute | Value |
|-----------|-------|
| **Organization Type** | Steel service center, Toll processor |
| **Primary Users** | Scheduler, Operators, Receiving, Shipping |
| **System Usage** | Receive coils, process, split, ship |
| **Key Pain Points** | Coil tracking, yield loss, work order routing |

### User Journey: Receive → Process → Ship

```
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│  RECEIVE  │──▶│   STAGE   │──▶│  PROCESS  │──▶│    QC     │──▶│   SHIP    │
│   COIL    │   │  FOR WORK │   │SLIT/CUT/  │   │  INSPECT  │   │  TO DIST  │
└───────────┘   └───────────┘   └───────────┘   └───────────┘   └───────────┘
      │               │               │               │               │
      ▼               ▼               ▼               ▼               ▼
 Scan Coil ID    Assign to WO    Record Cuts     Pass/Fail      BOL + MTR
 Verify MTR      Queue Line       New IDs        Hold/Release   Weight/Tags
 Put Away        Priority         Yield Calc     Dimensions     Carrier
```

### Key Screens
1. **Receiving Dashboard** - Inbound shipments, scan to receive
2. **Work Order Queue** - Prioritized list of jobs by line
3. **Processing Entry** - Record cuts, new coil IDs, weights
4. **Shipping Manifest** - Build loads, print BOLs

### Permissions
- Create/Edit: Work orders, Inventory movements, Shipments
- View: Customer orders (relevant), Pricing (if sales role)
- Execute: Processing operations, QC checkpoints

---

## 👤 PERSONA 3: DISTRIBUTOR / SALES

### Profile
| Attribute | Value |
|-----------|-------|
| **Organization Type** | Steel distributor, Metal supply house |
| **Primary Users** | Sales reps, Inside sales, Purchasing |
| **System Usage** | Quote, sell, source, manage customers |
| **Key Pain Points** | Quick quoting, inventory availability, pricing |

### User Journey: RFQ → Quote → Order → Delivery

```
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│  RECEIVE  │──▶│   CHECK   │──▶│  CREATE   │──▶│  CONVERT  │──▶│  FULFILL  │
│    RFQ    │   │  STOCK    │   │   QUOTE   │   │  TO ORDER │   │  & SHIP   │
└───────────┘   └───────────┘   └───────────┘   └───────────┘   └───────────┘
      │               │               │               │               │
      ▼               ▼               ▼               ▼               ▼
 Customer Req    Inventory       Build Quote     PO Received     Pick/Pack
 Specs/Grade     Availability    w/ Pricing      Create SO       Schedule
 Quantity        Location        Send Email      Allocate        Deliver
```

### Key Screens
1. **Quote Builder** - Multi-line quote with pricing, delivery
2. **Inventory Search** - Real-time stock by spec, location
3. **Customer Management** - Contacts, history, credit
4. **Order Board** - Pipeline of orders by status

### Permissions
- Create/Edit: Quotes, Sales Orders, Customers
- View: All inventory, Pricing rules, Margins (if manager)
- Approve: Pricing exceptions (with limits)

---

## 👤 PERSONA 4: BROKER / COMMODITY TRADER

### Profile
| Attribute | Value |
|-----------|-------|
| **Organization Type** | Steel broker, Trading desk |
| **Primary Users** | Traders, Analysts |
| **System Usage** | Match buyers/sellers, arbitrage, track positions |
| **Key Pain Points** | Market data, position tracking, margin visibility |

### User Journey: Source → Match → Trade → Settle

```
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│   FIND    │──▶│   MATCH   │──▶│  EXECUTE  │──▶│  SETTLE   │
│  SUPPLY   │   │  TO BUYER │   │   TRADE   │   │  PAYMENT  │
└───────────┘   └───────────┘   └───────────┘   └───────────┘
      │               │               │               │
      ▼               ▼               ▼               ▼
 Market Scan     Negotiate       Back-to-Back    Commission
 Supplier Net    Spread          PO/SO Pair      Settlement
 Availability    Terms           Drop Ship       Reporting
```

### Key Screens
1. **Market Dashboard** - Live commodity prices, spreads
2. **Position Book** - Open trades, exposure, P&L
3. **Supplier Network** - Available inventory across mills
4. **Trade Blotter** - Executed transactions

### Permissions
- Create/Edit: Trades, Positions
- View: Market data, Supplier inventory (network)
- Execute: Back-to-back orders

---

## 👤 PERSONA 5: FABRICATOR / OEM BUYER

### Profile
| Attribute | Value |
|-----------|-------|
| **Organization Type** | Steel fabricator, Manufacturer, OEM |
| **Primary Users** | Purchasing agents, Engineers, Receiving |
| **System Usage** | Procure material, track deliveries, verify certs |
| **Key Pain Points** | Cert compliance, delivery timing, spec matching |

### User Journey: Procure → Receive → Consume

```
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│  CREATE   │──▶│   TRACK   │──▶│  RECEIVE  │──▶│  CONSUME  │
│    PO     │   │  DELIVERY │   │ & VERIFY  │   │ IN PROD   │
└───────────┘   └───────────┘   └───────────┘   └───────────┘
      │               │               │               │
      ▼               ▼               ▼               ▼
 Spec + Qty      ETA Updates     Scan/Match       WIP Tracking
 Required Certs  Carrier GPS     MTR Validation   Job Costing
 Delivery Date   Exceptions      Put Away         Traceability
```

### Key Screens
1. **Procurement Portal** - Submit POs, view confirmations
2. **Delivery Tracker** - Inbound shipments with ETA
3. **Certificate Vault** - All MTRs and certs for received material
4. **Inventory Consumption** - Link material to production jobs

### Permissions
- Create/Edit: Purchase Orders
- View: Order status, Certificates, Tracking
- Download: MTRs, Compliance documents

---

## 👤 PERSONA 6: QUALITY & COMPLIANCE

### Profile
| Attribute | Value |
|-----------|-------|
| **Organization Type** | Any (internal role) |
| **Primary Users** | QC inspectors, Quality managers, Compliance officers |
| **System Usage** | Test entry, hold management, cert validation |
| **Key Pain Points** | Test result tracking, spec compliance, hold queue |

### User Journey: Test → Validate → Disposition

```
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│   TEST    │──▶│  VALIDATE │──▶│ HOLD/PASS │──▶│  RELEASE  │
│  MATERIAL │   │  VS SPEC  │   │  DECISION │   │   / NCR   │
└───────────┘   └───────────┘   └───────────┘   └───────────┘
      │               │               │               │
      ▼               ▼               ▼               ▼
 Enter Results   Auto-Check      Quality Hold    Release Code
 Tensile/Hard    ASTM Limits     Investigation   NCR Document
 Dimensional     Chemistry       Root Cause      Disposition
```

### Key Screens
1. **Test Entry** - Record results by heat/coil
2. **Hold Queue** - Material on hold awaiting disposition
3. **NCR Management** - Non-conformance reports
4. **Compliance Dashboard** - Cert expiry, audit status

### Permissions
- Create/Edit: Test results, Holds, NCRs
- Approve: Release holds, Disposition decisions
- View: All material traceability

---

## 👤 PERSONA 7: LOGISTICS & TRUCKING

### Profile
| Attribute | Value |
|-----------|-------|
| **Organization Type** | Carrier, In-house fleet, 3PL |
| **Primary Users** | Dispatchers, Drivers, Fleet managers |
| **System Usage** | Route planning, dispatch, delivery confirmation |
| **Key Pain Points** | Multi-stop optimization, weight compliance, POD capture |

### User Journey: Dispatch → Route → Deliver → Confirm

```
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│  BUILD    │──▶│ OPTIMIZE  │──▶│  EXECUTE  │──▶│  CONFIRM  │
│   LOAD    │   │   ROUTE   │   │  DELIVERY │   │    POD    │
└───────────┘   └───────────┘   └───────────┘   └───────────┘
      │               │               │               │
      ▼               ▼               ▼               ▼
 Select Orders   Multi-Stop      GPS Tracking    Photo/Sign
 Weight Check    Time Windows    Driver App      Exceptions
 Assign Truck    Distance/Fuel   Notifications   Bill Carrier
```

### Key Screens
1. **Dispatch Board** - Orders ready to ship, truck availability
2. **Route Planner** - Map view, stop optimization
3. **Driver Mobile** - Turn-by-turn, delivery checklist
4. **POD Management** - Proof of delivery, exceptions

### Permissions
- Create/Edit: Shipments, Routes
- Execute: Dispatch, Delivery confirmation
- View: Orders (shipping only), Customer locations

---

## 👤 PERSONA 8: ACCOUNTING & FINANCE

### Profile
| Attribute | Value |
|-----------|-------|
| **Organization Type** | Any (internal role) |
| **Primary Users** | AP/AR clerks, Controllers, CFO |
| **System Usage** | Invoicing, payments, cost accounting |
| **Key Pain Points** | Invoice matching, margin analysis, cash flow |

### User Journey: Order → Invoice → Collect

```
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│  ORDER    │──▶│  INVOICE  │──▶│  COLLECT  │──▶│ RECONCILE │
│  SHIPPED  │   │  GENERATE │   │  PAYMENT  │   │   CLOSE   │
└───────────┘   └───────────┘   └───────────┘   └───────────┘
      │               │               │               │
      ▼               ▼               ▼               ▼
 Cost Capture    Auto-Generate   AR Aging       Bank Match
 Margin Calc     Email/EDI       Collections    GL Posting
 Commission      Tax Calc        Cash App       Period Close
```

### Key Screens
1. **Invoice Queue** - Shipped orders ready to bill
2. **AR Aging** - Outstanding receivables by customer
3. **AP Management** - Vendor bills, payment scheduling
4. **Margin Reports** - Profitability by order, customer, product

### Permissions
- Create/Edit: Invoices, Payments, GL entries
- Approve: Credit memos, Write-offs
- View: All financial data, Full cost details

---

## 🔐 PERMISSIONS MATRIX SUMMARY

| Role | Products | Inventory | Orders | Pricing | Quality | Finance | Admin |
|------|----------|-----------|--------|---------|---------|---------|-------|
| Mill Producer | Edit | Edit (own) | View | - | Edit | - | - |
| Service Center | View | Edit | Edit | View | Edit | View | - |
| Distributor | View | View | Edit | Edit | View | View | - |
| Broker | View | View (network) | Edit | View | - | View | - |
| Fabricator/OEM | View | - | Create PO | - | View | View | - |
| Quality | View | View | - | - | Full | - | - |
| Logistics | - | View | View (ship) | - | - | - | - |
| Finance | View | View | View | View | View | Full | - |
| Admin | Full | Full | Full | Full | Full | Full | Full |

---

*Next: [03-DATA-MODEL-CORE.md](03-DATA-MODEL-CORE.md) - Entity relationships and data structures*
