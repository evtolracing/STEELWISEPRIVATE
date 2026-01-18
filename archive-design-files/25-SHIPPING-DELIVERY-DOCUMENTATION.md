# Phase 8: Shipping, Delivery & Documentation

**Document Version:** 1.0  
**Date:** January 17, 2026  
**Status:** Outbound Logistics Specification

---

## 1. EXECUTIVE SUMMARY

This document defines the complete outbound logistics workflow from packaging through delivery confirmation and billing trigger. It covers physical handling, documentation generation, carrier management, and customer communication.

**Core Objectives:**
- **Zero-Error Documentation** - Right paperwork, right shipment, every time
- **Visibility** - Real-time tracking for internal teams and customers
- **Compliance** - Meet all regulatory, customer, and carrier requirements
- **Efficiency** - Minimize dock time, maximize truck utilization

---

## 2. OUTBOUND WORKFLOW TIMELINE

### 2.1 End-to-End Process Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         OUTBOUND LOGISTICS TIMELINE                                      │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  PROCESSING          PACKAGING           STAGING          LOADING         DELIVERY     │
│  COMPLETE            & LABELING          & DOCS           & SHIP          & CONFIRM    │
│      │                   │                  │                │                │        │
│      ▼                   ▼                  ▼                ▼                ▼        │
│  ┌───────┐          ┌───────┐          ┌───────┐        ┌───────┐        ┌───────┐    │
│  │       │          │       │          │       │        │       │        │       │    │
│  │ QC    │──────────│ PACK  │──────────│ STAGE │────────│ LOAD  │────────│DELIVER│    │
│  │ PASS  │          │       │          │       │        │       │        │       │    │
│  │       │          │       │          │       │        │       │        │       │    │
│  └───────┘          └───────┘          └───────┘        └───────┘        └───────┘    │
│      │                   │                  │                │                │        │
│      │                   │                  │                │                │        │
│  Triggers:           Triggers:          Triggers:        Triggers:        Triggers:   │
│  • Move to pack     • Generate         • Reserve        • Driver         • POD        │
│    queue              labels             dock door        sign-out        capture     │
│  • Notify           • Bundle           • Generate       • Photo          • Customer   │
│    packaging          creation           BOL              capture          sign       │
│  • Allocate         • Weight           • Notify         • GPS            • Notify     │
│    to shipment        capture            carrier          track            billing    │
│                     • Banding/         • Customer       • Depart         • Close      │
│                       wrapping           notify           time             order      │
│                                                                                        │
│  ─────────────────────────────────────────────────────────────────────────────────── │
│  TIME:    T-4 hrs        T-3 hrs         T-2 hrs         T-0           T+2 to T+8    │
│           (variable)     (30-60 min)     (30 min)        (Load)        (Delivery)    │
│                                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 State Machine

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SHIPMENT STATE MACHINE                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                     ┌──────────────┐                                │
│                     │   PENDING    │                                │
│                     │  PACKAGING   │                                │
│                     └──────┬───────┘                                │
│                            │ All items complete                     │
│                            ▼                                        │
│                     ┌──────────────┐                                │
│                     │  PACKAGING   │ ←──────────┐                   │
│                     │  IN PROGRESS │            │ Add items         │
│                     └──────┬───────┘            │                   │
│                            │ Packaging complete │                   │
│                            ▼                    │                   │
│                     ┌──────────────┐            │                   │
│                     │   STAGED     │────────────┘                   │
│                     │              │                                │
│                     └──────┬───────┘                                │
│                            │ Docs complete + Carrier assigned       │
│                            ▼                                        │
│                     ┌──────────────┐                                │
│                     │    READY     │                                │
│                     │   TO SHIP    │                                │
│                     └──────┬───────┘                                │
│                            │ Driver checked in                      │
│                            ▼                                        │
│                     ┌──────────────┐                                │
│                     │   LOADING    │                                │
│                     │              │                                │
│                     └──────┬───────┘                                │
│                            │ Load complete + Driver sign-out        │
│                            ▼                                        │
│                     ┌──────────────┐                                │
│                     │   SHIPPED    │                                │
│                     │  (In Transit)│                                │
│                     └──────┬───────┘                                │
│          ┌─────────────────┼─────────────────┐                      │
│          │                 │                 │                      │
│          ▼                 ▼                 ▼                      │
│   ┌────────────┐   ┌────────────┐   ┌────────────┐                 │
│   │ DELIVERED  │   │  PARTIAL   │   │  REFUSED   │                 │
│   │            │   │  DELIVERY  │   │            │                 │
│   └──────┬─────┘   └──────┬─────┘   └──────┬─────┘                 │
│          │                │                │                        │
│          ▼                ▼                ▼                        │
│   ┌────────────┐   ┌────────────┐   ┌────────────┐                 │
│   │ CONFIRMED  │   │  RESOLVE   │   │  RETURN    │                 │
│   │ → BILLING  │   │  ISSUE     │   │  PROCESS   │                 │
│   └────────────┘   └────────────┘   └────────────┘                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. PACKAGING & BUNDLE CREATION

### 3.1 Packaging Queue Screen

```
┌─────────────────────────────────────────────────────────────────────┐
│ ████ PACKAGING QUEUE                               PACK-STATION-01  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                     │
│  READY TO PACK                                           12 jobs   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │ ┌─────────────────────────────────────────────────────────┐ │   │
│  │ │ 🔴 SHIP TODAY 2:00 PM                                   │ │   │
│  │ │ ─────────────────────────────────────────────────────── │ │   │
│  │ │ J-2450  │ ACME Corp  │ 3 items │ 847 lbs │ WILL-CALL   │ │   │
│  │ │ Location: QC-COMPLETE-01                                │ │   │
│  │ │ Items: 1" Round (12 pc), Plate parts (25 pc), Bolts    │ │   │
│  │ │ Special: Customer picking up - have certs ready         │ │   │
│  │ │                                         [▶️ START PACK] │ │   │
│  │ └─────────────────────────────────────────────────────────┘ │   │
│  │                                                             │   │
│  │ ┌─────────────────────────────────────────────────────────┐ │   │
│  │ │ 🟡 SHIP TODAY 4:00 PM                                   │ │   │
│  │ │ ─────────────────────────────────────────────────────── │ │   │
│  │ │ J-2455  │ Beta Ind   │ 1 item  │ 2,450 lbs│ LTL        │ │   │
│  │ │ Location: SAW-COMPLETE-02                               │ │   │
│  │ │ Items: 3" Round 4140 (25 pcs × 48")                     │ │   │
│  │ │ Special: Band every 5 pieces, dunnage required          │ │   │
│  │ │                                         [▶️ START PACK] │ │   │
│  │ └─────────────────────────────────────────────────────────┘ │   │
│  │                                                             │   │
│  │ ┌─────────────────────────────────────────────────────────┐ │   │
│  │ │ 🟢 SHIP TOMORROW                                        │ │   │
│  │ │ ─────────────────────────────────────────────────────── │ │   │
│  │ │ J-2460  │ Gamma LLC  │ 5 items │ 450 lbs │ OUR TRUCK   │ │   │
│  │ │ Location: LASER-COMPLETE-01                             │ │   │
│  │ │ Items: Laser cut parts per drawing (5 different shapes) │ │   │
│  │ │ Special: Interleave with paper, fragile edges           │ │   │
│  │ │                                         [▶️ START PACK] │ │   │
│  │ └─────────────────────────────────────────────────────────┘ │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  IN PROGRESS                                             2 jobs    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ J-2448 │ Mike J. │ Started 10:15 AM │ 60% complete         │   │
│  │ J-2451 │ Sarah M.│ Started 10:45 AM │ 30% complete         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Active Packaging Screen

```
┌─────────────────────────────────────────────────────────────────────┐
│ ████ PACKAGING: J-2450                              PACK-STATION-01 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                     │
│  Customer: ACME Corporation          Ship Method: WILL-CALL        │
│  Ship Date: TODAY 2:00 PM            Total Weight: 847 lbs         │
│                                                                     │
│  ITEMS TO PACK                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ #  │ Item                        │ Qty  │ Status   │ Pkg   │   │
│  │────│─────────────────────────────│──────│──────────│───────│   │
│  │ 1  │ 1" HR Round A36 × 36"       │ 12 pc│ ✓ Packed │ BDL-1 │   │
│  │ 2  │ 1/2" Plate parts DWG-1234   │ 25 pc│ ⏳ Packing│ BDL-2 │   │
│  │ 3  │ 3/4-10 × 2" Hex Bolts       │ 48 ea│ ○ Pending│       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  CURRENT ITEM: 1/2" Plate parts DWG-1234                    │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │                                                             │   │
│  │  Quantity: 25 pieces (5 shapes × 5 each)                   │   │
│  │  Weight: 589 lbs                                            │   │
│  │  Location: LASER-COMPLETE-01, Bin C                         │   │
│  │                                                             │   │
│  │  PACKAGING INSTRUCTIONS:                                    │   │
│  │  ┌───────────────────────────────────────────────────────┐  │   │
│  │  │ ⚠️ FRAGILE EDGES                                      │  │   │
│  │  │ • Interleave pieces with kraft paper                  │  │   │
│  │  │ • Stack max 5 high                                    │  │   │
│  │  │ • Band bundle with corner protectors                  │  │   │
│  │  └───────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  SCAN/COUNT:                                                │   │
│  │  Scanned: [23 / 25] pieces                                 │   │
│  │  🔊 Scan remaining 2 pieces or enter count                 │   │
│  │                                                             │   │
│  │  [📷 PHOTO]    [⚖️ WEIGH]    [🏷️ PRINT LABEL]             │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  BUNDLE SUMMARY                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ BDL-1: 12 × 36" Round bars, banded    │ 258 lbs │ ✓ Label  │   │
│  │ BDL-2: Plate parts (in progress)      │ 589 lbs │ ○ Label  │   │
│  │ BDL-3: (pending)                      │         │          │   │
│  │ ────────────────────────────────────────────────────────── │   │
│  │ Packaging materials: Kraft paper (5 sheets), Steel bands   │   │
│  │                      Corner protectors (8), Dunnage        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [◀ BACK]  [⏸️ PAUSE]       [REPORT ISSUE]      [✓ COMPLETE ITEM] │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Bundle Definition

