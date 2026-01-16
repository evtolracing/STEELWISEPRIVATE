# 05 - INVENTORY & WAREHOUSE MODULE

## Module Overview
Real-time stock tracking by location, coil-level visibility, allocation management, and warehouse operations.

---

## FUNCTIONAL REQUIREMENTS

| ID | Requirement | Priority |
|----|-------------|----------|
| INV-01 | Track inventory by coil/heat with full traceability | Critical |
| INV-02 | Multi-warehouse, multi-bin location hierarchy | Critical |
| INV-03 | Real-time available quantity (on-hand minus allocated) | Critical |
| INV-04 | Support multiple costing methods (FIFO, Avg, Std) | High |
| INV-05 | Barcode/QR scanning for movements | High |
| INV-06 | Cycle counting and physical inventory | High |
| INV-07 | Quality hold integration | High |

---

## SCREEN: Inventory Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ INVENTORY DASHBOARD                                      As of: 01/16/2026 │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ │
│ │ TOTAL STOCK    │ │ AVAILABLE      │ │ ALLOCATED      │ │ ON HOLD        │ │
│ │ 4,250,000 lbs  │ │ 3,890,000 lbs  │ │ 285,000 lbs    │ │ 75,000 lbs     │ │
│ │ ↑ 3.2% vs LM   │ │ 91.5%          │ │ 6.7%           │ │ 1.8%           │ │
│ └────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ STOCK BY PRODUCT TYPE              │ STOCK BY LOCATION                      │
│ ┌─────────────────────────────────┐│ ┌─────────────────────────────────────┐│
│ │ ████████████████░░░ HR Coil 45% ││ │ Warehouse A    ████████████ 52%    ││
│ │ ████████░░░░░░░░░░░ CR Coil 22% ││ │ Warehouse B    ██████░░░░░░ 28%    ││
│ │ █████░░░░░░░░░░░░░░ Galv    15% ││ │ Yard C         ████░░░░░░░░ 15%    ││
│ │ ███░░░░░░░░░░░░░░░░ Plate   10% ││ │ Outside Store  █░░░░░░░░░░░  5%    ││
│ │ ██░░░░░░░░░░░░░░░░░ Other    8% ││ │                                     ││
│ └─────────────────────────────────┘│ └─────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│ RECENT ACTIVITY                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 10:42 AM │ RECEIVE  │ Coil #HRC-45221 │ 42,500 lbs │ WH-A Bay 12       │ │
│ │ 10:38 AM │ SHIP     │ Coil #HRC-44890 │ 38,200 lbs │ SO-10245          │ │
│ │ 10:15 AM │ TRANSFER │ Coil #CRC-22104 │ 25,000 lbs │ WH-A → WH-B       │ │
│ │ 09:55 AM │ PROCESS  │ Coil #HRC-45102 │ Split 4x   │ WO-8821           │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SCREEN: Stock Search

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ INVENTORY > STOCK SEARCH                              [Export] [Print]     │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─ FILTERS ─────────────────────────────────────────────────────────────┐  │
│ │ Product: [All▼]  Grade: [A36▼]  Thick: [0.060-0.120]  Width: [36-48]  │  │
│ │ Location: [All▼] Status: [Available▼] Heat#: [________] Coil#: [____] │  │
│ │                                                        [Search] [Reset]│  │
│ └───────────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Found: 47 coils | 1,245,000 lbs available                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ □ │ COIL#      │ HEAT#   │ GRADE │ THICK  │ WIDTH │ WEIGHT  │ LOC   │ STS │
│ ──┼────────────┼─────────┼───────┼────────┼───────┼─────────┼───────┼─────│
│ □ │ HRC-45221  │ H89421  │ A36   │ 0.075" │ 48"   │ 42,500  │ A-12  │ ●   │
│ □ │ HRC-45198  │ H89421  │ A36   │ 0.075" │ 48"   │ 41,200  │ A-14  │ ●   │
│ □ │ HRC-45156  │ H89405  │ A36   │ 0.090" │ 42"   │ 38,800  │ B-03  │ ●   │
│ □ │ HRC-45089  │ H89388  │ A36   │ 0.105" │ 36"   │ 35,600  │ B-07  │ ○   │
│ □ │ HRC-45002  │ H89371  │ A36   │ 0.120" │ 48"   │ 44,100  │ C-01  │ ●   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Selected: 0 items | [Allocate] [Transfer] [Hold] [View MTR]                │
└─────────────────────────────────────────────────────────────────────────────┘

