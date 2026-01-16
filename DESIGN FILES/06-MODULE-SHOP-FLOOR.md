# 06 - SHOP FLOOR & WORK ORDERS MODULE

## Module Overview
Processing operations, work order management, routing, BOM, and production tracking for service centers.

---

## FUNCTIONAL REQUIREMENTS

| ID | Requirement | Priority |
|----|-------------|----------|
| SF-01 | Create work orders from sales orders or stock | Critical |
| SF-02 | Define processing routes (slit, cut, blank) | Critical |
| SF-03 | Track parent-child coil relationships | Critical |
| SF-04 | Calculate and track yield/scrap | High |
| SF-05 | Operator tablet interface for shop floor | High |
| SF-06 | Equipment/line scheduling | High |
| SF-07 | Integration with QC checkpoints | High |

---

## SCREEN: Work Order Queue

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SHOP FLOOR > WORK ORDER QUEUE                           [+ New Work Order] │
├─────────────────────────────────────────────────────────────────────────────┤
│ Line: [All▼] Status: [Open▼] Priority: [All▼] Date: [Today▼]  [🔍 Search]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ WO#      │ TYPE   │ SOURCE COIL │ CUSTOMER    │ LINE   │ PRI │ STATUS  │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ WO-8856  │ Slit   │ HRC-45221   │ ABC Mfg     │ Slit-1 │ 🔴  │ Ready   │ │
│ │ WO-8855  │ CTL    │ HRC-45198   │ XYZ Steel   │ CTL-2  │ 🟡  │ Ready   │ │
│ │ WO-8854  │ Slit   │ CRC-22104   │ Stock       │ Slit-2 │ 🟢  │ Running │ │
│ │ WO-8853  │ Blank  │ GAL-18892   │ Metal Inc   │ Blank  │ 🟢  │ QC Hold │ │
│ │ WO-8852  │ CTL    │ HRC-45156   │ BuildCo     │ CTL-1  │ 🟢  │ Complete│ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ Showing 1-25 of 48 work orders                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SCREEN: Work Order Detail

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ WORK ORDER: WO-8856                           [Start] [Complete] [Cancel]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─ ORDER INFO ──────────────────┐ ┌─ SOURCE MATERIAL ───────────────────┐  │
│ │ Type: Slitting                │ │ Coil#: HRC-45221                    │  │
│ │ Status: Ready                 │ │ Heat#: H89421                       │  │
│ │ Priority: High 🔴             │ │ Grade: A36                          │  │
│ │ Line: Slitter-1               │ │ Input: 0.075" x 48" x 42,500 lbs    │  │
│ │ Sales Order: SO-10245         │ │ Location: WH-A Bay 12               │  │
│ │ Customer: ABC Manufacturing   │ │ QC Status: Passed ✓                 │  │
│ │ Required: 01/18/2026          │ │ MTR: Attached ✓                     │  │
│ └───────────────────────────────┘ └─────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│ SLITTING PATTERN                                                            │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │  INPUT: 48.000" Master Width                                            │ │
│ │  ┌────────────────────────────────────────────────────────────────────┐ │ │
│ │  │ 12.000" │ 12.000" │ 12.000" │ 10.500" │ 1.500" │                   │ │ │
│ │  │  Mult 1 │  Mult 2 │  Mult 3 │  Mult 4 │ SCRAP  │                   │ │ │
│ │  └────────────────────────────────────────────────────────────────────┘ │ │
│ │  Yield: 96.9%  |  Scrap: 3.1% (1,317 lbs est.)                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ OUTPUT COILS (Expected)                                                     │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ LINE │ WIDTH   │ EST WEIGHT │ DEST     │ NEW COIL#  │ STATUS           │ │
│ │ 1    │ 12.000" │ 10,562 lbs │ SO-10245 │ (pending)  │ ○ Pending        │ │
│ │ 2    │ 12.000" │ 10,562 lbs │ SO-10245 │ (pending)  │ ○ Pending        │ │
│ │ 3    │ 12.000" │ 10,562 lbs │ Stock    │ (pending)  │ ○ Pending        │ │
│ │ 4    │ 10.500" │  9,241 lbs │ Stock    │ (pending)  │ ○ Pending        │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SCREEN: Operator Tablet (Shop Floor)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SLITTER-1                                              Operator: J. Smith  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    CURRENT JOB: WO-8856                              │   │
│  │                                                                      │   │
│  │    Source: HRC-45221  │  Grade: A36  │  0.075" x 48"                │   │
│  │                                                                      │   │
│  │    Pattern: 12" + 12" + 12" + 10.5" (4 mults)                       │   │
│  │                                                                      │   │
│  │    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │   │
│  │    │   INPUT WT  │  │  OUTPUT WT  │  │    YIELD    │                │   │
│  │    │  42,500 lbs │  │  41,200 lbs │  │    96.9%    │                │   │
│  │    └─────────────┘  └─────────────┘  └─────────────┘                │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │                  │  │                  │  │                  │          │
│  │   [SCAN COIL]    │  │  [RECORD OUTPUT] │  │  [COMPLETE JOB]  │          │
│  │                  │  │                  │  │                  │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                                │
│  │   [SCRAP ENTRY]  │  │  [QUALITY HOLD]  │                                │
│  └──────────────────┘  └──────────────────┘                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## WORKFLOW: Processing

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  CREATE  │──▶│  STAGE   │──▶│  START   │──▶│ COMPLETE │──▶│ QC CHECK │
│    WO    │   │ MATERIAL │   │ PROCESS  │   │  OUTPUT  │   │ & PUTAWAY│
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
     │              │              │              │              │
     ▼              ▼              ▼              ▼              ▼
 From SO/Stock  Scan Source    Operator UI   Weigh Outputs  Assign Bins
 Set Pattern    Verify MTR     Track Time    New Coil IDs   Update Stock
 Assign Line    Move to Line   Scrap Entry   Parent-Child   Allocate
```

---

## DATA MODEL ADDITIONS

```
WORK_ORDER
├── work_order_id (PK)
├── wo_number
├── wo_type (SLIT, CTL, BLANK, LEVELCUT, MULTIBLANKING)
├── status (DRAFT, READY, IN_PROGRESS, QC_HOLD, COMPLETE, CANCELLED)
├── source_coil_id (FK → Coil)
├── line_id (FK → Equipment)
├── sales_order_id (FK → Order)
├── priority (1-5)
├── scheduled_date
├── started_at
├── completed_at
├── operator_id (FK → User)
└── routing_id (FK → Routing)

WORK_ORDER_OUTPUT
├── output_id (PK)
├── work_order_id (FK)
├── output_coil_id (FK → Coil - new child)
├── sequence
├── target_width
├── actual_width
├── actual_weight
└── destination (STOCK, ORDER, SCRAP)
```

---

## YIELD CALCULATIONS

| Metric | Formula |
|--------|---------|
| Gross Yield | Output Weight / Input Weight × 100 |
| Sellable Yield | (Output - Scrap - Offal) / Input × 100 |
| Target Yield | Based on historical average by product/line |
| Variance | Actual Yield - Target Yield |