```
┌─────────────────────────────────────────────────────────────────────┐
│                    📦 CREATE BUNDLE                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                     │
│  Job: J-2450  │  Item: 1" HR Round A36 × 36" (12 pcs)              │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  BUNDLE TYPE                                                │   │
│  │                                                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │   │
│  │  │              │  │              │  │              │      │   │
│  │  │ 🔗 BANDED    │  │ 📦 BOXED     │  │ 🎁 WRAPPED   │      │   │
│  │  │   BUNDLE     │  │              │  │   (Shrink)   │      │   │
│  │  │      ●       │  │      ○       │  │      ○       │      │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │   │
│  │                                                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │   │
│  │  │              │  │              │  │              │      │   │
│  │  │ 🎯 PALLETIZED│  │ 🚛 LOOSE     │  │ 📋 CRATED    │      │   │
│  │  │              │  │   (Truck bed)│  │              │      │   │
│  │  │      ○       │  │      ○       │  │      ○       │      │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  BUNDLE DETAILS                                             │   │
│  │                                                             │   │
│  │  Pieces in bundle: [ 12      ]  (max recommended: 20)       │   │
│  │                                                             │   │
│  │  Band locations:   ☑️ Both ends (6" from edge)              │   │
│  │                    ☑️ Center                                │   │
│  │                    ☐ Additional bands                       │   │
│  │                                                             │   │
│  │  Tag location:     ● End     ○ Center     ○ Both ends      │   │
│  │                                                             │   │
│  │  Dunnage:          ☐ Wood blocks   ☐ Foam   ☑️ None         │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  DIMENSIONS & WEIGHT                                        │   │
│  │                                                             │   │
│  │  Calculated:   36" L × 5" W × 5" H   │   258 lbs            │   │
│  │                                                             │   │
│  │  ☐ Override with actual measurement                        │   │
│  │  Actual: [ L    ] × [ W    ] × [ H    ] │ [Weight    ] lbs  │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                 🏷️ CREATE BUNDLE + PRINT LABEL              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.4 Packaging Standards Matrix

| Package Type | Material Type | Max Weight | Method | Labels |
|--------------|---------------|------------|--------|--------|
| **Banded Bundle** | Bars, tubes | 2,500 lbs | Steel bands, 3 per bundle | End tag |
| **Boxed** | Small parts, hardware | 50 lbs | Cardboard, tape seal | Box label |
| **Shrink Wrapped** | Sheet, plate | 1,000 lbs | Pallet + shrink wrap | Side label |
| **Palletized** | Mixed | 2,500 lbs | Pallet + banding | Pallet tag |
| **Crated** | Fragile, large | 5,000 lbs | Wood crate | Crate stencil |
| **Loose** | Long bars, beams | No limit | Dunnage in truck | Tag each piece |

---

## 4. DOCUMENT TEMPLATES

### 4.1 Bill of Lading (BOL)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    BILL OF LADING                             │ │
│  │                    ══════════════                             │ │
│  │                                                               │ │
│  │  BOL #: BOL-2026-04521          Date: January 17, 2026        │ │
│  │  PRO #: _______________         Page: 1 of 1                  │ │
│  │                                                               │ │
│  │  ════════════════════════════════════════════════════════════ │ │
│  │                                                               │ │
│  │  SHIPPER:                       CONSIGNEE:                    │ │
│  │  ─────────                      ──────────                    │ │
│  │  SteelWise Distribution         ACME Corporation              │ │
│  │  1234 Industrial Blvd           5678 Manufacturing Way        │ │
│  │  Houston, TX 77001              Dallas, TX 75001              │ │
│  │  Phone: (713) 555-1234          Phone: (214) 555-5678         │ │
│  │                                 Contact: John Smith           │ │
│  │                                                               │ │
│  │  ════════════════════════════════════════════════════════════ │ │
│  │                                                               │ │
│  │  CARRIER:                       THIRD PARTY BILLING:          │ │
│  │  ────────                       ────────────────────          │ │
│  │  FastFreight LTL                ☐ Prepaid  ☑️ Collect         │ │
│  │  MC# 123456                     ☐ Third Party:                │ │
│  │  Driver: _______________        _________________________     │ │
│  │  Truck#: _______________                                      │ │
│  │                                                               │ │
│  │  ════════════════════════════════════════════════════════════ │ │
│  │                                                               │ │
│  │  SHIPMENT DETAILS:                                            │ │
│  │  ─────────────────                                            │ │
│  │  │ Qty │ Type  │ Description              │ Weight │ Class │  │ │
│  │  │─────│───────│──────────────────────────│────────│───────│  │ │
│  │  │  1  │ BUNDLE│ Steel Round Bar 1"×36"   │ 258 lbs│  65   │  │ │
│  │  │     │       │ 12 pieces, banded        │        │       │  │ │
│  │  │─────│───────│──────────────────────────│────────│───────│  │ │
│  │  │  1  │ BUNDLE│ Steel Plate Parts        │ 589 lbs│  65   │  │ │
│  │  │     │       │ 25 pieces, wrapped       │        │       │  │ │
│  │  │─────│───────│──────────────────────────│────────│───────│  │ │
│  │  │  1  │ BOX   │ Hex Bolts 3/4-10×2"     │  12 lbs│  70   │  │ │
│  │  │     │       │ 48 pieces               │        │       │  │ │
│  │  │═════│═══════│══════════════════════════│════════│═══════│  │ │
│  │  │  3  │ TOTAL │                          │ 859 lbs│       │  │ │
│  │                                                               │ │
│  │  ════════════════════════════════════════════════════════════ │ │
│  │                                                               │ │
│  │  SPECIAL INSTRUCTIONS:                                        │ │
│  │  ☑️ Inside Delivery    ☐ Liftgate Required    ☐ Call Before   │ │
│  │  ☐ Appointment Required    ☑️ Signature Required              │ │
│  │                                                               │ │
│  │  Notes: Deliver to receiving dock, Door 3                     │ │
│  │                                                               │ │
│  │  ════════════════════════════════════════════════════════════ │ │
│  │                                                               │ │
│  │  Customer PO#: PO-78543         Our Order#: ORD-2026-04125   │ │
│  │                                                               │ │
│  │  ════════════════════════════════════════════════════════════ │ │
│  │                                                               │ │
│  │  SHIPPER SIGNATURE:             CARRIER SIGNATURE:            │ │
│  │                                                               │ │
│  │  _________________________      _________________________     │ │
│  │  Name:                          Name:                         │ │
│  │  Date:                          Date:                         │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Packing List

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                      PACKING LIST                             │ │
│  │                      ════════════                             │ │
│  │                                                               │ │
│  │  Order #: ORD-2026-04125        Date: January 17, 2026        │ │
│  │  Job #: J-2450                  Pack List #: PL-04521         │ │
│  │                                                               │ │
│  │  ════════════════════════════════════════════════════════════ │ │
│  │                                                               │ │
│  │  SHIP TO:                       SOLD TO:                      │ │
│  │  ────────                       ────────                      │ │
│  │  ACME Corporation               ACME Corporation              │ │
│  │  5678 Manufacturing Way         5678 Manufacturing Way        │ │
│  │  Dallas, TX 75001               Dallas, TX 75001              │ │
│  │  Attn: John Smith               Account #: ACME-001           │ │
│  │                                                               │ │
│  │  ════════════════════════════════════════════════════════════ │ │
│  │                                                               │ │
│  │  LINE ITEMS:                                                  │ │
│  │  ───────────                                                  │ │
│  │                                                               │ │
│  │  Line 1: 1" HR Round Bar A36                                  │ │
│  │  ────────────────────────────────────────────────────────     │ │
│  │  Ordered: 12 pcs × 36"    Shipped: 12 pcs × 36"   B/O: 0     │ │
│  │  Heat #: H-78543          MTR: Attached                       │ │
│  │  Package: BDL-1 (Banded bundle, 258 lbs)                      │ │
│  │                                                               │ │
│  │  Line 2: 1/2" A36 Plate - Laser Cut Parts per DWG-1234       │ │
│  │  ────────────────────────────────────────────────────────     │ │
│  │  Ordered: 25 pcs          Shipped: 25 pcs         B/O: 0     │ │
│  │  Shapes: A (5), B (5), C (5), D (5), E (5)                    │ │
│  │  Heat #: H-77654          MTR: Attached                       │ │
│  │  Package: BDL-2 (Wrapped bundle, 589 lbs)                     │ │
│  │  QC Report: FAI-2450-001 attached                             │ │
│  │                                                               │ │
│  │  Line 3: 3/4-10 × 2" Hex Bolt Grade 5                        │ │
│  │  ────────────────────────────────────────────────────────     │ │
│  │  Ordered: 48 ea           Shipped: 48 ea          B/O: 0     │ │
│  │  Package: BOX-1 (Cardboard box, 12 lbs)                       │ │
│  │                                                               │ │
│  │  ════════════════════════════════════════════════════════════ │ │
│  │                                                               │ │
│  │  PACKAGE SUMMARY:                                             │ │
│  │  ────────────────                                             │ │
│  │  │ Package │ Contents           │ Dimensions    │ Weight   │  │ │
│  │  │─────────│────────────────────│───────────────│──────────│  │ │
│  │  │ BDL-1   │ Line 1 - Round bar │ 36"×5"×5"     │ 258 lbs  │  │ │
│  │  │ BDL-2   │ Line 2 - Plate     │ 24"×36"×12"   │ 589 lbs  │  │ │
│  │  │ BOX-1   │ Line 3 - Bolts     │ 12"×8"×6"     │ 12 lbs   │  │ │
│  │  │═════════│════════════════════│═══════════════│══════════│  │ │
│  │  │ TOTAL   │ 3 packages         │               │ 859 lbs  │  │ │
│  │                                                               │ │
│  │  ════════════════════════════════════════════════════════════ │ │
│  │                                                               │ │
│  │  DOCUMENTS INCLUDED:     ☑️ MTR (2)    ☑️ COC    ☑️ FAI      │ │
│  │                                                               │ │
│  │  Packed By: Sarah M.            Verified By: Mike J.          │ │
│  │  Date/Time: 01/17/2026 11:30 AM                               │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.3 Shipping Label

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌────────────────────────────────────┐                            │
│  │                                    │   ┌────────────────────┐   │
│  │   FROM:                            │   │                    │   │
│  │   SteelWise Distribution           │   │   ██████████████   │   │
│  │   1234 Industrial Blvd             │   │   ██  BARCODE  ██   │   │
│  │   Houston, TX 77001                │   │   ██████████████   │   │
│  │                                    │   │                    │   │
│  │   ──────────────────────────────── │   │ PKG: BDL-1         │   │
│  │                                    │   │ 1 OF 3             │   │
│  │   ████████████████████████████████ │   └────────────────────┘   │
│  │   ██                            ██ │                            │
│  │   ██   ACME CORPORATION         ██ │   ORDER: ORD-2026-04125   │
│  │   ██   5678 MANUFACTURING WAY   ██ │   PO: PO-78543            │
│  │   ██   DALLAS, TX 75001         ██ │   BOL: BOL-2026-04521     │
│  │   ██   ATTN: JOHN SMITH         ██ │                            │
│  │   ██                            ██ │   WEIGHT: 258 LBS         │
│  │   ████████████████████████████████ │   PIECES: 12              │
│  │                                    │                            │
│  │   ──────────────────────────────── │   ┌────────────────────┐   │
│  │                                    │   │                    │   │
│  │   CONTENTS:                        │   │  ⚠️  HEAVY         │   │
│  │   1" HR ROUND BAR A36              │   │     STEEL          │   │
│  │   12 PCS × 36"                     │   │                    │   │
│  │   HEAT#: H-78543                   │   └────────────────────┘   │
│  │                                    │                            │
│  └────────────────────────────────────┘                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.4 Certificate of Conformance (COC)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │              CERTIFICATE OF CONFORMANCE                       │ │
│  │              ══════════════════════════                       │ │
│  │                                                               │ │
│  │  Certificate #: COC-2026-04521      Date: January 17, 2026    │ │
│  │                                                               │ │
│  │  ════════════════════════════════════════════════════════════ │ │
│  │                                                               │ │
│  │  CUSTOMER INFORMATION:                                        │ │
│  │  ─────────────────────                                        │ │
│  │  Customer: ACME Corporation                                   │ │
│  │  PO Number: PO-78543                                          │ │
│  │  Order Number: ORD-2026-04125                                 │ │
│  │                                                               │ │
│  │  ════════════════════════════════════════════════════════════ │ │
│  │                                                               │ │
│  │  MATERIAL CERTIFICATION:                                      │ │
│  │  ───────────────────────                                      │ │
│  │                                                               │ │
│  │  SteelWise Distribution hereby certifies that the material   │ │
│  │  described below conforms to the specifications stated:       │ │
│  │                                                               │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │ Item          │ Specification │ Heat #   │ Country      │ │ │
│  │  │───────────────│───────────────│──────────│──────────────│ │ │
│  │  │ 1" Round Bar  │ ASTM A36      │ H-78543  │ USA          │ │ │
│  │  │ 1/2" Plate    │ ASTM A36      │ H-77654  │ USA          │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  │                                                               │ │
│  │  ════════════════════════════════════════════════════════════ │ │
│  │                                                               │ │
│  │  COMPLIANCE STATEMENTS:                                       │ │
│  │  ──────────────────────                                       │ │
│  │                                                               │ │
│  │  ☑️ Material meets or exceeds specification requirements      │ │
│  │  ☑️ Mill Test Reports (MTR) attached                          │ │
│  │  ☑️ Material is domestic melt and manufacture (DFARS)         │ │
│  │  ☑️ RoHS Compliant                                            │ │
│  │  ☑️ Conflict Mineral Free                                     │ │
│  │                                                               │ │
│  │  ════════════════════════════════════════════════════════════ │ │
│  │                                                               │ │
│  │  PROCESSING CERTIFICATION:                                    │ │
│  │  ─────────────────────────                                    │ │
│  │                                                               │ │
│  │  All processing operations were performed in accordance       │ │
│  │  with SteelWise quality procedures and customer requirements. │ │
│  │                                                               │ │
│  │  ════════════════════════════════════════════════════════════ │ │
│  │                                                               │ │
│  │  AUTHORIZED SIGNATURE:                                        │ │
│  │                                                               │ │
│  │  _______________________          _______________________     │ │
│  │  Quality Manager                  Date                        │ │
│  │  SteelWise Distribution                                       │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.5 Document Generation Matrix

| Document | Trigger | Auto/Manual | Copies | Destination |
|----------|---------|-------------|--------|-------------|
| **BOL** | Stage complete | Auto | 3 | Driver, Office, Customer |
| **Packing List** | Pack complete | Auto | 2 | Package, Office |
| **Shipping Label** | Bundle created | Auto | 1 per pkg | On package |
| **COC** | Order requires | Auto | 1 | With shipment |
| **MTR** | Material has cert | Auto | Per heat | With shipment |
| **Invoice** | Delivery confirm | Auto | 1 | Email/Mail |
| **POD** | Delivery complete | Capture | 1 | Archive |
| **Customs Docs** | International | Manual | Per regs | With shipment |

---

## 5. STAGING & DOCK MANAGEMENT

### 5.1 Staging Area Screen

```
┌─────────────────────────────────────────────────────────────────────┐
│ ████ STAGING AREA                                     DOCK MANAGER  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                     │
│  DOCK LAYOUT                                          4 Doors      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │   DOOR 1         DOOR 2         DOOR 3         DOOR 4       │   │
│  │  ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐      │   │
│  │  │ 🚛     │    │ 🟢     │    │ 📦📦📦 │    │ 🟢     │      │   │
│  │  │LOADING │    │ OPEN   │    │ STAGED │    │ OPEN   │      │   │
│  │  │        │    │        │    │        │    │        │      │   │
│  │  │J-2445  │    │        │    │J-2450  │    │        │      │   │
│  │  │FastFrt │    │        │    │J-2455  │    │        │      │   │
│  │  └────────┘    └────────┘    └────────┘    └────────┘      │   │
│  │                                                             │   │
│  │  ─────────────── STAGING LANES ───────────────────────────  │   │
│  │                                                             │   │
│  │  LANE A          LANE B          LANE C          LANE D     │   │
│  │  ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐      │   │
│  │  │ J-2460 │    │ J-2462 │    │ J-2463 │    │        │      │   │
│  │  │ 450 lbs│    │ 1,200  │    │ 3,500  │    │ EMPTY  │      │   │
│  │  │ TOM AM │    │ TOM PM │    │ TOM PM │    │        │      │   │
│  │  └────────┘    └────────┘    └────────┘    └────────┘      │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  TODAY'S SHIPMENTS                           Ship by: 5:00 PM      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ TIME  │ ORDER   │ CUSTOMER    │ METHOD  │ STATUS  │ DOOR   │   │
│  │───────│─────────│─────────────│─────────│─────────│────────│   │
│  │ 11:00 │ J-2445  │ Delta Corp  │ LTL     │ LOADING │ DOOR 1 │   │
│  │ 14:00 │ J-2450  │ ACME Corp   │ WILL-CL │ STAGED  │ DOOR 3 │   │
│  │ 15:00 │ J-2455  │ Beta Ind    │ LTL     │ STAGED  │ DOOR 3 │   │
│  │ 16:00 │ J-2460  │ Gamma LLC   │ OUR TRK │ STAGED  │ LANE A │   │
│  │ 16:30 │ J-2462  │ Epsilon Inc │ FTL     │ STAGED  │ LANE B │   │
│  │ 17:00 │ J-2463  │ Zeta Co     │ FTL     │ PACKED  │ LANE C │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [📋 Print Dock Schedule]  [🚛 Carrier Check-in]  [📦 Move to Door] │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Stage Assignment

