# 09 - ORDERS & QUOTING MODULE

## Overview
RFQ → Quote → PO → SO → Invoice lifecycle management.

## Key Screens

### Quote Builder
```
┌─────────────────────────────────────────────────────────────────┐
│ NEW QUOTE                                    [Save] [Send]      │
├─────────────────────────────────────────────────────────────────┤
│ Customer: [ABC Manufacturing▼]  Contact: [John Smith▼]         │
│ Ship To: [123 Main St, Chicago IL▼]  Terms: [Net 30▼]          │
├─────────────────────────────────────────────────────────────────┤
│ LINE ITEMS                                        [+ Add Line] │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ # │ Product    │ Spec          │ Qty    │ $/CWT  │ Ext    │  │
│ │ 1 │ HR Coil    │ A36 .075x48   │ 40,000 │ $42.50 │ $17,000│  │
│ │ 2 │ HR Sheet   │ A36 .120x48   │ 20,000 │ $44.00 │ $8,800 │  │
│ └───────────────────────────────────────────────────────────┘  │
│ Subtotal: $25,800  Tax: $0  Freight: $850  Total: $26,650     │
└─────────────────────────────────────────────────────────────────┘
```

### Order Board
```
┌─────────────────────────────────────────────────────────────────┐
│ SALES ORDERS                              [+ New] [Export]      │
├─────────────────────────────────────────────────────────────────┤
│ SO#      │ Customer    │ Total    │ Status   │ Ship Date       │
│ SO-10256 │ ABC Mfg     │ $26,650  │ Open     │ 01/20/2026      │
│ SO-10255 │ XYZ Steel   │ $18,200  │ Partial  │ 01/18/2026      │
│ SO-10254 │ BuildCo     │ $42,100  │ Shipped  │ 01/16/2026      │
└─────────────────────────────────────────────────────────────────┘
```

## Order Workflow
```
RFQ → QUOTE → PO RECEIVED → SO CREATED → ALLOCATED → SHIPPED → INVOICED
```

## API Endpoints
```
GET/POST   /api/v1/quotes
GET/POST   /api/v1/orders
PUT        /api/v1/orders/{id}/allocate
PUT        /api/v1/orders/{id}/ship
POST       /api/v1/orders/{id}/invoice
```