Legend: ● Available  ○ Allocated  ◐ Partial  ⊘ Hold
```

---

## SCREEN: Coil Detail

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ COIL DETAIL: HRC-45221                          [Edit] [Transfer] [Hold]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─ IDENTIFICATION ──────────────┐ ┌─ DIMENSIONS ────────────────────────┐  │
│ │ Coil#: HRC-45221              │ │ Thickness: 0.075" (14 ga)           │  │
│ │ Heat#: H89421                 │ │ Width: 48.000"                      │  │
│ │ Mill: ArcelorMittal Burns Hbr │ │ OD: 72"  ID: 24"                    │  │
│ │ Grade: A36                    │ │ Gross: 42,850 lbs                   │  │
│ │ Product: HR Coil              │ │ Net: 42,500 lbs                     │  │
│ └───────────────────────────────┘ └─────────────────────────────────────┘  │
│ ┌─ LOCATION & STATUS ───────────┐ ┌─ COSTING ───────────────────────────┐  │
│ │ Warehouse: Warehouse A        │ │ Unit Cost: $0.4125/lb               │  │
│ │ Bay: 12                       │ │ Landed Cost: $0.4285/lb             │  │
│ │ Status: Available             │ │ Total Value: $18,211.25             │  │
│ │ Days in Stock: 12             │ │ Last Cost: $0.4050/lb               │  │
│ │ QC Status: Passed             │ │ Source PO: PO-10892                 │  │
│ └───────────────────────────────┘ └─────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│ TABS: [Traceability] [Documents] [Movements] [Allocations] [QC History]    │
├─────────────────────────────────────────────────────────────────────────────┤
│ MOVEMENT HISTORY                                                            │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ DATE       │ TYPE     │ FROM      │ TO        │ QTY     │ REF          │ │
│ │ 01/16/26   │ Receive  │ -         │ A-12      │ 42,500  │ PO-10892     │ │
│ │ 01/04/26   │ Ship     │ Mill      │ Transit   │ 42,500  │ BOL-445521   │ │
│ │ 01/02/26   │ Produced │ -         │ Mill      │ 42,500  │ Heat H89421  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## WORKFLOW: Receiving

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  ARRIVE  │───▶│   SCAN   │───▶│  VERIFY  │───▶│  PUTAWAY │───▶│ COMPLETE │
│  AT DOCK │    │  BOL/PO  │    │  WEIGHT  │    │   ASSIGN │    │ RECEIVE  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │               │
     ▼               ▼               ▼               ▼               ▼
  Notify         Pull PO        Scale Ticket    Bin Location    Update Stock
  Receiver       Line Items     Variance Check  Print Tags      Trigger QC
```

---

## API ENDPOINTS

```
GET    /api/v1/inventory                    # Search stock
GET    /api/v1/inventory/{coil_id}          # Coil detail
POST   /api/v1/inventory/receive            # Receive material
POST   /api/v1/inventory/transfer           # Transfer location
POST   /api/v1/inventory/adjust             # Adjustment
POST   /api/v1/inventory/allocate           # Allocate to order
DELETE /api/v1/inventory/allocate/{id}      # Release allocation
GET    /api/v1/inventory/movements          # Movement history
GET    /api/v1/locations                    # Location list
```

---

## ALERTS & NOTIFICATIONS

| Trigger | Notification | Recipients |
|---------|--------------|------------|
| Stock below reorder point | Low Stock Alert | Purchasing |
| Material on hold > 24hrs | Hold Aging Alert | QC Manager |
| Coil in stock > 90 days | Slow Moving Alert | Sales, Mgmt |
| Receiving variance > 2% | Weight Variance | Receiving, AP |