```
┌─────────────────────────────────────────────────────────────────────┐
│                    📍 ASSIGN STAGING LOCATION                       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                     │
│  Order: J-2450  │  Customer: ACME Corporation                      │
│  Ship Time: 2:00 PM  │  Method: WILL-CALL                          │
│  Packages: 3  │  Total Weight: 859 lbs                             │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  AVAILABLE LOCATIONS                                        │   │
│  │                                                             │   │
│  │  DOCK DOORS (for immediate loading):                        │   │
│  │  ┌───────────────────────────────────────────────────────┐  │   │
│  │  │ ○ DOOR 1  │ 🔴 In use (J-2445, loading)               │  │   │
│  │  │ ● DOOR 2  │ 🟢 Available                              │  │   │
│  │  │ ○ DOOR 3  │ 🟡 Reserved 3:00 PM (FastFreight)         │  │   │
│  │  │ ● DOOR 4  │ 🟢 Available                              │  │   │
│  │  └───────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  │  STAGING LANES (for holding until pickup):                  │   │
│  │  ┌───────────────────────────────────────────────────────┐  │   │
│  │  │ ○ LANE A  │ 🔴 J-2460 (450 lbs, Tomorrow AM)          │  │   │
│  │  │ ● LANE B  │ 🟢 Available (capacity: 5,000 lbs)        │  │   │
│  │  │ ○ LANE C  │ 🔴 J-2463 (3,500 lbs, Tomorrow PM)        │  │   │
│  │  │ ● LANE D  │ 🟢 Available (capacity: 5,000 lbs)        │  │   │
│  │  └───────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  SELECTED: DOOR 3 (Will-call, customer drives to door)             │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  ✓ CONFIRM STAGING LOCATION                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ⚡ This will:                                                      │
│  • Reserve DOOR 3 for 2:00 PM pickup                               │
│  • Print staging tickets for packages                              │
│  • Notify customer order is ready                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. TRUCK ASSIGNMENT & CARRIER MANAGEMENT

### 6.1 Carrier Selection Screen

```
┌─────────────────────────────────────────────────────────────────────┐
│ ████ CARRIER ASSIGNMENT                          Order: J-2455      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                     │
│  SHIPMENT DETAILS                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Destination: Dallas, TX 75001  │  Distance: 245 miles       │   │
│  │ Weight: 2,450 lbs  │  Packages: 1 bundle  │  Class: 65      │   │
│  │ Dimensions: 48" × 8" × 8"  │  Stackable: No                 │   │
│  │ Required Delivery: Jan 20, 2026                              │   │
│  │ Special: Flatbed required, lift equipment needed             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  CARRIER OPTIONS                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │ ⭐ RECOMMENDED                                       │    │   │
│  │  │ ─────────────────────────────────────────────────── │    │   │
│  │  │ 🚛 FASTFREIGHT LTL                                  │    │   │
│  │  │                                                     │    │   │
│  │  │ Rate: $185.00      Transit: 1 day     On-time: 98% │    │   │
│  │  │ Pickup: Today 4:00 PM                               │    │   │
│  │  │ Delivery: Tomorrow by 5:00 PM                       │    │   │
│  │  │ Equipment: ✓ Flatbed available                      │    │   │
│  │  │                                        [ SELECT ]   │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  │                                                             │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │ 🚛 QUICKSHIP EXPRESS                                │    │   │
│  │  │                                                     │    │   │
│  │  │ Rate: $225.00      Transit: 1 day     On-time: 95% │    │   │
│  │  │ Pickup: Today 3:00 PM                               │    │   │
│  │  │ Delivery: Tomorrow by 12:00 PM                      │    │   │
│  │  │ Equipment: ✓ Flatbed available                      │    │   │
│  │  │                                        [ SELECT ]   │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  │                                                             │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │ 🚛 OUR TRUCK (Route: DALLAS-01)                     │    │   │
│  │  │                                                     │    │   │
│  │  │ Rate: $95.00 (internal)  Transit: 1 day  Cap: 60%  │    │   │
│  │  │ Departure: Tomorrow 6:00 AM                         │    │   │
│  │  │ Delivery: Tomorrow 10:00 AM - 2:00 PM               │    │   │
│  │  │ ⚠️ Adds to existing route (3 stops)                 │    │   │
│  │  │                                        [ SELECT ]   │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [Request More Quotes]  [Manual Entry]  [Customer Pickup]          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Own Fleet Management

