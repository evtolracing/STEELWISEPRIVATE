# 43 — AI Shipping & Documentation

> **Purpose:** Shipping workflow, documentation generation, and logistics specifications for AI-build.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. Workflow Timeline — Gantt-Like Text

```
SHIPPING WORKFLOW TIMELINE
==========================

Legend: ████ Active Task | ░░░░ Wait/Dependency | ──── Duration Line | ◆ Milestone | ⚠ Decision Point

ORDER CONFIRMED (T=0)
│
├─────────────────────────────────────────────────────────────────────────────────────────────────────►
│  PHASE 1: ORDER PROCESSING (T+0 to T+4h)
│  ├── Order Acknowledgment Generation      ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
│  │   └── Duration: 5 min | Trigger: ORDER_CONFIRMED | Output: DOC-OA
│  │
│  ├── Credit Verification                  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
│  │   └── Duration: 15 min | Trigger: ORDER_CONFIRMED | Output: Credit Hold/Release
│  │
│  ├── Inventory Allocation                 ░░░░████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
│  │   └── Duration: 30 min | Depends: Credit Clear | Output: Allocation Record
│  │
│  ├── Work Order Generation                ░░░░░░░░░░░░████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
│  │   └── Duration: 15 min | Depends: Allocation | Output: DOC-WO
│  │
│  └── ◆ READY_FOR_PRODUCTION               ░░░░░░░░░░░░░░░░░░░░◆
│      └── Milestone at T+1h (processing) or T+15min (stock)
│
├─────────────────────────────────────────────────────────────────────────────────────────────────────►
│  PHASE 2: PRODUCTION/PICKING (T+1h to T+8h for processing, T+15min to T+2h for stock)
│  │
│  ├── [IF PROCESSING REQUIRED]
│  │   ├── Shop Traveler Print              ░░░░░░░░░░░░░░░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
│  │   │   └── Duration: 5 min | Trigger: WO_RELEASED | Output: DOC-TRAV
│  │   │
│  │   ├── Material Requisition             ░░░░░░░░░░░░░░░░░░░░░████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░
│  │   │   └── Duration: 30 min | Trigger: WO_RELEASED | Output: DOC-MR
│  │   │
│  │   ├── Processing Operations            ░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████████████░░░░░░░░░
│  │   │   └── Duration: 2-6h | Depends: Material Staged
│  │   │
│  │   ├── QA Inspection                    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████░░░
│  │   │   └── Duration: 30 min | Trigger: OPERATION_COMPLETE | Output: DOC-QA
│  │   │
│  │   └── ◆ PRODUCTION_COMPLETE            ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░◆
│  │
│  ├── [IF STOCK ONLY]
│  │   ├── Pick Ticket Generation           ░░░░░░░░░░░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
│  │   │   └── Duration: 5 min | Trigger: ALLOCATION_COMPLETE | Output: DOC-PT
│  │   │
│  │   ├── Warehouse Picking                ░░░░░░░░░░░░░░░░░░░░████████████░░░░░░░░░░░░░░░░░░░░░░░░░
│  │   │   └── Duration: 30-60 min | Depends: Pick Ticket
│  │   │
│  │   └── ◆ PICK_COMPLETE                  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░◆
│  │
│  └── Material Move to Staging             ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████░░░░░░░░░░░░░░░░░
│      └── Duration: 15-30 min | Trigger: PICK/PROD_COMPLETE
│
├─────────────────────────────────────────────────────────────────────────────────────────────────────►
│  PHASE 3: STAGING & DOCUMENTATION (T-4h to T-2h before ship)
│  │
│  ├── Staging Verification                 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████░░░░░░░░░░░
│  │   └── Duration: 20 min | Trigger: MATERIAL_STAGED | Output: Staging Confirmation
│  │
│  ├── ⚠ Document Package Decision          ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░⚠
│  │   └── Decision Point: Which documents required?
│  │
│  ├── Packing List Generation              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░░░░
│  │   └── Duration: 10 min | Trigger: STAGING_VERIFIED | Output: DOC-PL
│  │
│  ├── Bill of Lading Generation            ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░░░░
│  │   └── Duration: 10 min | Trigger: STAGING_VERIFIED | Output: DOC-BOL
│  │
│  ├── MTR Retrieval/Generation             ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░░
│  │   └── Duration: 15 min | Trigger: CUSTOMER_REQUIRES_MTR | Output: DOC-MTR
│  │
│  ├── Certificate of Conformance           ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░░
│  │   └── Duration: 10 min | Trigger: QA_REQUIRED | Output: DOC-COC
│  │
│  ├── Weight Ticket Generation             ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░
│  │   └── Duration: 5 min | Trigger: SCALE_WEIGHT_CAPTURED | Output: DOC-WT
│  │
│  ├── Hazmat Documentation                 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░
│  │   └── Duration: 15 min | Trigger: HAZMAT_MATERIAL | Output: DOC-HAZ
│  │
│  └── ◆ DOCUMENTS_COMPLETE                 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░◆
│
├─────────────────────────────────────────────────────────────────────────────────────────────────────►
│  PHASE 4: LOADING & DISPATCH (T-2h to T+0 ship time)
│  │
│  ├── Carrier Notification                 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░
│  │   └── Duration: 5 min | Trigger: READY_TO_SHIP | Output: Carrier Alert
│  │
│  ├── Dock Assignment                      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████
│  │   └── Duration: 5 min | Trigger: CARRIER_ARRIVES
│  │
│  ├── Loading Operations                   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██
│  │   └── Duration: 30-90 min | Depends: Dock Assigned           ████████████████████████████████░░
│  │
│  ├── Load Verification                    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
│  │   └── Duration: 15 min | Trigger: LOADING_COMPLETE           ░░░░░░░░░░░░░░░░░░░░░░░░░░████████░
│  │
│  ├── Driver Signature Capture             ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
│  │   └── Duration: 5 min | Trigger: LOAD_VERIFIED               ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░
│  │
│  ├── BOL Finalization                     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
│  │   └── Duration: 5 min | Trigger: SIGNATURE_CAPTURED          ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████
│  │
│  └── ◆ SHIPPED                            ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░◆
│
├─────────────────────────────────────────────────────────────────────────────────────────────────────►
│  PHASE 5: IN-TRANSIT & DELIVERY (Ship+0 to Delivery)
│  │
│  ├── Shipment Tracking Active             ████████████████████████████████████████████████████████
│  │   └── Duration: Continuous | Trigger: SHIPPED | Output: Tracking Updates
│  │
│  ├── Customer Notifications               ░░░░████░░░░░░░░░░░░████░░░░░░░░░░░░░░░░████░░░░░░░░████░
│  │   └── At: Shipped, Out for Delivery, Delivered | Output: DOC-NOTIF
│  │
│  ├── Delivery Confirmation                ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████
│  │   └── Duration: 10 min | Trigger: DRIVER_CONFIRMS | Output: DOC-POD
│  │
│  └── ◆ DELIVERED                          ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░◆
│
├─────────────────────────────────────────────────────────────────────────────────────────────────────►
│  PHASE 6: POST-DELIVERY (Delivery+0 to Delivery+30d)
│  │
│  ├── Invoice Generation                   ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
│  │   └── Duration: Auto | Trigger: DELIVERED | Output: DOC-INV
│  │
│  ├── Document Archive                     ░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
│  │   └── Duration: Auto | Trigger: INVOICE_GENERATED
│  │
│  ├── Customer Document Portal Update      ░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
│  │   └── Duration: Auto | Trigger: DOCUMENTS_ARCHIVED
│  │
│  └── ◆ ORDER_COMPLETE                     ░░░░░░░░░░◆
│
└─────────────────────────────────────────────────────────────────────────────────────────────────────►


PARALLEL WORKFLOWS
==================

WILL-CALL PICKUP TIMELINE
─────────────────────────
│  Order Ready Notification    ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
│  └── Trigger: STAGING_COMPLETE | Output: DOC-READY-NOTIF
│
│  Customer Arrival            ░░░░░░░░░░░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
│  └── Variable wait time
│
│  Identity Verification       ░░░░░░░░░░░░░░░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
│  └── Duration: 5 min
│
│  Load onto Customer Vehicle  ░░░░░░░░░░░░░░░░░░░░░░░░████████████░░░░░░░░░░░░░░░░░░
│  └── Duration: 15-45 min
│
│  Release Documentation       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░░░░░░░░░░░░░
│  └── Duration: 5 min | Output: DOC-PL, DOC-REL
│
│  Signature Capture           ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░░░░░░░░░
│  └── Duration: 2 min | Output: DOC-SIG
│
│  ◆ PICKED_UP                 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░◆


CUSTOMER TRUCK DELIVERY TIMELINE
────────────────────────────────
│  Truck Arrival Notification  ░░░░░░░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
│  └── Trigger: CUSTOMER_TRUCK_ARRIVES
│
│  Driver Check-in             ░░░░░░░░░░░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
│  └── Duration: 10 min
│
│  Dock Assignment             ░░░░░░░░░░░░░░░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
│  │
│  Loading                     ░░░░░░░░░░░░░░░░░░░░░░░░████████████████░░░░░░░░░░░░░░
│  │
│  Weight Verification         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░░░░░░░░░
│  └── Output: DOC-WT
│
│  Document Handoff            ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░░░░░
│  └── Output: DOC-PL, DOC-BOL, DOC-MTR
│
│  Gate Release                ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░
│  └── Output: DOC-GATE
│
│  ◆ RELEASED                  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░◆


LTL/COMMON CARRIER TIMELINE
───────────────────────────
│  Carrier Booking             ░░░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
│  └── Duration: 15 min | Output: Booking Confirmation
│
│  PRO Number Assignment       ░░░░░░░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
│  └── Auto from carrier
│
│  Label Generation            ░░░░░░░░░░░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
│  └── Output: DOC-LBL
│
│  Carrier Pickup Window       ░░░░░░░░░░░░░░░░░░░░░░░░████████████████░░░░░░░░░░░░░░
│  └── Duration: 2-4 hours
│
│  Carrier Departure           ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░░░░░
│  └── Trigger: CARRIER_DEPARTS
│
│  Tracking Handoff            ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░
│  └── Link carrier tracking to order
│
│  ◆ IN_TRANSIT                ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░◆
```

