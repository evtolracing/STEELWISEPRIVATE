# 01 - EXECUTIVE VISION & PLATFORM INTENT

## Platform Statement

**SteelWise** is a vertically-integrated ERP platform purpose-built for the steel supply chain—from raw melt to end-user delivery. It provides full lifecycle traceability, materials science tracking, quality assurance, commercial operations, and logistics coordination across all stakeholders: mills, service centers, distributors, brokers, fabricators, and OEM buyers.

---

## 🎯 CORE OBJECTIVES

### 1. Complete Steel Traceability
Track every unit of steel from heat number origin through all transformations to final delivery:
- Melt → Casting → Rolling → Processing → Distribution → End User
- Maintain chain of custody with immutable audit trail
- Link MTRs, test results, and certifications to specific material lots

### 2. Multi-Party Collaboration
Enable seamless handoffs between supply chain parties:
- Mills produce and certify
- Service centers process and transform
- Distributors warehouse and sell
- Brokers trade and arbitrage
- Fabricators consume and build
- Each party sees relevant data; full transparency where authorized

### 3. Materials Science Integration
Embed metallurgical knowledge into the platform:
- Steel grades, chemistries, mechanical properties
- ASTM/ISO/MIL specifications
- Test result validation against spec limits
- Heat treatment and processing parameters

### 4. Commercial Excellence
Integrate commodity pricing and commercial operations:
- Real-time LME/CME/scrap index feeds
- Dynamic pricing calculations
- RFQ → Quote → PO → SO → Invoice lifecycle
- Cost accounting with full margin visibility

### 5. Operational Efficiency
Streamline shop floor and logistics:
- Work orders with routing and BOM
- Multi-stop truck dispatch optimization
- Warehouse location management
- Real-time inventory visibility

---

## 🏭 STEEL LIFECYCLE MODEL

### UPSTREAM (Mills / Primary Producers)
```
Iron Ore → Pellets → Blast Furnace/EAF Melt → Continuous Casting
                                                      │
                    ┌─────────────────────────────────┼─────────────────────────────────┐
                    ▼                                 ▼                                 ▼
                 BILLETS                           BLOOMS                            SLABS
                    │                                 │                                 │
                    ▼                                 ▼                                 ▼
              Bar / Rod / Wire                  Structural Shapes              Flat Products
              Rebar / Merchant                  Beam / Rail / Pile            Sheet / Plate / Coil
```

### MIDSTREAM (Service Centers / Processors)
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PROCESSING OPERATIONS                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  HOT ROLLING ──▶ COLD ROLLING ──▶ ANNEALING ──▶ COATING/GALVANIZING            │
│                                                                                  │
│  PICKLING ──▶ SLITTING ──▶ CUT-TO-LENGTH ──▶ SHEARING ──▶ BLANKING            │
│                                                                                  │
│  HEAT TREATMENT ──▶ TEMPERING ──▶ NORMALIZING ──▶ QUENCHING                    │
│                                                                                  │
│  SHAPE FORMING ──▶ TUBE/PIPE ──▶ STRUCTURAL ──▶ SPECIALTY                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### DOWNSTREAM (Distribution / End Users)
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  WAREHOUSE   │────▶│ DISTRIBUTION │────▶│ FABRICATION  │────▶│   END USER   │
│   STORAGE    │     │   CENTERS    │     │     SHOPS    │     │  INDUSTRIES  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                      │
        ┌─────────────────┬─────────────────┬─────────────────┬───────┴───────┐
        ▼                 ▼                 ▼                 ▼               ▼
   Construction      Automotive        Energy/Oil       Aerospace       Appliance
   Infrastructure    Transport         & Gas            Defense         Equipment
```

---

## 🔑 KEY TRACKING IDENTIFIERS

| Identifier | Description | Lifecycle Scope |
|------------|-------------|-----------------|
| **Heat Number** | Unique melt identifier from mill | Origin → End User |
| **Coil ID** | Individual coil tracking number | Rolling → Consumption |
| **Batch/Lot** | Grouped processing batch | Processing → Distribution |
| **PO/SO Number** | Commercial transaction reference | Order → Delivery |
| **MTR Number** | Mill Test Report document ID | Certification |
| **BOL Number** | Bill of Lading for shipment | Logistics |
| **Tag/Bundle ID** | Physical warehouse identifier | Warehouse Operations |

---

## 📐 ARCHITECTURE PRINCIPLES

### 1. Domain-Driven Design
- Bounded contexts for each major function
- Shared kernel for steel product definitions
- Event sourcing for traceability

### 2. API-First
- All functionality exposed via REST/GraphQL
- EDI translation layer for legacy systems
- Webhook events for integrations

### 3. Multi-Tenancy
- Tenant = Organization (Mill, Service Center, Distributor)
- Cross-tenant visibility for supply chain partners
- Data isolation with controlled sharing

### 4. Event-Driven
- Material movements trigger events
- Quality holds propagate automatically
- Price changes cascade to open quotes

### 5. Offline-Capable
- Shop floor tablets sync when connected
- Barcode scanning works offline
- Queue-based upload on reconnection

---

## 💡 DIFFERENTIATORS

| Feature | Traditional ERP | SteelWise |
|---------|----------------|-----------|
| Steel Grades | Generic item codes | Full metallurgical specs with chemistry |
| Traceability | Lot-level at best | Heat/coil level with genealogy tree |
| Pricing | Static price lists | Live commodity integration |
| Documents | Attached files | Structured MTRs with data extraction |
| Multi-Party | Single company | Supply chain network visibility |
| Shop Floor | Separate MES needed | Integrated work orders + routing |
| Quality | Basic pass/fail | Full metallurgical testing with spec validation |

---

## 🎨 DESIGN PHILOSOPHY

### Visual Language
- **Industrial Aesthetic**: Clean, utilitarian, high-contrast
- **Data-Dense**: Information-rich screens for experienced users
- **Scannable**: Heavy use of tables, badges, status indicators
- **Actionable**: Every screen has clear primary actions

### Interaction Model
- **Keyboard-First**: Power users navigate without mouse
- **Bulk Operations**: Select multiple items, apply actions
- **Contextual Search**: Global search + in-table filtering
- **Quick Entry**: Barcode scanning, quick-add forms

### Mobile Strategy
- **Responsive Web**: Primary interface scales to tablet
- **Native Apps**: Shop floor scanning, truck driver delivery
- **Offline Sync**: Critical operations work without network

---

## 📈 SUCCESS METRICS

| Metric | Target | Measurement |
|--------|--------|-------------|
| Material Traceability | 100% | Heat → end user linkage |
| Document Attachment Rate | 99% | MTRs attached to shipments |
| Order-to-Ship Time | -20% | Baseline vs. post-implementation |
| Quality Holds Resolution | <24 hrs | Time from hold to disposition |
| Quote Response Time | <2 hrs | RFQ receipt to quote sent |
| Inventory Accuracy | 99.5% | Physical vs. system count |
| Invoice Accuracy | 99.9% | First-time correct invoices |

---

*Next: [02-USER-PERSONAS.md](02-USER-PERSONAS.md) - Role definitions and user journeys*