```
┌─────────────────────────────────────────────────────────────────────┐
│ ████ FLEET DISPATCH                                  Jan 17, 2026   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                     │
│  ROUTES - TOMORROW                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │  ROUTE: DALLAS-01                              TRUCK: T-05  │   │
│  │  Driver: Mike Rodriguez     │     Capacity: 12,000 lbs     │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │                                                             │   │
│  │  ┌─────┬───────────────────────────────────────┬──────────┐ │   │
│  │  │ SEQ │ STOP                                  │ WEIGHT   │ │   │
│  │  │─────│───────────────────────────────────────│──────────│ │   │
│  │  │  1  │ Gamma LLC - 1234 Main St, Dallas      │ 450 lbs  │ │   │
│  │  │     │ J-2460 │ 8:00-10:00 AM │ Sig Req      │          │ │   │
│  │  │─────│───────────────────────────────────────│──────────│ │   │
│  │  │  2  │ Beta Ind - 5678 Industrial, Irving    │ 2,450 lbs│ │   │
│  │  │     │ J-2455 │ 10:30-12:00 PM │ Forklift    │          │ │   │
│  │  │─────│───────────────────────────────────────│──────────│ │   │
│  │  │  3  │ Epsilon Inc - 9012 Commerce, Plano    │ 1,200 lbs│ │   │
│  │  │     │ J-2462 │ 1:00-3:00 PM │ Dock          │          │ │   │
│  │  │═════│═══════════════════════════════════════│══════════│ │   │
│  │  │     │ TOTAL                                 │ 4,100 lbs│ │   │
│  │  │     │ Capacity Used: 34%                    │          │ │   │
│  │  └─────┴───────────────────────────────────────┴──────────┘ │   │
│  │                                                             │   │
│  │  [+ Add Stop]  [Optimize Route]  [Print Manifest]  [GPS Map]│   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ROUTE: HOUSTON-LOCAL                          TRUCK: T-02  │   │
│  │  Driver: Sarah Johnson      │     Capacity: 8,000 lbs      │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  Stops: 5  │  Weight: 6,200 lbs  │  Capacity: 78%          │   │
│  │                          [View Details]  [Edit Route]       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  UNASSIGNED SHIPMENTS                                      3       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ J-2468 │ Austin │ 3,500 lbs │ Need by: Jan 19 │ [Assign →] │   │
│  │ J-2470 │ San Antonio │ 1,800 lbs │ Jan 20 │ [Assign →]     │   │
│  │ J-2472 │ Corpus Christi │ 5,200 lbs │ Jan 21 │ [Assign →]  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.3 Driver Check-In / Check-Out

```
┌─────────────────────────────────────────────────────────────────────┐
│                    🚛 DRIVER CHECK-IN                               │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  CARRIER INFORMATION                                        │   │
│  │                                                             │   │
│  │  Carrier: [ FastFreight LTL                             ]   │   │
│  │  Driver Name: [ John Williams                           ]   │   │
│  │  Truck #: [ 4521                                        ]   │   │
│  │  Trailer #: [ 8842                                      ]   │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  SHIPMENTS FOR PICKUP                                       │   │
│  │                                                             │   │
│  │  ☑️ J-2455 │ Beta Ind │ 2,450 lbs │ 1 bundle │ BOL-04522   │   │
│  │  ☑️ J-2458 │ Omega Co │ 850 lbs   │ 2 pallets│ BOL-04523   │   │
│  │  ──────────────────────────────────────────────────────────│   │
│  │  Total: 3,300 lbs  │  3 packages                            │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  DOCK ASSIGNMENT                                            │   │
│  │                                                             │   │
│  │  Assigned Door: DOOR 1                                      │   │
│  │  Estimated Load Time: 30 minutes                            │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  ✓ CHECK IN DRIVER                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Check-in Time: 3:45 PM                                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                    🚛 DRIVER CHECK-OUT                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                     │
│  Driver: John Williams  │  Carrier: FastFreight LTL                │
│  Check-in: 3:45 PM  │  Load Start: 3:50 PM  │  Load Time: 25 min   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  LOADED SHIPMENTS                                           │   │
│  │                                                             │   │
│  │  ☑️ J-2455 │ BOL-04522 │ 2,450 lbs │ Verified ✓             │   │
│  │  ☑️ J-2458 │ BOL-04523 │ 850 lbs   │ Verified ✓             │   │
│  │                                                             │   │
│  │  Total Loaded: 3,300 lbs                                    │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  DOCUMENTATION                                              │   │
│  │                                                             │   │
│  │  ☑️ BOL copies signed (Shipper: 2, Driver: 2)               │   │
│  │  ☑️ Packing lists attached                                  │   │
│  │  ☑️ Certs/MTRs included                                     │   │
│  │  ☑️ Load photos captured (3 photos)                         │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  DRIVER SIGNATURE                                           │   │
│  │                                                             │   │
│  │  ┌───────────────────────────────────────────────────────┐  │   │
│  │  │                                                       │  │   │
│  │  │           [Signature Capture Pad]                     │  │   │
│  │  │                    ✍️                                  │  │   │
│  │  │                                                       │  │   │
│  │  └───────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  ✓ COMPLETE CHECK-OUT                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Departure Time: 4:15 PM                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. DELIVERY CONFIRMATION & POD