---

## 2. Documents Required — JSON Array

```json
{
  "documents_required": [
    {
      "doc_id": "DOC-OA",
      "name": "Order Acknowledgment",
      "description": "Confirmation of order receipt with details",
      "triggering_event": "ORDER_CONFIRMED",
      "dependencies": [],
      "required_data": [
        "order_number",
        "customer_info",
        "line_items",
        "pricing",
        "requested_delivery_date",
        "payment_terms"
      ],
      "output_format": ["PDF", "EMAIL"],
      "distribution": ["CUSTOMER", "SALES_REP"],
      "retention_days": 2555,
      "customer_visible": true,
      "auto_generate": true,
      "template_id": "TPL-OA-001"
    },
    {
      "doc_id": "DOC-WO",
      "name": "Work Order",
      "description": "Internal production order for processing",
      "triggering_event": "ALLOCATION_COMPLETE",
      "triggering_condition": "order.has_processing == true",
      "dependencies": ["ALLOCATION_RECORD"],
      "required_data": [
        "work_order_number",
        "operations",
        "materials",
        "specifications",
        "due_date",
        "priority"
      ],
      "output_format": ["PDF", "SYSTEM"],
      "distribution": ["PRODUCTION", "WAREHOUSE"],
      "retention_days": 2555,
      "customer_visible": false,
      "auto_generate": true,
      "template_id": "TPL-WO-001"
    },
    {
      "doc_id": "DOC-TRAV",
      "name": "Shop Traveler",
      "description": "Document accompanying material through production",
      "triggering_event": "WORK_ORDER_RELEASED",
      "dependencies": ["DOC-WO"],
      "required_data": [
        "work_order_number",
        "routing_steps",
        "material_specs",
        "quality_requirements",
        "special_instructions",
        "barcode"
      ],
      "output_format": ["PDF", "LABEL"],
      "distribution": ["SHOP_FLOOR"],
      "retention_days": 2555,
      "customer_visible": false,
      "auto_generate": true,
      "copies": 2,
      "template_id": "TPL-TRAV-001"
    },
    {
      "doc_id": "DOC-MR",
      "name": "Material Requisition",
      "description": "Request to pull material from inventory",
      "triggering_event": "WORK_ORDER_RELEASED",
      "dependencies": ["DOC-WO", "ALLOCATION_RECORD"],
      "required_data": [
        "requisition_number",
        "materials_list",
        "locations",
        "quantities",
        "heat_numbers",
        "destination"
      ],
      "output_format": ["PDF", "MOBILE"],
      "distribution": ["WAREHOUSE"],
      "retention_days": 365,
      "customer_visible": false,
      "auto_generate": true,
      "template_id": "TPL-MR-001"
    },
    {
      "doc_id": "DOC-PT",
      "name": "Pick Ticket",
      "description": "Warehouse picking instructions",
      "triggering_event": "ALLOCATION_COMPLETE",
      "triggering_condition": "order.has_processing == false",
      "dependencies": ["ALLOCATION_RECORD"],
      "required_data": [
        "pick_ticket_number",
        "items",
        "locations",
        "quantities",
        "sequence",
        "ship_date"
      ],
      "output_format": ["PDF", "MOBILE", "RF_GUN"],
      "distribution": ["WAREHOUSE"],
      "retention_days": 365,
      "customer_visible": false,
      "auto_generate": true,
      "template_id": "TPL-PT-001"
    },
    {
      "doc_id": "DOC-QA",
      "name": "Quality Inspection Report",
      "description": "QA inspection results and measurements",
      "triggering_event": "OPERATION_COMPLETE",
      "triggering_condition": "operation.requires_inspection == true",
      "dependencies": ["DOC-TRAV"],
      "required_data": [
        "inspection_number",
        "work_order_ref",
        "measurements",
        "pass_fail",
        "inspector_id",
        "timestamp",
        "deviations"
      ],
      "output_format": ["PDF", "SYSTEM"],
      "distribution": ["QA", "PRODUCTION"],
      "retention_days": 3650,
      "customer_visible": false,
      "customer_visible_on_request": true,
      "auto_generate": true,
      "template_id": "TPL-QA-001"
    },
    {
      "doc_id": "DOC-PL",
      "name": "Packing List",
      "description": "Detailed list of items in shipment",
      "triggering_event": "STAGING_VERIFIED",
      "dependencies": ["STAGING_RECORD"],
      "required_data": [
        "shipment_number",
        "order_number",
        "customer_po",
        "items",
        "quantities",
        "weights",
        "bundle_tags",
        "heat_numbers"
      ],
      "output_format": ["PDF"],
      "distribution": ["CUSTOMER", "SHIPPING", "DRIVER"],
      "copies": 3,
      "retention_days": 2555,
      "customer_visible": true,
      "auto_generate": true,
      "template_id": "TPL-PL-001"
    },
    {
      "doc_id": "DOC-BOL",
      "name": "Bill of Lading",
      "description": "Legal shipping document / carrier contract",
      "triggering_event": "STAGING_VERIFIED",
      "dependencies": ["STAGING_RECORD", "CARRIER_ASSIGNMENT"],
      "required_data": [
        "bol_number",
        "shipper_info",
        "consignee_info",
        "carrier_info",
        "freight_terms",
        "item_descriptions",
        "weights",
        "piece_count",
        "freight_class",
        "special_instructions"
      ],
      "output_format": ["PDF"],
      "distribution": ["CARRIER", "CUSTOMER", "SHIPPER"],
      "copies": 4,
      "retention_days": 3650,
      "customer_visible": true,
      "auto_generate": true,
      "requires_signature": true,
      "template_id": "TPL-BOL-001"
    },
    {
      "doc_id": "DOC-MTR",
      "name": "Mill Test Report",
      "description": "Material certification from mill",
      "triggering_event": "STAGING_VERIFIED",
      "triggering_condition": "customer.requires_mtr == true OR line.requires_mtr == true",
      "dependencies": ["MATERIAL_RECEIPT_RECORD"],
      "required_data": [
        "heat_number",
        "mill_name",
        "grade",
        "chemical_analysis",
        "mechanical_properties",
        "dimensions",
        "test_results"
      ],
      "output_format": ["PDF"],
      "distribution": ["CUSTOMER"],
      "copies": 1,
      "retention_days": 3650,
      "customer_visible": true,
      "auto_generate": false,
      "source": "MILL_DOCUMENT_ARCHIVE",
      "template_id": null
    },
    {
      "doc_id": "DOC-COC",
      "name": "Certificate of Conformance",
      "description": "Statement that material meets specifications",
      "triggering_event": "QA_COMPLETE",
      "triggering_condition": "customer.requires_coc == true OR order.requires_coc == true",
      "dependencies": ["DOC-QA"],
      "required_data": [
        "certificate_number",
        "order_reference",
        "specifications_met",
        "test_results_summary",
        "authorized_signature",
        "date"
      ],
      "output_format": ["PDF"],
      "distribution": ["CUSTOMER"],
      "copies": 1,
      "retention_days": 3650,
      "customer_visible": true,
      "auto_generate": true,
      "requires_qa_approval": true,
      "template_id": "TPL-COC-001"
    },
    {
      "doc_id": "DOC-WT",
      "name": "Weight Ticket",
      "description": "Certified weight from truck scale",
      "triggering_event": "SCALE_WEIGHT_CAPTURED",
      "dependencies": ["LOADING_COMPLETE"],
      "required_data": [
        "ticket_number",
        "gross_weight",
        "tare_weight",
        "net_weight",
        "vehicle_id",
        "timestamp",
        "scale_id",
        "operator_id"
      ],
      "output_format": ["PDF", "THERMAL_PRINT"],
      "distribution": ["CARRIER", "CUSTOMER", "BILLING"],
      "copies": 2,
      "retention_days": 2555,
      "customer_visible": true,
      "auto_generate": true,
      "certified": true,
      "template_id": "TPL-WT-001"
    },
    {
      "doc_id": "DOC-HAZ",
      "name": "Hazmat Shipping Papers",
      "description": "DOT hazardous materials documentation",
      "triggering_event": "STAGING_VERIFIED",
      "triggering_condition": "shipment.contains_hazmat == true",
      "dependencies": ["HAZMAT_CLASSIFICATION"],
      "required_data": [
        "un_number",
        "proper_shipping_name",
        "hazard_class",
        "packing_group",
        "quantity",
        "emergency_contact",
        "shipper_certification"
      ],
      "output_format": ["PDF"],
      "distribution": ["CARRIER", "DRIVER"],
      "copies": 2,
      "retention_days": 3650,
      "customer_visible": false,
      "auto_generate": true,
      "regulatory_requirement": "DOT_49CFR",
      "template_id": "TPL-HAZ-001"
    },
    {
      "doc_id": "DOC-LBL",
      "name": "Shipping Labels",
      "description": "Carrier-specific package labels",
      "triggering_event": "CARRIER_BOOKING_CONFIRMED",
      "dependencies": ["CARRIER_ASSIGNMENT", "PRO_NUMBER"],
      "required_data": [
        "pro_number",
        "shipper_address",
        "consignee_address",
        "carrier_barcode",
        "service_type",
        "piece_number"
      ],
      "output_format": ["THERMAL_LABEL"],
      "distribution": ["SHIPPING"],
      "copies_per_piece": 1,
      "retention_days": 365,
      "customer_visible": false,
      "auto_generate": true,
      "template_id": "CARRIER_SPECIFIC"
    },
    {
      "doc_id": "DOC-POD",
      "name": "Proof of Delivery",
      "description": "Confirmation of delivery with signature",
      "triggering_event": "DELIVERY_CONFIRMED",
      "dependencies": ["DOC-BOL"],
      "required_data": [
        "delivery_timestamp",
        "receiver_name",
        "receiver_signature",
        "delivery_location",
        "condition_notes",
        "photo_urls",
        "bol_reference"
      ],
      "output_format": ["PDF", "SYSTEM"],
      "distribution": ["CUSTOMER", "SALES_REP", "BILLING"],
      "retention_days": 2555,
      "customer_visible": true,
      "auto_generate": true,
      "template_id": "TPL-POD-001"
    },
    {
      "doc_id": "DOC-INV",
      "name": "Invoice",
      "description": "Billing document for shipment",
      "triggering_event": "DELIVERY_CONFIRMED",
      "triggering_condition": "billing_terms != 'PREPAID'",
      "dependencies": ["DOC-POD", "DOC-WT"],
      "required_data": [
        "invoice_number",
        "customer_info",
        "line_items",
        "unit_prices",
        "extended_prices",
        "processing_charges",
        "freight_charges",
        "taxes",
        "total_due",
        "payment_terms",
        "due_date"
      ],
      "output_format": ["PDF", "EDI", "EMAIL"],
      "distribution": ["CUSTOMER", "AR"],
      "retention_days": 3650,
      "customer_visible": true,
      "auto_generate": true,
      "template_id": "TPL-INV-001"
    },
    {
      "doc_id": "DOC-REL",
      "name": "Material Release Form",
      "description": "Authorization to release material (will-call)",
      "triggering_event": "IDENTITY_VERIFIED",
      "triggering_condition": "delivery_method == 'WILL_CALL'",
      "dependencies": ["IDENTITY_VERIFICATION"],
      "required_data": [
        "release_number",
        "order_number",
        "pickup_person",
        "id_verification",
        "items_released",
        "timestamp",
        "employee_id"
      ],
      "output_format": ["PDF"],
      "distribution": ["CUSTOMER", "SECURITY"],
      "retention_days": 2555,
      "customer_visible": true,
      "auto_generate": true,
      "template_id": "TPL-REL-001"
    },
    {
      "doc_id": "DOC-GATE",
      "name": "Gate Pass",
      "description": "Authorization to exit facility with materials",
      "triggering_event": "LOADING_COMPLETE",
      "triggering_condition": "delivery_method IN ['WILL_CALL', 'CUSTOMER_TRUCK']",
      "dependencies": ["DOC-REL", "SIGNATURE_CAPTURE"],
      "required_data": [
        "pass_number",
        "vehicle_plate",
        "driver_name",
        "order_references",
        "total_weight",
        "timestamp"
      ],
      "output_format": ["PDF", "THERMAL_PRINT"],
      "distribution": ["SECURITY", "DRIVER"],
      "retention_days": 365,
      "customer_visible": false,
      "auto_generate": true,
      "template_id": "TPL-GATE-001"
    },
    {
      "doc_id": "DOC-READY-NOTIF",
      "name": "Ready for Pickup Notification",
      "description": "Customer notification that order is ready",
      "triggering_event": "STAGING_COMPLETE",
      "triggering_condition": "delivery_method == 'WILL_CALL'",
      "dependencies": ["STAGING_RECORD"],
      "required_data": [
        "order_number",
        "customer_name",
        "pickup_location",
        "hours",
        "items_summary",
        "valid_until"
      ],
      "output_format": ["EMAIL", "SMS"],
      "distribution": ["CUSTOMER"],
      "retention_days": 30,
      "customer_visible": true,
      "auto_generate": true,
      "template_id": "TPL-READY-001"
    },
    {
      "doc_id": "DOC-SIG",
      "name": "Signature Capture Record",
      "description": "Electronic signature for pickup/delivery",
      "triggering_event": "SIGNATURE_CAPTURED",
      "dependencies": [],
      "required_data": [
        "signature_image",
        "signer_name",
        "signer_title",
        "timestamp",
        "device_id",
        "gps_coordinates",
        "related_documents"
      ],
      "output_format": ["SYSTEM"],
      "distribution": [],
      "retention_days": 3650,
      "customer_visible": false,
      "auto_generate": true,
      "template_id": null
    },
    {
      "doc_id": "DOC-RMA",
      "name": "Return Material Authorization",
      "description": "Authorization for customer return",
      "triggering_event": "RETURN_REQUESTED",
      "dependencies": ["RETURN_APPROVAL"],
      "required_data": [
        "rma_number",
        "original_order",
        "items_authorized",
        "return_reason",
        "credit_type",
        "shipping_instructions",
        "valid_until"
      ],
      "output_format": ["PDF", "EMAIL"],
      "distribution": ["CUSTOMER", "RECEIVING"],
      "retention_days": 2555,
      "customer_visible": true,
      "auto_generate": true,
      "template_id": "TPL-RMA-001"
    },
    {
      "doc_id": "DOC-CR",
      "name": "Credit Memo",
      "description": "Credit adjustment for returns or adjustments",
      "triggering_event": "CREDIT_APPROVED",
      "dependencies": ["DOC-RMA", "RECEIVING_INSPECTION"],
      "required_data": [
        "credit_memo_number",
        "original_invoice",
        "credit_items",
        "credit_amount",
        "reason_code",
        "approval_id"
      ],
      "output_format": ["PDF", "EMAIL", "EDI"],
      "distribution": ["CUSTOMER", "AR"],
      "retention_days": 3650,
      "customer_visible": true,
      "auto_generate": true,
      "template_id": "TPL-CR-001"
    },
    {
      "doc_id": "DOC-DD",
      "name": "Delivery Deviation Report",
      "description": "Report of issues during delivery",
      "triggering_event": "DELIVERY_EXCEPTION",
      "dependencies": [],
      "required_data": [
        "deviation_number",
        "shipment_reference",
        "exception_type",
        "description",
        "photos",
        "driver_statement",
        "customer_notified"
      ],
      "output_format": ["PDF", "SYSTEM"],
      "distribution": ["CUSTOMER_SERVICE", "SALES_REP", "CUSTOMER"],
      "retention_days": 2555,
      "customer_visible": true,
      "auto_generate": true,
      "template_id": "TPL-DD-001"
    }
  ]
}
```