### 7.1 Delivery Confirmation Screen (Driver App)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ████ DELIVERY: J-2455                               DRIVER APP      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                     │
│  DELIVERY TO: Beta Industries                                       │
│  Address: 5678 Industrial Blvd, Irving, TX 75062                   │
│  Contact: Mark Thompson  │  Phone: (972) 555-1234                  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ITEMS TO DELIVER                                           │   │
│  │                                                             │   │
│  │  ☑️ Bundle 1: 3" Round 4140 (25 pcs)  │  2,450 lbs          │   │
│  │                                                             │   │
│  │  Total Packages: 1  │  Total Weight: 2,450 lbs              │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  DELIVERY STATUS                                            │   │
│  │                                                             │   │
│  │  ● Full Delivery (all items)                                │   │
│  │  ○ Partial Delivery (some items)                            │   │
│  │  ○ Refused (customer refused)                               │   │
│  │  ○ Unable to Deliver (other reason)                         │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  📷 DELIVERY PHOTOS (Required)                              │   │
│  │                                                             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │   │
│  │  │          │  │          │  │          │                  │   │
│  │  │ [PHOTO 1]│  │ [PHOTO 2]│  │  + ADD   │                  │   │
│  │  │ Unloaded │  │ Location │  │          │                  │   │
│  │  │    ✓     │  │    ✓     │  │          │                  │   │
│  │  └──────────┘  └──────────┘  └──────────┘                  │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  RECEIVER SIGNATURE                                         │   │
│  │                                                             │   │
│  │  Print Name: [ Mark Thompson                            ]   │   │
│  │                                                             │   │
│  │  ┌───────────────────────────────────────────────────────┐  │   │
│  │  │                                                       │  │   │
│  │  │              [Signature Capture]                      │  │   │
│  │  │                     ✍️                                 │  │   │
│  │  └───────────────────────────────────────────────────────┘  │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  NOTES                                                      │   │
│  │  [ Delivered to receiving dock, Door 3. No issues.      ]   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  ✓ CONFIRM DELIVERY                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  📍 GPS: 32.8574° N, 96.9452° W  │  Time: 11:23 AM                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 POD Record (Office View)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ████ PROOF OF DELIVERY                            Order: J-2455     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                     │
│  ┌──────────────────────────────────┬──────────────────────────┐   │
│  │ DELIVERY DETAILS                 │ STATUS: ✓ DELIVERED      │   │
│  │ ────────────────────────────────│                          │   │
│  │                                  │ Delivery Time:           │   │
│  │ Order: J-2455                    │ Jan 18, 2026 11:23 AM    │   │
│  │ BOL: BOL-2026-04522              │                          │   │
│  │ Customer: Beta Industries        │ Transit Time: 19 hours   │   │
│  │ PO: PO-88421                     │                          │   │
│  │                                  │ ──────────────────────── │   │
│  │ Carrier: FastFreight LTL         │                          │   │
│  │ PRO#: FF-7842156                 │ BILLED: ⏳ Pending       │   │
│  │ Driver: John Williams            │                          │   │
│  │                                  │                          │   │
│  └──────────────────────────────────┴──────────────────────────┘   │
│                                                                     │
│  DELIVERED ITEMS                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Line │ Description                    │ Ordered │ Delivered │   │
│  │──────│────────────────────────────────│─────────│───────────│   │
│  │ 1    │ 3" Round 4140 × 48" (25 pcs)  │ 25      │ 25        │   │
│  │ ═════│════════════════════════════════│═════════│═══════════│   │
│  │      │ TOTAL                          │ 25      │ 25 (100%) │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  SIGNATURE & PHOTOS                                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │  Received By: Mark Thompson                                 │   │
│  │  Title: Receiving Manager                                   │   │
│  │                                                             │   │
│  │  ┌─────────────────┐   ┌────────────┐  ┌────────────┐      │   │
│  │  │                 │   │            │  │            │      │   │
│  │  │   [Signature]   │   │  [Photo 1] │  │  [Photo 2] │      │   │
│  │  │                 │   │  Unloaded  │  │  Location  │      │   │
│  │  │  Mark Thompson  │   │            │  │            │      │   │
│  │  └─────────────────┘   └────────────┘  └────────────┘      │   │
│  │                                                             │   │
│  │  GPS: 32.8574° N, 96.9452° W (matches delivery address)    │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  NOTES: Delivered to receiving dock, Door 3. No issues.           │
│                                                                     │
│  [📧 Email POD to Customer]  [🖨️ Print]  [📋 Generate Invoice]     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.3 Exception Handling

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ⚠️ DELIVERY EXCEPTION                            │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                     │
│  Order: J-2470  │  Customer: Omega Industries                      │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  EXCEPTION TYPE                                             │   │
│  │                                                             │   │
│  │  ○ Partial Delivery - Some items not delivered              │   │
│  │  ● Customer Refused - Entire shipment refused               │   │
│  │  ○ Damaged - Items damaged, returned                        │   │
│  │  ○ Wrong Address - Could not locate                         │   │
│  │  ○ Closed - Business closed, no one available               │   │
│  │  ○ Other                                                    │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  REFUSED DETAILS                                            │   │
│  │                                                             │   │
│  │  Reason Given:                                              │   │
│  │  [ Customer states order was cancelled. Contact needed.  ]  │   │
│  │                                                             │   │
│  │  Spoke With: [ Jane Doe                                 ]   │   │
│  │  Title: [ Purchasing Manager                            ]   │   │
│  │                                                             │   │
│  │  📷 Photos Required:                                        │   │
│  │  ☑️ Material condition   ☐ Damage (if any)                  │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  RETURN DISPOSITION                                         │   │
│  │                                                             │   │
│  │  ● Return to warehouse                                      │   │
│  │  ○ Deliver to alternate address                             │   │
│  │  ○ Hold at carrier terminal                                 │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ⚡ TRIGGERED ACTIONS:                                              │
│  • Sales rep notified (email + SMS)                                │
│  • Order status → ON_HOLD                                          │
│  • Billing blocked until resolved                                  │
│  • Customer service ticket created                                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  ✓ SUBMIT EXCEPTION                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. CUSTOMER NOTIFICATIONS

### 8.1 Notification Timeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                CUSTOMER NOTIFICATION SEQUENCE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ORDER PLACED                                                       │
│      │                                                              │
│      ▼ ───────── 📧 Order Confirmation                              │
│      │           "Thank you for your order #ORD-2026-04125"         │
│      │           Details: Items, totals, expected ship date         │
│      │                                                              │
│  PROCESSING                                                         │
│      │                                                              │
│      ▼ ───────── 📧 Processing Started (optional, per customer)     │
│      │           "Your order is now being processed"                │
│      │                                                              │
│  READY TO SHIP                                                      │
│      │                                                              │
│      ▼ ───────── 📧📱 Shipment Notification                         │
│      │           "Your order has shipped"                           │
│      │           Carrier, tracking #, estimated delivery            │
│      │                                                              │
│  IN TRANSIT                                                         │
│      │                                                              │
│      ▼ ───────── 📱 Out for Delivery (same-day)                     │
│      │           "Your order is out for delivery"                   │
│      │           Driver name, ETA window                            │
│      │                                                              │
│  DELIVERED                                                          │
│      │                                                              │
│      ▼ ───────── 📧📱 Delivery Confirmation                         │
│      │           "Your order has been delivered"                    │
│      │           POD attached, signature, photos                    │
│      │                                                              │
│  INVOICED                                                           │
│      │                                                              │
│      ▼ ───────── 📧 Invoice                                         │
│                  Invoice PDF, payment terms, pay link               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Notification Templates