---

## 3. Shipment States — State Machine

```yaml
shipment_state_machine:
  name: ShipmentLifecycle
  version: "1.0"
  
  states:
    - id: PLANNED
      type: initial
      description: "Shipment created from order, not yet ready"
      entry_actions:
        - create_shipment_record
        - assign_shipment_number
        - calculate_target_ship_date
      allowed_transitions: [ALLOCATING, CANCELLED]
      documents: []
      
    - id: ALLOCATING
      type: processing
      description: "Material being allocated to shipment"
      entry_actions:
        - reserve_inventory
        - check_availability
      allowed_transitions: [ALLOCATED, BACKORDER, PARTIAL_ALLOCATED, CANCELLED]
      timeout_hours: 4
      timeout_action: escalate_to_scheduler
      documents: []
      
    - id: ALLOCATED
      type: checkpoint
      description: "All material allocated and reserved"
      entry_actions:
        - lock_allocations
        - update_atp
      allowed_transitions: [PICKING, PROCESSING, RELEASED_TO_SHOP, CANCELLED]
      documents: []
      
    - id: PARTIAL_ALLOCATED
      type: checkpoint
      description: "Some material allocated, remainder backordered"
      entry_actions:
        - create_backorder_record
        - notify_customer_service
      allowed_transitions: [PICKING, PROCESSING, WAITING_BACKORDER, CANCELLED]
      documents: []
      
    - id: BACKORDER
      type: waiting
      description: "All material on backorder"
      entry_actions:
        - create_backorder_record
        - notify_customer
        - estimate_availability
      allowed_transitions: [ALLOCATING, CANCELLED]
      documents: []
      
    - id: WAITING_BACKORDER
      type: waiting
      description: "Partial ship done, waiting for backorder"
      entry_actions:
        - create_partial_shipment
        - track_remaining
      allowed_transitions: [ALLOCATING, CANCELLED]
      documents: []
      
    - id: RELEASED_TO_SHOP
      type: processing
      description: "Work order released for processing"
      entry_actions:
        - generate_work_order
        - generate_traveler
        - notify_production
      allowed_transitions: [PROCESSING, CANCELLED]
      documents: [DOC-WO, DOC-TRAV, DOC-MR]
      
    - id: PROCESSING
      type: processing
      description: "Material being processed (cut, formed, etc.)"
      entry_actions:
        - start_tracking
        - update_schedule
      allowed_transitions: [QA_PENDING, PICKING, PROCESSING_HOLD, CANCELLED]
      timeout_hours: 24
      timeout_action: notify_production_manager
      documents: []
      
    - id: PROCESSING_HOLD
      type: blocked
      description: "Processing stopped due to issue"
      entry_actions:
        - log_hold_reason
        - notify_stakeholders
        - create_hold_ticket
      allowed_transitions: [PROCESSING, CANCELLED]
      documents: []
      
    - id: QA_PENDING
      type: processing
      description: "Material awaiting quality inspection"
      entry_actions:
        - queue_for_inspection
        - notify_qa
      allowed_transitions: [QA_PASSED, QA_FAILED, QA_HOLD]
      timeout_hours: 4
      timeout_action: escalate_qa_manager
      documents: []
      
    - id: QA_PASSED
      type: checkpoint
      description: "Quality inspection passed"
      entry_actions:
        - record_qa_results
        - release_to_staging
      allowed_transitions: [PICKING]
      documents: [DOC-QA, DOC-COC]
      
    - id: QA_FAILED
      type: blocked
      description: "Quality inspection failed"
      entry_actions:
        - record_failure
        - notify_production
        - create_ncr
      allowed_transitions: [PROCESSING, CANCELLED]
      documents: [DOC-QA]
      
    - id: QA_HOLD
      type: blocked
      description: "QA requires additional review"
      entry_actions:
        - escalate_to_qa_manager
        - log_hold_details
      allowed_transitions: [QA_PASSED, QA_FAILED]
      documents: []
      
    - id: PICKING
      type: processing
      description: "Material being picked from warehouse"
      entry_actions:
        - generate_pick_ticket
        - assign_picker
        - notify_warehouse
      allowed_transitions: [PICKED, PICK_EXCEPTION, CANCELLED]
      timeout_hours: 2
      timeout_action: notify_warehouse_lead
      documents: [DOC-PT]
      
    - id: PICK_EXCEPTION
      type: blocked
      description: "Issue during picking"
      entry_actions:
        - log_exception
        - notify_inventory_control
      allowed_transitions: [PICKING, ALLOCATING, CANCELLED]
      documents: []
      
    - id: PICKED
      type: checkpoint
      description: "All material picked"
      entry_actions:
        - confirm_picks
        - update_inventory
      allowed_transitions: [STAGING]
      documents: []
      
    - id: STAGING
      type: processing
      description: "Material being staged for shipment"
      entry_actions:
        - assign_staging_location
        - move_to_staging
      allowed_transitions: [STAGED, STAGING_ISSUE]
      timeout_hours: 2
      timeout_action: notify_shipping
      documents: []
      
    - id: STAGING_ISSUE
      type: blocked
      description: "Problem during staging"
      entry_actions:
        - log_issue
        - notify_shipping_supervisor
      allowed_transitions: [STAGING, PICKING]
      documents: []
      
    - id: STAGED
      type: ready
      description: "Material staged and ready for shipment"
      entry_actions:
        - verify_staged_material
        - generate_packing_list
        - prepare_documents
      allowed_transitions: [DOCUMENTS_READY, AWAITING_CARRIER, READY_FOR_PICKUP]
      documents: [DOC-PL]
      
    - id: DOCUMENTS_READY
      type: ready
      description: "All documents generated"
      entry_actions:
        - generate_all_documents
        - validate_documents
        - package_documents
      allowed_transitions: [AWAITING_CARRIER, READY_FOR_PICKUP, LOADING]
      documents: [DOC-BOL, DOC-MTR, DOC-COC, DOC-WT]
      
    - id: READY_FOR_PICKUP
      type: waiting
      description: "Ready for customer will-call pickup"
      entry_actions:
        - notify_customer_ready
        - update_will_call_board
      allowed_transitions: [CUSTOMER_ARRIVED, CANCELLED]
      timeout_hours: 72
      timeout_action: notify_customer_reminder
      documents: [DOC-READY-NOTIF]
      
    - id: CUSTOMER_ARRIVED
      type: processing
      description: "Customer on-site for pickup"
      entry_actions:
        - verify_identity
        - assign_dock
      allowed_transitions: [LOADING, IDENTITY_ISSUE]
      documents: []
      
    - id: IDENTITY_ISSUE
      type: blocked
      description: "Customer identity verification failed"
      entry_actions:
        - log_issue
        - notify_supervisor
        - contact_account_holder
      allowed_transitions: [CUSTOMER_ARRIVED, READY_FOR_PICKUP]
      documents: []
      
    - id: AWAITING_CARRIER
      type: waiting
      description: "Waiting for carrier to arrive"
      entry_actions:
        - notify_carrier
        - track_carrier_eta
      allowed_transitions: [CARRIER_ARRIVED, CARRIER_NO_SHOW]
      timeout_hours: 4
      timeout_action: contact_carrier
      documents: []
      
    - id: CARRIER_NO_SHOW
      type: exception
      description: "Carrier did not arrive as scheduled"
      entry_actions:
        - log_no_show
        - contact_carrier
        - reschedule_or_rebook
      allowed_transitions: [AWAITING_CARRIER, DOCUMENTS_READY]
      documents: []
      
    - id: CARRIER_ARRIVED
      type: processing
      description: "Carrier on-site for pickup"
      entry_actions:
        - check_in_driver
        - assign_dock
        - verify_carrier_equipment
      allowed_transitions: [LOADING, EQUIPMENT_ISSUE]
      documents: []
      
    - id: EQUIPMENT_ISSUE
      type: blocked
      description: "Carrier equipment unsuitable"
      entry_actions:
        - log_issue
        - notify_carrier
        - find_alternative
      allowed_transitions: [CARRIER_ARRIVED, AWAITING_CARRIER]
      documents: []
      
    - id: LOADING
      type: processing
      description: "Material being loaded"
      entry_actions:
        - start_loading
        - track_load_progress
      allowed_transitions: [LOADED, LOADING_ISSUE]
      timeout_hours: 2
      timeout_action: notify_shipping_supervisor
      documents: []
      
    - id: LOADING_ISSUE
      type: blocked
      description: "Problem during loading"
      entry_actions:
        - log_issue
        - assess_damage
        - notify_supervisor
      allowed_transitions: [LOADING, STAGED]
      documents: []
      
    - id: LOADED
      type: checkpoint
      description: "Loading complete"
      entry_actions:
        - verify_load
        - capture_weights
        - take_photos
      allowed_transitions: [WEIGHING, FINAL_DOCS]
      documents: []
      
    - id: WEIGHING
      type: processing
      description: "Truck being weighed"
      entry_actions:
        - capture_gross_weight
        - calculate_net_weight
        - validate_weight
      allowed_transitions: [WEIGHT_VERIFIED, WEIGHT_DISCREPANCY]
      documents: [DOC-WT]
      
    - id: WEIGHT_DISCREPANCY
      type: blocked
      description: "Weight differs significantly from expected"
      entry_actions:
        - log_discrepancy
        - recount_if_needed
        - notify_billing
      allowed_transitions: [WEIGHING, LOADED]
      documents: []
      
    - id: WEIGHT_VERIFIED
      type: checkpoint
      description: "Weight verified and recorded"
      entry_actions:
        - finalize_weight_ticket
        - update_billing_weight
      allowed_transitions: [FINAL_DOCS]
      documents: [DOC-WT]
      
    - id: FINAL_DOCS
      type: processing
      description: "Final document preparation and signing"
      entry_actions:
        - finalize_bol
        - gather_all_documents
        - print_document_package
      allowed_transitions: [SIGNATURE_PENDING]
      documents: [DOC-BOL]
      
    - id: SIGNATURE_PENDING
      type: waiting
      description: "Awaiting driver signature"
      entry_actions:
        - present_documents
        - capture_signature
      allowed_transitions: [DISPATCHED, SIGNATURE_REFUSED]
      timeout_minutes: 15
      timeout_action: escalate_shipping
      documents: [DOC-SIG]
      
    - id: SIGNATURE_REFUSED
      type: exception
      description: "Driver refused to sign"
      entry_actions:
        - log_refusal
        - document_reason
        - escalate_to_manager
      allowed_transitions: [SIGNATURE_PENDING, LOADED]
      documents: []
      
    - id: DISPATCHED
      type: in_transit
      description: "Shipment departed facility"
      entry_actions:
        - record_departure
        - activate_tracking
        - notify_customer
        - generate_gate_pass
      allowed_transitions: [IN_TRANSIT]
      documents: [DOC-GATE]
      
    - id: IN_TRANSIT
      type: in_transit
      description: "Shipment in transit to destination"
      entry_actions:
        - monitor_tracking
        - send_updates
      allowed_transitions: [OUT_FOR_DELIVERY, TRANSIT_EXCEPTION, RETURNED]
      documents: []
      
    - id: TRANSIT_EXCEPTION
      type: exception
      description: "Issue during transit"
      entry_actions:
        - log_exception
        - notify_customer
        - notify_sales
        - initiate_claims_if_needed
      allowed_transitions: [IN_TRANSIT, RETURNED, DELIVERED_DAMAGED]
      documents: [DOC-DD]
      
    - id: OUT_FOR_DELIVERY
      type: in_transit
      description: "Shipment out for final delivery"
      entry_actions:
        - notify_customer_eta
        - prepare_for_delivery_confirm
      allowed_transitions: [DELIVERED, DELIVERY_ATTEMPTED, REFUSED]
      documents: []
      
    - id: DELIVERY_ATTEMPTED
      type: exception
      description: "Delivery attempt failed"
      entry_actions:
        - log_attempt
        - notify_customer
        - schedule_reattempt
      allowed_transitions: [OUT_FOR_DELIVERY, RETURNED, HELD_AT_TERMINAL]
      documents: []
      
    - id: HELD_AT_TERMINAL
      type: waiting
      description: "Shipment held at carrier terminal"
      entry_actions:
        - notify_customer
        - track_hold_status
      allowed_transitions: [OUT_FOR_DELIVERY, RETURNED]
      timeout_days: 5
      timeout_action: initiate_return
      documents: []
      
    - id: REFUSED
      type: exception
      description: "Customer refused delivery"
      entry_actions:
        - log_refusal
        - document_reason
        - notify_sales
        - initiate_return
      allowed_transitions: [RETURNED]
      documents: []
      
    - id: RETURNED
      type: exception
      description: "Shipment returned to origin"
      entry_actions:
        - log_return
        - notify_all_parties
        - assess_restocking
        - create_credit_if_needed
      allowed_transitions: [RECEIVING_RETURN, DISPOSED]
      documents: []
      
    - id: RECEIVING_RETURN
      type: processing
      description: "Return being received and inspected"
      entry_actions:
        - inspect_return
        - assess_condition
        - determine_disposition
      allowed_transitions: [RETURN_PROCESSED]
      documents: [DOC-RMA]
      
    - id: RETURN_PROCESSED
      type: terminal
      description: "Return complete"
      entry_actions:
        - update_inventory
        - process_credit
        - close_return
      allowed_transitions: []
      documents: [DOC-CR]
      
    - id: DISPOSED
      type: terminal
      description: "Material disposed/scrapped"
      entry_actions:
        - log_disposal
        - update_inventory
        - process_write_off
      allowed_transitions: []
      documents: []
      
    - id: DELIVERED
      type: checkpoint
      description: "Shipment delivered to customer"
      entry_actions:
        - confirm_delivery
        - capture_pod
        - notify_customer
        - notify_sales
      allowed_transitions: [DELIVERY_VERIFIED, DELIVERY_EXCEPTION_REPORTED]
      documents: [DOC-POD]
      
    - id: DELIVERED_DAMAGED
      type: exception
      description: "Delivered but with damage"
      entry_actions:
        - document_damage
        - notify_customer
        - initiate_claim
      allowed_transitions: [CLAIM_IN_PROGRESS, DELIVERY_VERIFIED]
      documents: [DOC-DD]
      
    - id: DELIVERY_EXCEPTION_REPORTED
      type: exception
      description: "Customer reported issue with delivery"
      entry_actions:
        - log_exception
        - notify_customer_service
        - initiate_investigation
      allowed_transitions: [CLAIM_IN_PROGRESS, DELIVERY_VERIFIED]
      documents: [DOC-DD]
      
    - id: CLAIM_IN_PROGRESS
      type: processing
      description: "Damage/shortage claim being processed"
      entry_actions:
        - create_claim_record
        - gather_documentation
        - file_carrier_claim
      allowed_transitions: [CLAIM_RESOLVED, DELIVERY_VERIFIED]
      documents: []
      
    - id: CLAIM_RESOLVED
      type: checkpoint
      description: "Claim resolved"
      entry_actions:
        - record_resolution
        - process_credit_if_applicable
        - close_claim
      allowed_transitions: [DELIVERY_VERIFIED]
      documents: [DOC-CR]
      
    - id: DELIVERY_VERIFIED
      type: checkpoint
      description: "Delivery verified complete"
      entry_actions:
        - mark_delivery_complete
        - trigger_billing
      allowed_transitions: [INVOICED]
      documents: []
      
    - id: INVOICED
      type: processing
      description: "Invoice generated"
      entry_actions:
        - generate_invoice
        - send_invoice
        - update_ar
      allowed_transitions: [COMPLETE, BILLING_DISPUTE]
      documents: [DOC-INV]
      
    - id: BILLING_DISPUTE
      type: exception
      description: "Customer disputing invoice"
      entry_actions:
        - log_dispute
        - investigate
        - notify_ar
      allowed_transitions: [INVOICED, COMPLETE]
      documents: []
      
    - id: COMPLETE
      type: terminal
      description: "Shipment lifecycle complete"
      entry_actions:
        - archive_documents
        - update_customer_portal
        - close_shipment
      allowed_transitions: []
      documents: []
      
    - id: CANCELLED
      type: terminal
      description: "Shipment cancelled"
      entry_actions:
        - release_allocations
        - notify_stakeholders
        - log_cancellation_reason
      allowed_transitions: []
      documents: []

  transitions:
    - from: PLANNED
      to: ALLOCATING
      trigger: start_allocation
      guard: order_confirmed
      
    - from: ALLOCATING
      to: ALLOCATED
      trigger: allocation_complete
      guard: all_items_allocated
      
    - from: ALLOCATING
      to: PARTIAL_ALLOCATED
      trigger: allocation_complete
      guard: some_items_backordered
      
    - from: ALLOCATING
      to: BACKORDER
      trigger: allocation_complete
      guard: all_items_backordered
      
    - from: ALLOCATED
      to: RELEASED_TO_SHOP
      trigger: release_to_production
      guard: has_processing
      
    - from: ALLOCATED
      to: PICKING
      trigger: release_to_warehouse
      guard: stock_only
      
    - from: PROCESSING
      to: QA_PENDING
      trigger: processing_complete
      guard: requires_qa
      
    - from: PROCESSING
      to: PICKING
      trigger: processing_complete
      guard: no_qa_required
      
    - from: QA_PASSED
      to: PICKING
      trigger: release_from_qa
      
    - from: PICKING
      to: PICKED
      trigger: all_picks_complete
      
    - from: PICKED
      to: STAGING
      trigger: start_staging
      
    - from: STAGING
      to: STAGED
      trigger: staging_complete
      
    - from: STAGED
      to: DOCUMENTS_READY
      trigger: documents_generated
      
    - from: STAGED
      to: READY_FOR_PICKUP
      trigger: will_call_ready
      guard: delivery_method_will_call
      
    - from: DOCUMENTS_READY
      to: AWAITING_CARRIER
      trigger: carrier_notified
      guard: delivery_method_carrier
      
    - from: DOCUMENTS_READY
      to: LOADING
      trigger: our_truck_assigned
      guard: delivery_method_our_truck
      
    - from: READY_FOR_PICKUP
      to: CUSTOMER_ARRIVED
      trigger: customer_checks_in
      
    - from: CUSTOMER_ARRIVED
      to: LOADING
      trigger: identity_verified
      
    - from: AWAITING_CARRIER
      to: CARRIER_ARRIVED
      trigger: carrier_checks_in
      
    - from: CARRIER_ARRIVED
      to: LOADING
      trigger: dock_assigned
      
    - from: LOADING
      to: LOADED
      trigger: loading_complete
      
    - from: LOADED
      to: WEIGHING
      trigger: proceed_to_scale
      guard: requires_weighing
      
    - from: LOADED
      to: FINAL_DOCS
      trigger: skip_weighing
      guard: weight_not_required
      
    - from: WEIGHING
      to: WEIGHT_VERIFIED
      trigger: weight_accepted
      
    - from: WEIGHT_VERIFIED
      to: FINAL_DOCS
      trigger: proceed_to_docs
      
    - from: FINAL_DOCS
      to: SIGNATURE_PENDING
      trigger: documents_ready
      
    - from: SIGNATURE_PENDING
      to: DISPATCHED
      trigger: signature_captured
      
    - from: DISPATCHED
      to: IN_TRANSIT
      trigger: tracking_active
      
    - from: IN_TRANSIT
      to: OUT_FOR_DELIVERY
      trigger: on_truck_for_delivery
      
    - from: OUT_FOR_DELIVERY
      to: DELIVERED
      trigger: delivery_confirmed
      
    - from: DELIVERED
      to: DELIVERY_VERIFIED
      trigger: no_issues_reported
      
    - from: DELIVERY_VERIFIED
      to: INVOICED
      trigger: invoice_generated
      
    - from: INVOICED
      to: COMPLETE
      trigger: order_complete

  parallel_activities:
    - id: DOCUMENT_GENERATION
      description: "Background document preparation"
      runs_during: [STAGING, STAGED]
      
    - id: TRACKING_UPDATES
      description: "Carrier tracking polling"
      runs_during: [DISPATCHED, IN_TRANSIT, OUT_FOR_DELIVERY]
      
    - id: CUSTOMER_NOTIFICATIONS
      description: "Automated customer updates"
      runs_during: [STAGED, DISPATCHED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED]
```