**Shipment Notification Email:**
```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Subject: Your SteelWise Order Has Shipped - ORD-2026-04125        │
│                                                                     │
│  ───────────────────────────────────────────────────────────────── │
│                                                                     │
│  Hi John,                                                           │
│                                                                     │
│  Great news! Your order has shipped and is on its way.             │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ORDER SUMMARY                                              │   │
│  │                                                             │   │
│  │  Order #: ORD-2026-04125                                    │   │
│  │  PO #: PO-78543                                             │   │
│  │                                                             │   │
│  │  Items:                                                     │   │
│  │  • 1" HR Round Bar A36 - 36" × 12 pcs                      │   │
│  │  • 1/2" Plate Parts per DWG-1234 - 25 pcs                  │   │
│  │  • 3/4-10 × 2" Hex Bolts - 48 ea                           │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  TRACKING INFORMATION                                       │   │
│  │                                                             │   │
│  │  Carrier: FastFreight LTL                                   │   │
│  │  Tracking #: FF-7842156                                     │   │
│  │  Track: https://fastfreight.com/track/FF-7842156           │   │
│  │                                                             │   │
│  │  Estimated Delivery: January 18, 2026 by 5:00 PM            │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Questions? Reply to this email or call (713) 555-1234.            │
│                                                                     │
│  Thank you for your business!                                       │
│  The SteelWise Team                                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**SMS Notifications:**
```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  SHIPPED:                                                           │
│  "SteelWise: Order #04125 shipped via FastFreight.                 │
│   Track: bit.ly/sw04125 | ETA: Jan 18"                             │
│                                                                     │
│  OUT FOR DELIVERY:                                                  │
│  "SteelWise: Order #04125 is out for delivery today.              │
│   ETA: 10:00 AM - 12:00 PM | Driver: Mike R."                      │
│                                                                     │
│  DELIVERED:                                                         │
│  "SteelWise: Order #04125 delivered at 11:23 AM.                   │
│   Signed by: Mark T. | POD: bit.ly/pod04125"                       │
│                                                                     │
│  WILL-CALL READY:                                                   │
│  "SteelWise: Order #04125 ready for pickup at Counter 3.          │
│   Hours: 7 AM - 5 PM | Ticket: WC-04125"                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.3 Customer Notification Preferences

```
┌─────────────────────────────────────────────────────────────────────┐
│ ████ CUSTOMER NOTIFICATION SETTINGS            ACME Corporation     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                     │
│  NOTIFICATION CHANNELS                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │  Primary Contact: John Smith                                │   │
│  │  Email: jsmith@acme.com  │  Phone: (214) 555-5678          │   │
│  │                                                             │   │
│  │  Additional Recipients:                                     │   │
│  │  • receiving@acme.com (Delivery only)                       │   │
│  │  • ap@acme.com (Invoices only)                              │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  NOTIFICATION PREFERENCES                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │  Event                    │ Email │ SMS  │ Portal │ None   │   │
│  │  ─────────────────────────│───────│──────│────────│──────  │   │
│  │  Order Confirmation       │  ●    │  ○   │   ●    │  ○     │   │
│  │  Processing Started       │  ○    │  ○   │   ●    │  ○     │   │
│  │  Shipped                  │  ●    │  ●   │   ●    │  ○     │   │
│  │  Out for Delivery         │  ○    │  ●   │   ●    │  ○     │   │
│  │  Delivered                │  ●    │  ●   │   ●    │  ○     │   │
│  │  Invoice                  │  ●    │  ○   │   ●    │  ○     │   │
│  │  Delay/Exception          │  ●    │  ●   │   ●    │  ○     │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DOCUMENT DELIVERY                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │  ☑️ Attach packing list to shipment email                   │   │
│  │  ☑️ Attach MTR/certs to shipment email                      │   │
│  │  ☑️ Attach POD to delivery confirmation                     │   │
│  │  ☑️ Send invoice as PDF attachment                          │   │
│  │  ☐ Include pricing on packing list                          │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [💾 Save Preferences]                                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 9. TRIGGER POINTS FOR BILLING & STATUS

### 9.1 Billing Trigger Matrix

| Event | Billing Action | Automatic? | Conditions |
|-------|----------------|:----------:|------------|
| **POD Captured** | Generate Invoice | ✓ | Full delivery, no exceptions |
| **Will-Call Pickup** | Generate Invoice | ✓ | Signature captured |
| **Partial Delivery** | Invoice delivered items | Manual | After exception review |
| **Customer Refused** | No invoice | ✓ | Return to inventory |
| **Damaged in Transit** | Claim + partial invoice | Manual | Per claim resolution |
| **COD Delivery** | Invoice at load | ✓ | Payment collected |
| **Blanket Release** | Per release invoice | ✓ | Per contract terms |

### 9.2 Status Update Triggers

```typescript
interface ShipmentStatusTriggers {
  // Packaging Complete
  onPackagingComplete: {
    updateOrderStatus: 'READY_TO_SHIP';
    notifyCustomer: false;  // Wait for actual ship
    reserveStagingLocation: true;
    generateDocuments: ['PACKING_LIST', 'LABELS'];
  };
  
  // Staged
  onStaged: {
    updateOrderStatus: 'STAGED';
    notifyShippingDesk: true;
    generateDocuments: ['BOL_DRAFT'];
  };
  
  // Carrier Assigned
  onCarrierAssigned: {
    updateOrderStatus: 'CARRIER_ASSIGNED';
    generateDocuments: ['BOL_FINAL'];
    notifyCarrier: true;  // If API integration
  };
  
  // Driver Check-Out (Shipped)
  onDriverCheckout: {
    updateOrderStatus: 'SHIPPED';
    notifyCustomer: true;
    sendTracking: true;
    capturePhotos: true;
    recordTimestamps: {
      departureTime: 'NOW';
      estimatedDelivery: 'CALCULATED';
    };
  };
  
  // Delivery Confirmed
  onDeliveryConfirmed: {
    updateOrderStatus: 'DELIVERED';
    notifyCustomer: true;
    capturePOD: true;
    triggerBilling: true;
    closeShipment: true;
  };
  
  // Delivery Exception
  onDeliveryException: {
    updateOrderStatus: 'EXCEPTION';
    notifyCustomer: true;
    notifySalesRep: true;
    createServiceTicket: true;
    blockBilling: true;
  };
}
```

### 9.3 Order Status Sync

```
┌─────────────────────────────────────────────────────────────────────┐
│            ORDER STATUS → SHIPMENT STATUS MAPPING                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ORDER STATUS        │  SHIPMENT STATUS        │  BILLING STATUS   │
│  ═══════════════════│═════════════════════════│═══════════════════│
│                      │                         │                   │
│  PACKAGING           │  PENDING_PACKAGING      │  NOT_BILLABLE     │
│       │              │          │              │                   │
│       ▼              │          ▼              │                   │
│  READY_TO_SHIP       │  PACKAGING_COMPLETE     │  NOT_BILLABLE     │
│       │              │          │              │                   │
│       ▼              │          ▼              │                   │
│       │              │  STAGED                 │  NOT_BILLABLE     │
│       │              │          │              │                   │
│       ▼              │          ▼              │                   │
│       │              │  READY_TO_SHIP          │  NOT_BILLABLE     │
│       │              │          │              │                   │
│       ▼              │          ▼              │                   │
│  SHIPPED             │  LOADING                │  PENDING (COD)    │
│       │              │          │              │                   │
│       ▼              │          ▼              │                   │
│       │              │  IN_TRANSIT             │  PENDING          │
│       │              │          │              │                   │
│       ▼              │          ▼              │                   │
│  COMPLETED           │  DELIVERED              │  READY_TO_BILL    │
│       │              │                         │       │           │
│       ▼              │                         │       ▼           │
│  BILLED              │  CLOSED                 │  INVOICED         │
│                      │                         │                   │
│  ═══════════════════│═════════════════════════│═══════════════════│
│                                                                     │
│  EXCEPTION STATES:                                                  │
│  ─────────────────                                                  │
│  ORDER: ON_HOLD      │  SHIPMENT: EXCEPTION    │  BILLING: BLOCKED │
│  ORDER: CANCELLED    │  SHIPMENT: RETURNED     │  BILLING: VOID    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.4 Billing Trigger Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BILLING TRIGGER FLOW                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                      ┌──────────────┐                               │
│                      │   DELIVERY   │                               │
│                      │   CONFIRMED  │                               │
│                      └──────┬───────┘                               │
│                             │                                       │
│                             ▼                                       │
│                      ┌──────────────┐                               │
│                      │  EXCEPTION?  │                               │
│                      └──────┬───────┘                               │
│                             │                                       │
│              ┌──────────────┼──────────────┐                       │
│              │              │              │                       │
│             YES           PARTIAL          NO                       │
│              │              │              │                       │
│              ▼              ▼              ▼                       │
│       ┌────────────┐ ┌────────────┐ ┌────────────┐                 │
│       │   BLOCK    │ │  MANUAL    │ │   AUTO     │                 │
│       │  BILLING   │ │  REVIEW    │ │  INVOICE   │                 │
│       └──────┬─────┘ └──────┬─────┘ └──────┬─────┘                 │
│              │              │              │                       │
│              │              ▼              │                       │
│              │       ┌────────────┐        │                       │
│              │       │  APPROVE   │        │                       │
│              │       │  PARTIAL   │        │                       │
│              │       │  INVOICE   │        │                       │
│              │       └──────┬─────┘        │                       │
│              │              │              │                       │
│              ▼              ▼              ▼                       │
│       ┌────────────────────────────────────────┐                   │
│       │           GENERATE INVOICE             │                   │
│       └────────────────────────────────────────┘                   │
│                             │                                       │
│                             ▼                                       │
│       ┌────────────────────────────────────────┐                   │
│       │           SEND TO CUSTOMER             │                   │
│       │    (Email + Portal + Print if req)     │                   │
│       └────────────────────────────────────────┘                   │
│                             │                                       │
│                             ▼                                       │
│       ┌────────────────────────────────────────┐                   │
│       │           POST TO A/R                  │                   │
│       │    (Update customer balance)           │                   │
│       └────────────────────────────────────────┘                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 10. DATA MODEL

### 10.1 Shipment Entity

```typescript
interface Shipment {
  id: string;                      // SHP-2026-xxxxx
  orderId: string;                 // Parent order
  status: ShipmentStatus;
  
  // Timing
  scheduledShipDate: Date;
  actualShipDate?: Date;
  estimatedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  
  // Carrier
  carrierType: 'OWN_FLEET' | 'LTL' | 'FTL' | 'PARCEL' | 'WILL_CALL';
  carrierId?: string;
  carrierName?: string;
  proNumber?: string;
  trackingUrl?: string;
  
  // For own fleet
  routeId?: string;
  driverId?: string;
  truckId?: string;
  stopSequence?: number;
  
  // Location
  originLocationId: string;
  destinationAddress: Address;
  stagingLocation?: string;
  dockDoor?: string;
  
  // Contents
  packages: Package[];
  totalWeight: number;
  totalPieces: number;
  freightClass?: string;
  
  // Documentation
  bolNumber: string;
  packingListNumber: string;
  documentsIncluded: DocumentType[];
  
  // Delivery
  deliveryRequirements: DeliveryRequirements;
  podCaptured: boolean;
  podData?: ProofOfDelivery;
  
  // Billing
  freightCost?: number;
  freightBillTo: 'PREPAID' | 'COLLECT' | 'THIRD_PARTY';
  billingTriggered: boolean;
  invoiceId?: string;
  
  // Audit
  createdAt: Date;
  createdBy: string;
  shippedAt?: Date;
  shippedBy?: string;
  deliveredAt?: Date;
}

interface Package {
  id: string;                      // PKG-xxxxx or BDL-xxxxx
  type: 'BUNDLE' | 'BOX' | 'PALLET' | 'CRATE' | 'LOOSE';
  
  contents: PackageContent[];
  
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'IN' | 'FT';
  };
  weight: number;
  
  labelPrinted: boolean;
  labelData: string;               // Barcode content
  
  photos: Photo[];
}

interface ProofOfDelivery {
  capturedAt: Date;
  capturedBy: string;              // Driver ID
  
  deliveryStatus: 'FULL' | 'PARTIAL' | 'REFUSED' | 'DAMAGED';
  
  receiverName: string;
  receiverTitle?: string;
  signatureImage: string;          // Base64 or URL
  
  photos: Photo[];
  
  gpsCoordinates: {
    latitude: number;
    longitude: number;
  };
  
  notes?: string;
  exceptionReason?: string;
}
```

### 10.2 API Endpoints

```typescript
// Packaging
POST   /api/shipments/{id}/packages           // Create package
PUT    /api/shipments/{id}/packages/{pkgId}   // Update package
POST   /api/shipments/{id}/packages/{pkgId}/label  // Print label
POST   /api/shipments/{id}/complete-packing   // Mark packing complete

// Staging
POST   /api/shipments/{id}/stage              // Assign staging location
PUT    /api/shipments/{id}/stage              // Change location

// Carrier
GET    /api/shipments/{id}/carrier-options    // Get carrier quotes
POST   /api/shipments/{id}/carrier            // Assign carrier
POST   /api/carriers/check-in                 // Driver check-in
POST   /api/carriers/check-out                // Driver check-out

// Own Fleet
GET    /api/fleet/routes                      // List routes
POST   /api/fleet/routes/{id}/stops           // Add stop to route
PUT    /api/fleet/routes/{id}/optimize        // Optimize route

// Delivery
POST   /api/shipments/{id}/deliver            // Capture POD
POST   /api/shipments/{id}/exception          // Report exception

// Documents
GET    /api/shipments/{id}/documents          // List documents
GET    /api/shipments/{id}/bol                // Get BOL PDF
GET    /api/shipments/{id}/packing-list       // Get packing list PDF
GET    /api/shipments/{id}/pod                // Get POD PDF

// Notifications
POST   /api/shipments/{id}/notify             // Send notification
GET    /api/customers/{id}/notification-prefs // Get preferences
PUT    /api/customers/{id}/notification-prefs // Update preferences
```

---

## 11. IMPLEMENTATION ROADMAP

### Phase 1: Core Shipping (Weeks 1-3)
- Packaging queue and workflow
- Bundle/package creation
- Label printing
- Basic BOL generation
- Staging assignment

### Phase 2: Carrier Integration (Weeks 4-6)
- Carrier selection interface
- Rate shopping (manual entry)
- Driver check-in/check-out
- Dock door management
- LTL carrier API integration (optional)

### Phase 3: Delivery Confirmation (Weeks 7-9)
- Driver mobile app (POD capture)
- Signature capture
- Photo capture
- GPS location
- Exception handling

### Phase 4: Fleet Management (Weeks 10-12)
- Own truck routing
- Stop optimization
- Driver assignment
- Route manifests
- Fleet tracking

### Phase 5: Notifications & Billing (Weeks 13-15)
- Customer notification engine
- Email templates
- SMS integration
- Billing triggers
- Invoice generation

---

## 12. KPIs & METRICS

| Metric | Target | Measurement |
|--------|--------|-------------|
| **On-Time Shipment** | ≥ 98% | Ship date vs commit date |
| **On-Time Delivery** | ≥ 95% | Delivery date vs promise |
| **Dock-to-Ship Time** | < 2 hours | Stage time to departure |
| **Documentation Accuracy** | 100% | BOL errors per shipment |
| **POD Capture Rate** | 100% | Deliveries with POD |
| **Billing Cycle Time** | < 24 hours | Delivery to invoice |
| **Freight Cost Accuracy** | ≥ 98% | Quoted vs actual |
| **Truck Utilization** | ≥ 75% | Capacity used per trip |
| **Customer Complaints** | < 1% | Shipping-related complaints |

---

**End of Shipping, Delivery & Documentation Specification**