---

## 4. Billing Triggers — Event List

```json
{
  "billing_triggers": {
    "invoice_generation_events": [
      {
        "event_id": "BILL-001",
        "event_name": "DELIVERY_CONFIRMED",
        "description": "Standard delivery completed and POD captured",
        "trigger_condition": "shipment.delivery_method IN ['DELIVERY', 'SHIP_CARRIER'] AND pod.captured == true",
        "billing_action": "GENERATE_INVOICE",
        "timing": "immediate",
        "invoice_type": "STANDARD",
        "amount_source": "order.total - deposits_paid",
        "documents_attached": ["DOC-POD", "DOC-PL", "DOC-BOL"],
        "exceptions": [
          "order.billing_hold == true",
          "order.bill_on_release == true"
        ]
      },
      {
        "event_id": "BILL-002",
        "event_name": "WILL_CALL_RELEASED",
        "description": "Customer picked up material",
        "trigger_condition": "shipment.delivery_method == 'WILL_CALL' AND signature.captured == true",
        "billing_action": "GENERATE_INVOICE",
        "timing": "immediate",
        "invoice_type": "STANDARD",
        "amount_source": "order.total - deposits_paid",
        "documents_attached": ["DOC-REL", "DOC-PL", "DOC-SIG"],
        "exceptions": ["payment.method == 'PREPAID'"]
      },
      {
        "event_id": "BILL-003",
        "event_name": "CUSTOMER_TRUCK_DEPARTED",
        "description": "Customer's truck left with material",
        "trigger_condition": "shipment.delivery_method == 'CUSTOMER_TRUCK' AND gate_pass.issued == true",
        "billing_action": "GENERATE_INVOICE",
        "timing": "immediate",
        "invoice_type": "STANDARD",
        "amount_source": "order.total - deposits_paid",
        "documents_attached": ["DOC-GATE", "DOC-PL", "DOC-BOL"],
        "exceptions": []
      },
      {
        "event_id": "BILL-004",
        "event_name": "PARTIAL_SHIPMENT_COMPLETE",
        "description": "Partial order shipped",
        "trigger_condition": "shipment.partial == true AND delivery_confirmed == true",
        "billing_action": "GENERATE_PARTIAL_INVOICE",
        "timing": "immediate",
        "invoice_type": "PARTIAL",
        "amount_source": "shipped_lines.total",
        "documents_attached": ["DOC-POD", "DOC-PL"],
        "exceptions": ["customer.bill_complete_only == true"],
        "note": "Creates invoice for shipped portion only"
      },
      {
        "event_id": "BILL-005",
        "event_name": "BILL_ON_RELEASE_SHIPPED",
        "description": "Order flagged for billing at shipment",
        "trigger_condition": "order.bill_on_release == true AND shipment.dispatched == true",
        "billing_action": "GENERATE_INVOICE",
        "timing": "immediate",
        "invoice_type": "STANDARD",
        "amount_source": "order.total - deposits_paid",
        "documents_attached": ["DOC-PL", "DOC-BOL"],
        "exceptions": [],
        "note": "Bills when shipment leaves, not on delivery"
      },
      {
        "event_id": "BILL-006",
        "event_name": "CONSIGNMENT_USAGE_REPORTED",
        "description": "Customer reported usage of consigned material",
        "trigger_condition": "order.type == 'CONSIGNMENT' AND usage_report.received == true",
        "billing_action": "GENERATE_USAGE_INVOICE",
        "timing": "end_of_period",
        "invoice_type": "CONSIGNMENT",
        "amount_source": "usage_report.quantity * unit_price",
        "documents_attached": ["USAGE_REPORT"],
        "exceptions": [],
        "note": "Monthly billing based on reported consumption"
      }
    ],

    "adjustment_events": [
      {
        "event_id": "BILL-010",
        "event_name": "WEIGHT_VARIANCE_DETECTED",
        "description": "Actual shipped weight differs from ordered weight",
        "trigger_condition": "abs(shipped_weight - ordered_weight) > tolerance",
        "billing_action": "CREATE_WEIGHT_ADJUSTMENT",
        "timing": "with_invoice",
        "adjustment_type": "WEIGHT_VARIANCE",
        "amount_source": "(shipped_weight - ordered_weight) * price_per_lb",
        "threshold_pct": 2,
        "approval_required": "variance > 5%",
        "documents_attached": ["DOC-WT"]
      },
      {
        "event_id": "BILL-011",
        "event_name": "PROCESSING_OVERAGE",
        "description": "Actual processing exceeded quoted",
        "trigger_condition": "actual_processing_time > quoted_time * 1.1",
        "billing_action": "CREATE_PROCESSING_ADJUSTMENT",
        "timing": "with_invoice",
        "adjustment_type": "PROCESSING_OVERAGE",
        "amount_source": "overage_time * processing_rate",
        "approval_required": true,
        "customer_notification": true
      },
      {
        "event_id": "BILL-012",
        "event_name": "FREIGHT_ACTUAL_DIFFERS",
        "description": "Actual freight cost differs from quoted",
        "trigger_condition": "actual_freight != quoted_freight",
        "billing_action": "ADJUST_FREIGHT",
        "timing": "with_invoice",
        "adjustment_type": "FREIGHT_ADJUSTMENT",
        "amount_source": "actual_freight - quoted_freight",
        "conditions": {
          "bill_actual_freight": "customer.freight_billing == 'ACTUAL'",
          "absorb_overage": "customer.freight_billing == 'QUOTED'"
        }
      },
      {
        "event_id": "BILL-013",
        "event_name": "RUSH_FEE_APPLICABLE",
        "description": "Rush processing or delivery fee applies",
        "trigger_condition": "order.priority IN ['RUSH', 'HOT'] AND rush_fulfilled == true",
        "billing_action": "ADD_RUSH_CHARGE",
        "timing": "with_invoice",
        "adjustment_type": "RUSH_FEE",
        "amount_source": "rush_fee_schedule[priority][service_type]"
      }
    ],

    "credit_events": [
      {
        "event_id": "BILL-020",
        "event_name": "RETURN_RECEIVED",
        "description": "Returned material received and inspected",
        "trigger_condition": "return.received == true AND inspection.complete == true",
        "billing_action": "CREATE_CREDIT_MEMO",
        "timing": "after_inspection",
        "credit_type": "RETURN",
        "amount_source": "return.approved_items * original_price",
        "restocking_fee": "return.restocking_fee_pct",
        "documents_attached": ["DOC-RMA", "INSPECTION_REPORT"],
        "approval_required": "credit_amount > 500"
      },
      {
        "event_id": "BILL-021",
        "event_name": "SHORTAGE_CONFIRMED",
        "description": "Shortage claim verified",
        "trigger_condition": "shortage_claim.verified == true",
        "billing_action": "CREATE_CREDIT_MEMO",
        "timing": "immediate",
        "credit_type": "SHORTAGE",
        "amount_source": "shortage_quantity * invoiced_price",
        "documents_attached": ["CLAIM_DOCUMENTATION"],
        "approval_required": true
      },
      {
        "event_id": "BILL-022",
        "event_name": "DAMAGE_CLAIM_APPROVED",
        "description": "Damage claim approved",
        "trigger_condition": "damage_claim.status == 'APPROVED'",
        "billing_action": "CREATE_CREDIT_MEMO",
        "timing": "immediate",
        "credit_type": "DAMAGE",
        "amount_source": "claim.approved_amount",
        "carrier_recovery": "claim.carrier_liable",
        "documents_attached": ["DOC-DD", "CLAIM_APPROVAL"],
        "approval_required": true
      },
      {
        "event_id": "BILL-023",
        "event_name": "PRICING_ERROR_IDENTIFIED",
        "description": "Invoice pricing error discovered",
        "trigger_condition": "pricing_dispute.verified == true",
        "billing_action": "CREATE_CREDIT_MEMO",
        "timing": "immediate",
        "credit_type": "PRICE_ADJUSTMENT",
        "amount_source": "invoiced_price - correct_price",
        "documents_attached": ["PRICE_DOCUMENTATION"],
        "approval_required": true
      },
      {
        "event_id": "BILL-024",
        "event_name": "QUALITY_CLAIM_APPROVED",
        "description": "Quality/specification claim approved",
        "trigger_condition": "quality_claim.status == 'APPROVED'",
        "billing_action": "CREATE_CREDIT_MEMO",
        "timing": "immediate",
        "credit_type": "QUALITY",
        "amount_source": "claim.approved_amount",
        "documents_attached": ["QUALITY_CLAIM", "APPROVAL"],
        "approval_required": true,
        "mill_recovery": "claim.mill_liable"
      },
      {
        "event_id": "BILL-025",
        "event_name": "VOLUME_REBATE_EARNED",
        "description": "Customer earned volume rebate",
        "trigger_condition": "customer.period_purchases >= rebate_tier.threshold",
        "billing_action": "CREATE_CREDIT_MEMO",
        "timing": "end_of_period",
        "credit_type": "REBATE",
        "amount_source": "period_purchases * rebate_tier.pct",
        "documents_attached": ["REBATE_CALCULATION"],
        "approval_required": false
      }
    ],

    "deposit_events": [
      {
        "event_id": "BILL-030",
        "event_name": "DEPOSIT_REQUIRED",
        "description": "Order requires upfront deposit",
        "trigger_condition": "order.deposit_required == true OR customer.terms == 'PREPAID'",
        "billing_action": "GENERATE_DEPOSIT_INVOICE",
        "timing": "order_entry",
        "invoice_type": "DEPOSIT",
        "amount_source": "order.deposit_amount",
        "hold_order": true,
        "release_on": "payment.received"
      },
      {
        "event_id": "BILL-031",
        "event_name": "DEPOSIT_RECEIVED",
        "description": "Deposit payment received",
        "trigger_condition": "payment.type == 'DEPOSIT' AND payment.confirmed == true",
        "billing_action": "APPLY_DEPOSIT",
        "timing": "immediate",
        "effect": "release_order_hold",
        "documents_attached": ["PAYMENT_RECEIPT"]
      },
      {
        "event_id": "BILL-032",
        "event_name": "FINAL_INVOICE_WITH_DEPOSIT",
        "description": "Apply deposit to final invoice",
        "trigger_condition": "invoice.type == 'STANDARD' AND order.deposit_paid > 0",
        "billing_action": "APPLY_DEPOSIT_CREDIT",
        "timing": "invoice_generation",
        "amount_source": "invoice.total - order.deposit_paid"
      }
    ],

    "recurring_events": [
      {
        "event_id": "BILL-040",
        "event_name": "STORAGE_BILLING_DUE",
        "description": "Monthly storage charges for held inventory",
        "trigger_condition": "inventory.held_for_customer > 0 AND billing_cycle.end",
        "billing_action": "GENERATE_STORAGE_INVOICE",
        "timing": "first_of_month",
        "invoice_type": "STORAGE",
        "amount_source": "weight_stored * storage_rate * days",
        "documents_attached": ["STORAGE_REPORT"]
      },
      {
        "event_id": "BILL-041",
        "event_name": "BLANKET_ORDER_RELEASE",
        "description": "Release from blanket order",
        "trigger_condition": "order.type == 'BLANKET' AND release.shipped == true",
        "billing_action": "GENERATE_RELEASE_INVOICE",
        "timing": "on_shipment",
        "invoice_type": "RELEASE",
        "amount_source": "release.lines.total",
        "documents_attached": ["DOC-POD", "DOC-PL"]
      },
      {
        "event_id": "BILL-042",
        "event_name": "SERVICE_CONTRACT_BILLING",
        "description": "Periodic service contract billing",
        "trigger_condition": "contract.billing_date == today",
        "billing_action": "GENERATE_CONTRACT_INVOICE",
        "timing": "scheduled",
        "invoice_type": "CONTRACT",
        "amount_source": "contract.period_amount"
      }
    ],

    "special_events": [
      {
        "event_id": "BILL-050",
        "event_name": "COD_SHIPMENT",
        "description": "Cash on delivery collection",
        "trigger_condition": "order.terms == 'COD' AND delivery_confirmed == true",
        "billing_action": "RECORD_COD_COLLECTION",
        "timing": "at_delivery",
        "payment_method": "DRIVER_COLLECT",
        "documents_attached": ["DOC-POD", "PAYMENT_RECEIPT"]
      },
      {
        "event_id": "BILL-051",
        "event_name": "THIRD_PARTY_BILLING",
        "description": "Bill to third party (not ship-to)",
        "trigger_condition": "order.bill_to != order.ship_to",
        "billing_action": "GENERATE_THIRD_PARTY_INVOICE",
        "timing": "on_delivery",
        "invoice_type": "THIRD_PARTY",
        "documents_attached": ["DOC-POD", "DOC-PL"],
        "special_handling": "Verify bill-to authorization"
      },
      {
        "event_id": "BILL-052",
        "event_name": "DROP_SHIP_COMPLETE",
        "description": "Drop ship to end customer complete",
        "trigger_condition": "order.type == 'DROP_SHIP' AND delivery_confirmed == true",
        "billing_action": "GENERATE_DROP_SHIP_INVOICE",
        "timing": "on_delivery",
        "invoice_type": "DROP_SHIP",
        "amount_source": "order.total",
        "documents_attached": ["DOC-POD"],
        "blind_ship": "order.blind_ship"
      },
      {
        "event_id": "BILL-053",
        "event_name": "EXPORT_SHIPMENT_COMPLETE",
        "description": "International/export shipment complete",
        "trigger_condition": "order.international == true AND customs_cleared == true",
        "billing_action": "GENERATE_EXPORT_INVOICE",
        "timing": "on_customs_clearance",
        "invoice_type": "COMMERCIAL_INVOICE",
        "amount_source": "order.total",
        "documents_attached": ["COMMERCIAL_INVOICE", "CUSTOMS_DOCS"]
      }
    ],

    "hold_release_events": [
      {
        "event_id": "BILL-060",
        "event_name": "BILLING_HOLD_PLACED",
        "description": "Invoice generation blocked",
        "trigger_condition": "user.action == 'PLACE_BILLING_HOLD'",
        "billing_action": "HOLD_INVOICE",
        "timing": "immediate",
        "requires_reason": true,
        "notification": ["AR_MANAGER", "SALES_REP"]
      },
      {
        "event_id": "BILL-061",
        "event_name": "BILLING_HOLD_RELEASED",
        "description": "Invoice hold removed",
        "trigger_condition": "user.action == 'RELEASE_BILLING_HOLD' AND approval == true",
        "billing_action": "GENERATE_HELD_INVOICES",
        "timing": "immediate",
        "approval_required": true
      },
      {
        "event_id": "BILL-062",
        "event_name": "CONSOLIDATION_COMPLETE",
        "description": "Multiple shipments ready for consolidated invoice",
        "trigger_condition": "customer.invoice_consolidation == true AND consolidation_period.end == true",
        "billing_action": "GENERATE_CONSOLIDATED_INVOICE",
        "timing": "period_end",
        "invoice_type": "CONSOLIDATED",
        "amount_source": "SUM(pending_shipments.total)"
      }
    ]
  }
}
```

---

## 5. Customer Visibility — Access Matrix

| Document/Data | Anonymous | Guest | Auth Customer | Buyer | Admin | Account Owner | Sales Rep | CSR |
|---------------|:---------:|:-----:|:-------------:|:-----:|:-----:|:-------------:|:---------:|:---:|
| **Order Acknowledgment (DOC-OA)** | ❌ | ❌ | ✅ Own | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Order Status** | ❌ | 🔑 Token | ✅ Own | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Order Line Details** | ❌ | ❌ | ✅ Own | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Pricing Details** | ❌ | ❌ | ✅ Own | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Cost Information** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Assigned | ❌ |
| **Margin Information** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Assigned | ❌ |
| **Work Order (DOC-WO)** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Assigned | ❌ |
| **Shop Traveler (DOC-TRAV)** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Pick Ticket (DOC-PT)** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **QA Report (DOC-QA)** | ❌ | ❌ | 📩 Request | 📩 Request | 📩 Request | 📩 Request | ✅ Assigned | ✅ All |
| **Packing List (DOC-PL)** | ❌ | 🔑 Token | ✅ Own | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Bill of Lading (DOC-BOL)** | ❌ | 🔑 Token | ✅ Own | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Mill Test Report (DOC-MTR)** | ❌ | ❌ | ✅ Own | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Certificate of Conformance (DOC-COC)** | ❌ | ❌ | ✅ Own | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Weight Ticket (DOC-WT)** | ❌ | 🔑 Token | ✅ Own | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Hazmat Papers (DOC-HAZ)** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Proof of Delivery (DOC-POD)** | ❌ | 🔑 Token | ✅ Own | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Invoice (DOC-INV)** | ❌ | ❌ | ✅ Own | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Credit Memo (DOC-CR)** | ❌ | ❌ | ✅ Own | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Shipment Tracking** | ❌ | 🔑 Token | ✅ Own | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Real-time GPS** | ❌ | 🔑 Token | ✅ Own | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Delivery Photos** | ❌ | 🔑 Token | ✅ Own | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Driver Contact** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Assigned | ✅ All |
| **Carrier Information** | ❌ | 🔑 Token | ✅ Own | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Heat/Lot Traceability** | ❌ | ❌ | ✅ Own | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Order History (Own)** | ❌ | ❌ | ✅ Own | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Order History (Company)** | ❌ | ❌ | ❌ | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Analytics Dashboard** | ❌ | ❌ | ❌ | 📊 Limited | ✅ Full | ✅ Full | ✅ Assigned | ❌ |
| **Spending Reports** | ❌ | ❌ | ❌ | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ❌ |
| **Contract Pricing** | ❌ | ❌ | ✅ Own | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Claim Status** | ❌ | ❌ | ✅ Own | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Return Authorization (DOC-RMA)** | ❌ | ❌ | ✅ Own | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Account Balance** | ❌ | ❌ | ❌ | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |
| **Payment History** | ❌ | ❌ | ❌ | ✅ Division | ✅ All | ✅ All | ✅ Assigned | ✅ All |

### Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Full access to specified scope |
| ❌ | No access |
| 🔑 Token | Access via shared tracking link with token |
| 📩 Request | Available on request (manual process) |
| 📊 Limited | Restricted view (summary only) |
| Own | User's own orders only |
| Division | Orders within user's assigned division |
| All | All orders for the customer account |
| Assigned | Orders for assigned customers |

### Customer Portal Access Levels

```json
{
  "customer_portal_roles": [
    {
      "role": "GUEST",
      "description": "Unauthenticated user with tracking link",
      "capabilities": [
        "view_shipment_status",
        "view_eta",
        "view_packing_list",
        "download_pod"
      ],
      "requires": "valid_tracking_token",
      "token_expiry_days": 30
    },
    {
      "role": "AUTH_CUSTOMER",
      "description": "Authenticated customer user",
      "capabilities": [
        "view_own_orders",
        "view_own_documents",
        "track_own_shipments",
        "download_mtrs",
        "download_invoices",
        "request_quote",
        "reorder_from_history"
      ],
      "scope": "OWN_ORDERS"
    },
    {
      "role": "BUYER",
      "description": "Customer purchasing role",
      "capabilities": [
        "view_division_orders",
        "view_division_documents",
        "place_orders",
        "modify_orders_pending",
        "cancel_orders",
        "manage_ship_tos",
        "view_contract_pricing",
        "view_spending_reports",
        "submit_claims"
      ],
      "scope": "DIVISION"
    },
    {
      "role": "ADMIN",
      "description": "Customer administrator",
      "capabilities": [
        "view_all_orders",
        "view_all_documents",
        "manage_users",
        "manage_divisions",
        "manage_ship_tos",
        "view_all_analytics",
        "update_account_info",
        "manage_authorized_pickups",
        "set_user_permissions"
      ],
      "scope": "ACCOUNT"
    },
    {
      "role": "ACCOUNT_OWNER",
      "description": "Primary account contact",
      "capabilities": [
        "all_admin_capabilities",
        "view_credit_info",
        "request_credit_increase",
        "update_billing_info",
        "manage_payment_methods",
        "approve_large_orders"
      ],
      "scope": "ACCOUNT"
    }
  ],

  "notification_preferences": {
    "channels": ["EMAIL", "SMS", "PUSH", "PORTAL"],
    "events": [
      {
        "event": "ORDER_CONFIRMED",
        "default_channels": ["EMAIL", "PORTAL"],
        "customer_configurable": true
      },
      {
        "event": "SHIPMENT_DISPATCHED",
        "default_channels": ["EMAIL", "SMS", "PORTAL"],
        "customer_configurable": true
      },
      {
        "event": "OUT_FOR_DELIVERY",
        "default_channels": ["SMS", "PORTAL"],
        "customer_configurable": true
      },
      {
        "event": "DELIVERED",
        "default_channels": ["EMAIL", "PORTAL"],
        "customer_configurable": true
      },
      {
        "event": "READY_FOR_PICKUP",
        "default_channels": ["SMS", "EMAIL", "PORTAL"],
        "customer_configurable": true
      },
      {
        "event": "INVOICE_GENERATED",
        "default_channels": ["EMAIL", "PORTAL"],
        "customer_configurable": true
      },
      {
        "event": "PAYMENT_DUE_REMINDER",
        "default_channels": ["EMAIL"],
        "customer_configurable": false
      },
      {
        "event": "BACKORDER_UPDATE",
        "default_channels": ["EMAIL", "PORTAL"],
        "customer_configurable": true
      },
      {
        "event": "DELIVERY_EXCEPTION",
        "default_channels": ["EMAIL", "SMS", "PORTAL"],
        "customer_configurable": false
      },
      {
        "event": "MTR_AVAILABLE",
        "default_channels": ["EMAIL", "PORTAL"],
        "customer_configurable": true
      }
    ]
  },

  "document_delivery_methods": [
    {
      "method": "PORTAL_DOWNLOAD",
      "description": "Available in customer portal",
      "retention_days": 2555,
      "format": ["PDF"]
    },
    {
      "method": "EMAIL_ATTACHMENT",
      "description": "Sent as email attachment",
      "max_size_mb": 10,
      "format": ["PDF"]
    },
    {
      "method": "EMAIL_LINK",
      "description": "Email with secure download link",
      "link_expiry_days": 30,
      "format": ["PDF"]
    },
    {
      "method": "EDI",
      "description": "Electronic data interchange",
      "format": ["X12", "EDIFACT"],
      "requires_setup": true
    },
    {
      "method": "API",
      "description": "Programmatic access via API",
      "format": ["JSON", "PDF"],
      "requires_api_key": true
    },
    {
      "method": "FAX",
      "description": "Faxed copy",
      "format": ["PDF"],
      "legacy_support": true
    }
  ],

  "self_service_actions": [
    {
      "action": "REORDER",
      "description": "Create new order from past order",
      "allowed_roles": ["AUTH_CUSTOMER", "BUYER", "ADMIN", "ACCOUNT_OWNER"],
      "restrictions": ["product_still_active", "pricing_may_change"]
    },
    {
      "action": "MODIFY_ORDER",
      "description": "Change order before processing",
      "allowed_roles": ["BUYER", "ADMIN", "ACCOUNT_OWNER"],
      "restrictions": ["order_status IN ['PENDING', 'CONFIRMED']", "before_cutoff_time"]
    },
    {
      "action": "CANCEL_ORDER",
      "description": "Cancel order",
      "allowed_roles": ["BUYER", "ADMIN", "ACCOUNT_OWNER"],
      "restrictions": ["order_status IN ['PENDING', 'CONFIRMED']", "before_processing_starts"],
      "approval_required": "order_total > 5000"
    },
    {
      "action": "CHANGE_DELIVERY_DATE",
      "description": "Request delivery date change",
      "allowed_roles": ["BUYER", "ADMIN", "ACCOUNT_OWNER"],
      "restrictions": ["order_not_shipped"],
      "requires_confirmation": true
    },
    {
      "action": "CHANGE_SHIP_TO",
      "description": "Change shipping address",
      "allowed_roles": ["BUYER", "ADMIN", "ACCOUNT_OWNER"],
      "restrictions": ["order_not_shipped", "address_on_file"],
      "requires_confirmation": true
    },
    {
      "action": "REQUEST_DOCUMENTS",
      "description": "Request additional document copies",
      "allowed_roles": ["AUTH_CUSTOMER", "BUYER", "ADMIN", "ACCOUNT_OWNER"],
      "restrictions": []
    },
    {
      "action": "SUBMIT_CLAIM",
      "description": "Submit shortage/damage claim",
      "allowed_roles": ["BUYER", "ADMIN", "ACCOUNT_OWNER"],
      "restrictions": ["within_claim_window"],
      "required_info": ["photos", "description", "quantity"]
    },
    {
      "action": "REQUEST_RMA",
      "description": "Request return authorization",
      "allowed_roles": ["BUYER", "ADMIN", "ACCOUNT_OWNER"],
      "restrictions": ["within_return_window"],
      "approval_workflow": true
    },
    {
      "action": "PAY_INVOICE",
      "description": "Make online payment",
      "allowed_roles": ["ADMIN", "ACCOUNT_OWNER"],
      "restrictions": [],
      "payment_methods": ["CREDIT_CARD", "ACH"]
    },
    {
      "action": "DOWNLOAD_STATEMENT",
      "description": "Download account statement",
      "allowed_roles": ["ADMIN", "ACCOUNT_OWNER"],
      "restrictions": []
    }
  ]
}
```

---

*Document generated for AI-build Phase 08: Shipping & Documentation*
