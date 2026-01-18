# 61 — Build Shipping & Receiving App

> **Purpose:** UI and document flows for Shipping & Receiving operations.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. workflow_timeline

```json
{
  "stages": [
    {
      "id": "select_jobs",
      "label": "Select Jobs",
      "entry_app": "shipping_receiving_app",
      "description": "Pick completed jobs ready to ship for same customer/destination",
      "entry_conditions": [
        "job.status IN ['READY_TO_SHIP', 'PACKAGING']",
        "job.qc_status == 'PASSED'"
      ],
      "ui_component": "JobSelectionBoard",
      "actions": [
        { "id": "filter_by_customer", "label": "Filter by Customer" },
        { "id": "filter_by_carrier", "label": "Filter by Carrier" },
        { "id": "filter_by_date", "label": "Filter by Ship Date" },
        { "id": "select_job", "label": "Select", "type": "checkbox" },
        { "id": "select_all_customer", "label": "Select All for Customer" },
        { "id": "create_shipment", "label": "Create Shipment", "color": "primary" }
      ],
      "outputs": ["shipment_id", "selected_job_ids", "customer_id", "ship_to_address"],
      "next_stage": "create_packages"
    },
    {
      "id": "create_packages",
      "label": "Create Packages",
      "entry_app": "shipping_receiving_app",
      "description": "Bundle items into packages, assign packaging type, capture weights/dims",
      "entry_conditions": [
        "shipment.status == 'DRAFT'",
        "shipment.jobs.length > 0"
      ],
      "ui_component": "PackagingWorkstation",
      "actions": [
        { "id": "create_package", "label": "New Package", "icon": "add_box" },
        { "id": "add_item_to_package", "label": "Add Item", "type": "drag_drop" },
        { "id": "set_package_type", "label": "Package Type", "options": ["skid", "bundle", "crate", "box", "tube", "drum", "loose"] },
        { "id": "enter_weight", "label": "Weight", "type": "numeric_input", "unit": "lb" },
        { "id": "enter_dimensions", "label": "Dimensions", "type": "dimension_input" },
        { "id": "scan_label", "label": "Scan Package Label", "type": "barcode_input" },
        { "id": "mark_hazmat", "label": "Hazmat", "type": "toggle" },
        { "id": "add_packaging_note", "label": "Note", "type": "text_input" },
        { "id": "confirm_packages", "label": "Confirm Packaging", "color": "primary" }
      ],
      "outputs": ["packages[]", "total_weight", "total_pieces", "package_ids"],
      "next_stage": "assign_carrier"
    },
    {
      "id": "assign_carrier",
      "label": "Assign Carrier",
      "entry_app": "shipping_receiving_app",
      "description": "Select carrier, service level, schedule pickup",
      "entry_conditions": [
        "shipment.status == 'PACKAGED'",
        "shipment.packages.length > 0"
      ],
      "ui_component": "CarrierAssignmentPanel",
      "actions": [
        { "id": "select_carrier", "label": "Carrier", "type": "dropdown", "options_source": "carriers" },
        { "id": "select_service", "label": "Service Level", "type": "dropdown", "options_source": "carrier.services" },
        { "id": "get_rate_quote", "label": "Get Rate", "type": "api_call" },
        { "id": "schedule_pickup", "label": "Schedule Pickup", "type": "datetime_picker" },
        { "id": "use_our_truck", "label": "Our Truck", "type": "toggle" },
        { "id": "select_driver", "label": "Driver", "visible_when": "use_our_truck", "options_source": "drivers" },
        { "id": "select_route", "label": "Route", "visible_when": "use_our_truck", "options_source": "routes" },
        { "id": "confirm_carrier", "label": "Confirm Carrier", "color": "primary" }
      ],
      "outputs": ["carrier_id", "service_level", "freight_cost", "pickup_datetime", "tracking_number"],
      "next_stage": "generate_docs"
    },
    {
      "id": "generate_docs",
      "label": "Generate Documents",
      "entry_app": "shipping_receiving_app",
      "description": "Generate BOL, packing list, labels, cert bundles",
      "entry_conditions": [
        "shipment.status == 'CARRIER_ASSIGNED'",
        "shipment.carrier_id IS NOT NULL"
      ],
      "ui_component": "DocumentGenerationPanel",
      "actions": [
        { "id": "generate_bol", "label": "Generate BOL", "auto": true },
        { "id": "generate_packing_list", "label": "Generate Packing List", "auto": true },
        { "id": "generate_labels", "label": "Print Labels", "type": "print" },
        { "id": "generate_cert_bundle", "label": "Generate Cert Bundle", "conditional": "certs_required" },
        { "id": "attach_custom_doc", "label": "Attach Document", "type": "file_upload" },
        { "id": "preview_doc", "label": "Preview", "type": "modal" },
        { "id": "reprint_doc", "label": "Reprint", "type": "print" },
        { "id": "email_docs", "label": "Email to Customer", "type": "email" },
        { "id": "confirm_docs", "label": "Documents Ready", "color": "primary" }
      ],
      "outputs": ["bol_id", "packing_list_id", "label_ids[]", "cert_bundle_id", "documents_emailed"],
      "next_stage": "dispatch"
    },
    {
      "id": "dispatch",
      "label": "Dispatch",
      "entry_app": "shipping_receiving_app",
      "description": "Release shipment, capture driver signature, update status",
      "entry_conditions": [
        "shipment.status == 'DOCS_READY'",
        "shipment.bol_id IS NOT NULL"
      ],
      "ui_component": "DispatchStation",
      "actions": [
        { "id": "verify_load", "label": "Verify Load", "type": "checklist" },
        { "id": "capture_driver_signature", "label": "Driver Signature", "type": "signature_pad" },
        { "id": "capture_truck_photo", "label": "Photo", "type": "camera", "optional": true },
        { "id": "record_trailer_number", "label": "Trailer #", "type": "text_input" },
        { "id": "record_seal_number", "label": "Seal #", "type": "text_input" },
        { "id": "dispatch_shipment", "label": "Dispatch", "color": "success" }
      ],
      "outputs": ["dispatched_at", "driver_signature", "trailer_number", "seal_number"],
      "next_stage": "in_transit",
      "events_emitted": ["shipment.dispatched", "job.shipped"]
    },
    {
      "id": "in_transit",
      "label": "In Transit",
      "entry_app": "shipping_receiving_app",
      "description": "Track shipment, handle exceptions",
      "entry_conditions": [
        "shipment.status == 'DISPATCHED'"
      ],
      "ui_component": "TransitTracker",
      "actions": [
        { "id": "refresh_tracking", "label": "Refresh Tracking", "type": "api_call" },
        { "id": "report_delay", "label": "Report Delay", "type": "form" },
        { "id": "report_exception", "label": "Report Exception", "type": "form" },
        { "id": "update_eta", "label": "Update ETA", "type": "datetime_picker" },
        { "id": "notify_customer", "label": "Notify Customer", "type": "notification" }
      ],
      "outputs": ["current_location", "eta", "exceptions[]"],
      "next_stage": "confirm_delivery"
    },
    {
      "id": "confirm_delivery",
      "label": "Confirm Delivery",
      "entry_app": "shipping_receiving_app",
      "description": "Record POD, handle shortages/damages, close shipment",
      "entry_conditions": [
        "shipment.status IN ['DISPATCHED', 'IN_TRANSIT']"
      ],
      "ui_component": "DeliveryConfirmation",
      "actions": [
        { "id": "upload_pod", "label": "Upload POD", "type": "file_upload" },
        { "id": "enter_delivery_datetime", "label": "Delivery Time", "type": "datetime_picker" },
        { "id": "record_receiver_name", "label": "Received By", "type": "text_input" },
        { "id": "report_shortage", "label": "Report Shortage", "type": "form" },
        { "id": "report_damage", "label": "Report Damage", "type": "form" },
        { "id": "confirm_delivery", "label": "Confirm Delivery", "color": "success" }
      ],
      "outputs": ["delivered_at", "pod_document_id", "receiver_name", "shortages[]", "damages[]"],
      "events_emitted": ["shipment.delivered", "job.delivered", "billing.ready"]
    }
  ],
  "receiving_stages": [
    {
      "id": "schedule_receipt",
      "label": "Schedule Receipt",
      "entry_app": "shipping_receiving_app",
      "description": "Schedule inbound deliveries, reserve dock door",
      "ui_component": "ReceivingScheduler",
      "actions": [
        { "id": "create_receipt", "label": "New Receipt", "icon": "add" },
        { "id": "link_po", "label": "Link to PO", "type": "lookup" },
        { "id": "set_arrival_window", "label": "Arrival Window", "type": "time_range" },
        { "id": "assign_dock", "label": "Assign Dock", "type": "dropdown" },
        { "id": "notify_warehouse", "label": "Notify Warehouse", "type": "notification" }
      ],
      "outputs": ["receipt_id", "po_id", "scheduled_arrival", "dock_door"]
    },
    {
      "id": "receive_material",
      "label": "Receive Material",
      "entry_app": "shipping_receiving_app",
      "description": "Check in material, verify against PO, capture weights",
      "ui_component": "ReceivingStation",
      "actions": [
        { "id": "scan_carrier_bol", "label": "Scan BOL", "type": "barcode_input" },
        { "id": "verify_po_match", "label": "Verify PO", "type": "checklist" },
        { "id": "count_pieces", "label": "Piece Count", "type": "numeric_input" },
        { "id": "capture_weight", "label": "Weight", "type": "scale_input" },
        { "id": "scan_heat_cert", "label": "Scan MTR", "type": "document_scan" },
        { "id": "report_shortage", "label": "Shortage", "type": "form" },
        { "id": "report_damage", "label": "Damage", "type": "form" },
        { "id": "assign_location", "label": "Assign Location", "type": "location_picker" },
        { "id": "complete_receipt", "label": "Complete Receipt", "color": "success" }
      ],
      "outputs": ["received_items[]", "variance_report", "location_assignments[]"],
      "events_emitted": ["inventory.received", "po.received"]
    },
    {
      "id": "qc_hold",
      "label": "QC Hold",
      "entry_app": "shipping_receiving_app",
      "description": "Hold material pending QC inspection",
      "ui_component": "QCHoldQueue",
      "actions": [
        { "id": "place_on_hold", "label": "Place on Hold", "auto": true },
        { "id": "request_inspection", "label": "Request QC", "type": "notification" },
        { "id": "release_from_hold", "label": "Release", "requires_role": "QA_MANAGER" }
      ],
      "outputs": ["hold_status", "inspection_requested_at", "released_at"]
    },
    {
      "id": "putaway",
      "label": "Putaway",
      "entry_app": "shipping_receiving_app",
      "description": "Move material to storage location",
      "ui_component": "PutawayTask",
      "actions": [
        { "id": "generate_putaway_task", "label": "Generate Task", "auto": true },
        { "id": "scan_material", "label": "Scan Material", "type": "barcode_input" },
        { "id": "scan_location", "label": "Scan Location", "type": "barcode_input" },
        { "id": "confirm_putaway", "label": "Confirm", "color": "success" }
      ],
      "outputs": ["final_location", "putaway_completed_at"],
      "events_emitted": ["inventory.available"]
    }
  ],
  "will_call_stages": [
    {
      "id": "stage_for_pickup",
      "label": "Stage for Pickup",
      "entry_app": "shipping_receiving_app",
      "description": "Move completed orders to will-call staging area",
      "ui_component": "WillCallStaging",
      "actions": [
        { "id": "move_to_staging", "label": "Move to Staging", "type": "location_update" },
        { "id": "print_pickup_ticket", "label": "Print Ticket", "type": "print" },
        { "id": "notify_customer", "label": "Notify Ready", "type": "sms_email" }
      ],
      "outputs": ["staging_location", "pickup_ticket_id", "customer_notified_at"]
    },
    {
      "id": "release_pickup",
      "label": "Release Pickup",
      "entry_app": "shipping_receiving_app",
      "description": "Release material to customer, collect signature",
      "ui_component": "WillCallRelease",
      "actions": [
        { "id": "verify_customer_id", "label": "Verify ID", "type": "id_verification" },
        { "id": "collect_balance", "label": "Collect Balance", "visible_when": "balance_due > 0" },
        { "id": "capture_signature", "label": "Customer Signature", "type": "signature_pad" },
        { "id": "release_material", "label": "Release", "color": "success" }
      ],
      "outputs": ["released_at", "released_to", "customer_signature"],
      "events_emitted": ["job.delivered", "billing.ready"]
    }
  ]
}
```

---

## 2. shipment_states

```yaml
states:
  - id: DRAFT
    label: Draft
    description: Shipment created, jobs selected, not yet packaged
    entry_actions:
      - assign_shipment_number
      - link_jobs_to_shipment
    allowed_transitions:
      - PACKAGED
      - CANCELLED
    
  - id: PACKAGED
    label: Packaged
    description: All items packaged, weights captured
    entry_actions:
      - validate_package_weights
      - calculate_total_weight
    exit_conditions:
      - all_packages_have_weight
      - all_items_assigned_to_package
    allowed_transitions:
      - CARRIER_ASSIGNED
      - DRAFT
      - CANCELLED
    
  - id: CARRIER_ASSIGNED
    label: Carrier Assigned
    description: Carrier selected, rate confirmed
    entry_actions:
      - request_tracking_number
      - schedule_pickup
    allowed_transitions:
      - DOCS_READY
      - PACKAGED
      - CANCELLED
    
  - id: DOCS_READY
    label: Documents Ready
    description: BOL, packing list, labels generated
    entry_actions:
      - generate_bol
      - generate_packing_list
      - generate_package_labels
      - generate_cert_bundle_if_required
    exit_conditions:
      - bol_generated
      - packing_list_generated
      - labels_printed
    allowed_transitions:
      - DISPATCHED
      - CARRIER_ASSIGNED
      - CANCELLED
    
  - id: DISPATCHED
    label: Dispatched
    description: Shipment has left facility
    entry_actions:
      - record_dispatch_time
      - capture_driver_signature
      - update_job_statuses_to_shipped
      - notify_customer_shipped
      - publish_portal_update
    exit_conditions:
      - driver_signature_captured
    allowed_transitions:
      - IN_TRANSIT
      - EXCEPTION
    customer_visible: true
    portal_status: "Shipped"
    
  - id: IN_TRANSIT
    label: In Transit
    description: Shipment en route to destination
    entry_actions:
      - start_tracking_poll
    allowed_transitions:
      - DELIVERED
      - EXCEPTION
      - RETURNED
    customer_visible: true
    portal_status: "In Transit"
    
  - id: DELIVERED
    label: Delivered
    description: Shipment received at destination
    entry_actions:
      - record_delivery_time
      - attach_pod
      - update_job_statuses_to_delivered
      - trigger_billing_ready
      - notify_customer_delivered
      - publish_portal_update
    exit_conditions:
      - pod_received
    allowed_transitions:
      - CLOSED
      - CLAIM_PENDING
    customer_visible: true
    portal_status: "Delivered"
    
  - id: EXCEPTION
    label: Exception
    description: Issue during transit (delay, damage, loss)
    entry_actions:
      - create_exception_record
      - notify_operations
      - notify_customer
    allowed_transitions:
      - IN_TRANSIT
      - DELIVERED
      - RETURNED
      - CLAIM_PENDING
    customer_visible: true
    portal_status: "Delayed"
    
  - id: RETURNED
    label: Returned
    description: Shipment returned to sender
    entry_actions:
      - create_return_receipt
      - update_inventory
      - notify_sales
    allowed_transitions:
      - DRAFT
      - CLAIM_PENDING
      - CLOSED
    customer_visible: true
    portal_status: "Returned"
    
  - id: CLAIM_PENDING
    label: Claim Pending
    description: Damage/shortage claim in process
    entry_actions:
      - create_claim_record
      - notify_claims_team
      - gather_documentation
    allowed_transitions:
      - CLOSED
    customer_visible: true
    portal_status: "Claim in Progress"
    
  - id: CLOSED
    label: Closed
    description: Shipment complete, all billing processed
    entry_actions:
      - archive_documents
      - finalize_job_records
    allowed_transitions: []
    customer_visible: false
    portal_status: "Complete"
    
  - id: CANCELLED
    label: Cancelled
    description: Shipment cancelled before dispatch
    entry_actions:
      - unlink_jobs_from_shipment
      - void_documents
      - release_carrier_booking
    allowed_transitions: []
    customer_visible: false

transitions:
  - from: DRAFT
    to: PACKAGED
    trigger: confirm_packages
    guard: all_items_have_package
    actions:
      - validate_weights
      - lock_job_selection
    
  - from: PACKAGED
    to: CARRIER_ASSIGNED
    trigger: confirm_carrier
    guard: carrier_selected AND freight_terms_confirmed
    actions:
      - request_tracking_number
      - calculate_freight_cost
    
  - from: CARRIER_ASSIGNED
    to: DOCS_READY
    trigger: confirm_docs
    guard: bol_generated AND labels_printed
    actions:
      - validate_documents
      - queue_print_jobs
    
  - from: DOCS_READY
    to: DISPATCHED
    trigger: dispatch_shipment
    guard: driver_signature_captured
    actions:
      - record_dispatch
      - emit_shipped_event
      - notify_customer
    
  - from: DISPATCHED
    to: IN_TRANSIT
    trigger: carrier_scan
    guard: null
    actions:
      - update_tracking
    
  - from: DISPATCHED
    to: DELIVERED
    trigger: confirm_delivery
    guard: pod_uploaded
    actions:
      - record_delivery
      - emit_delivered_event
      - trigger_billing
    
  - from: IN_TRANSIT
    to: DELIVERED
    trigger: confirm_delivery
    guard: pod_uploaded
    actions:
      - record_delivery
      - emit_delivered_event
      - trigger_billing
    
  - from: IN_TRANSIT
    to: EXCEPTION
    trigger: report_exception
    guard: null
    actions:
      - create_exception
      - notify_stakeholders
    
  - from: EXCEPTION
    to: IN_TRANSIT
    trigger: resolve_exception
    guard: exception_resolved
    actions:
      - close_exception
      - update_eta
    
  - from: EXCEPTION
    to: RETURNED
    trigger: initiate_return
    guard: return_authorized
    actions:
      - create_return_shipment
      - notify_warehouse
    
  - from: DELIVERED
    to: CLAIM_PENDING
    trigger: file_claim
    guard: shortage_or_damage_reported
    actions:
      - create_claim
      - gather_docs
    
  - from: DELIVERED
    to: CLOSED
    trigger: close_shipment
    guard: billing_complete AND no_claims
    actions:
      - archive_shipment
    
  - from: CLAIM_PENDING
    to: CLOSED
    trigger: close_claim
    guard: claim_resolved
    actions:
      - finalize_claim
      - archive_shipment
    
  - from: RETURNED
    to: DRAFT
    trigger: reship
    guard: reship_authorized
    actions:
      - reset_shipment
      - keep_original_docs
    
  - from: DRAFT
    to: CANCELLED
    trigger: cancel_shipment
    guard: not_dispatched
    actions:
      - release_jobs
      - void_docs
    
  - from: PACKAGED
    to: CANCELLED
    trigger: cancel_shipment
    guard: not_dispatched
    actions:
      - release_packages
      - release_jobs
    
  - from: CARRIER_ASSIGNED
    to: CANCELLED
    trigger: cancel_shipment
    guard: not_dispatched
    actions:
      - cancel_carrier_booking
      - release_jobs
    
  - from: DOCS_READY
    to: CANCELLED
    trigger: cancel_shipment
    guard: not_dispatched
    actions:
      - void_bol
      - cancel_carrier_booking
      - release_jobs

receiving_states:
  - id: SCHEDULED
    label: Scheduled
    description: Inbound delivery scheduled
    
  - id: ARRIVED
    label: Arrived
    description: Truck at dock
    
  - id: RECEIVING
    label: Receiving
    description: Unloading in progress
    
  - id: QC_HOLD
    label: QC Hold
    description: Pending quality inspection
    
  - id: RECEIVED
    label: Received
    description: Material received, pending putaway
    
  - id: PUTAWAY_COMPLETE
    label: Putaway Complete
    description: Material in storage location
    
  - id: VARIANCE_REVIEW
    label: Variance Review
    description: Shortage or overage requires review
```

---

## 3. documents_required

```json
[
  {
    "id": "BOL",
    "label": "Bill of Lading",
    "type": "shipping_document",
    "triggering_stage": "generate_docs",
    "auto_generate": true,
    "template_id": "bol_standard",
    "data_dependencies": [
      "shipment.shipment_number",
      "shipment.ship_date",
      "customer.company_name",
      "customer.ship_to_address",
      "carrier.name",
      "carrier.scac_code",
      "packages[].weight",
      "packages[].dimensions",
      "packages[].freight_class",
      "packages[].nmfc_code",
      "packages[].description",
      "shipment.total_weight",
      "shipment.total_pieces",
      "shipment.freight_terms",
      "shipment.special_instructions"
    ],
    "visible_to_roles": ["SHIPPING", "BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
    "visible_in_portal": true,
    "portal_availability": "after_dispatch",
    "print_copies": 3,
    "requires_signature": true
  },
  {
    "id": "packing_list",
    "label": "Packing List",
    "type": "shipping_document",
    "triggering_stage": "generate_docs",
    "auto_generate": true,
    "template_id": "packing_list_standard",
    "data_dependencies": [
      "shipment.shipment_number",
      "customer.company_name",
      "customer.ship_to_address",
      "customer.po_number",
      "packages[].package_number",
      "packages[].items[].description",
      "packages[].items[].quantity",
      "packages[].items[].uom",
      "packages[].items[].job_number",
      "packages[].items[].line_number",
      "packages[].items[].heat_number",
      "packages[].weight",
      "shipment.total_pieces",
      "shipment.total_weight"
    ],
    "visible_to_roles": ["SHIPPING", "BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN", "CSR"],
    "visible_in_portal": true,
    "portal_availability": "after_dispatch",
    "print_copies": 2,
    "requires_signature": false
  },
  {
    "id": "package_labels",
    "label": "Package Labels",
    "type": "label",
    "triggering_stage": "generate_docs",
    "auto_generate": true,
    "template_id": "package_label_4x6",
    "data_dependencies": [
      "package.package_number",
      "package.barcode",
      "shipment.shipment_number",
      "customer.company_name",
      "customer.ship_to_address.city",
      "customer.ship_to_address.state",
      "package.weight",
      "package.piece_count",
      "package.package_of_total"
    ],
    "visible_to_roles": ["SHIPPING", "OPERATOR"],
    "visible_in_portal": false,
    "print_copies": 1,
    "printer_type": "label_printer"
  },
  {
    "id": "carrier_labels",
    "label": "Carrier Labels",
    "type": "label",
    "triggering_stage": "generate_docs",
    "auto_generate": true,
    "generation_method": "carrier_api",
    "data_dependencies": [
      "carrier.id",
      "shipment.tracking_number",
      "package.weight",
      "package.dimensions",
      "customer.ship_to_address"
    ],
    "visible_to_roles": ["SHIPPING"],
    "visible_in_portal": false,
    "print_copies": 1,
    "printer_type": "label_printer"
  },
  {
    "id": "cert_bundle",
    "label": "Certification Bundle",
    "type": "compliance_document",
    "triggering_stage": "generate_docs",
    "auto_generate": false,
    "generation_condition": "any(jobs.certs_required)",
    "template_id": "cert_bundle_cover",
    "data_dependencies": [
      "shipment.shipment_number",
      "customer.company_name",
      "jobs[].job_number",
      "jobs[].items[].heat_number",
      "jobs[].items[].mtr_document_id",
      "jobs[].items[].coa_document_id",
      "jobs[].items[].coc_document_id",
      "jobs[].qc_records[].test_results"
    ],
    "included_documents": [
      { "type": "MTR", "source": "heat.mtr_document" },
      { "type": "COA", "source": "material.coa_document" },
      { "type": "COC", "source": "job.coc_document" },
      { "type": "test_report", "source": "qc_record.report" }
    ],
    "visible_to_roles": ["SHIPPING", "QA_MANAGER", "BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
    "visible_in_portal": true,
    "portal_availability": "after_dispatch",
    "print_copies": 1
  },
  {
    "id": "commercial_invoice",
    "label": "Commercial Invoice",
    "type": "shipping_document",
    "triggering_stage": "generate_docs",
    "auto_generate": false,
    "generation_condition": "shipment.is_international",
    "template_id": "commercial_invoice",
    "data_dependencies": [
      "shipment.shipment_number",
      "customer.company_name",
      "customer.ship_to_address",
      "customer.ship_to_country",
      "jobs[].items[].description",
      "jobs[].items[].quantity",
      "jobs[].items[].unit_price",
      "jobs[].items[].hs_code",
      "jobs[].items[].country_of_origin",
      "shipment.total_value",
      "shipment.currency"
    ],
    "visible_to_roles": ["SHIPPING", "BRANCH_MANAGER", "FINANCE"],
    "visible_in_portal": true,
    "portal_availability": "after_dispatch",
    "print_copies": 3
  },
  {
    "id": "hazmat_placard",
    "label": "Hazmat Placard",
    "type": "safety_document",
    "triggering_stage": "create_packages",
    "auto_generate": false,
    "generation_condition": "any(packages.is_hazmat)",
    "template_id": "hazmat_placard",
    "data_dependencies": [
      "package.hazmat_class",
      "package.un_number",
      "package.proper_shipping_name",
      "package.packing_group"
    ],
    "visible_to_roles": ["SHIPPING", "BRANCH_MANAGER"],
    "visible_in_portal": false,
    "print_copies": 4
  },
  {
    "id": "delivery_receipt",
    "label": "Delivery Receipt",
    "type": "shipping_document",
    "triggering_stage": "dispatch",
    "auto_generate": true,
    "template_id": "delivery_receipt",
    "data_dependencies": [
      "shipment.shipment_number",
      "customer.company_name",
      "customer.ship_to_address",
      "packages[].package_number",
      "packages[].description",
      "shipment.total_pieces"
    ],
    "visible_to_roles": ["SHIPPING"],
    "visible_in_portal": false,
    "print_copies": 2,
    "requires_signature": true,
    "signature_field": "receiver_signature"
  },
  {
    "id": "pod",
    "label": "Proof of Delivery",
    "type": "confirmation_document",
    "triggering_stage": "confirm_delivery",
    "auto_generate": false,
    "source": "carrier_api_or_upload",
    "data_dependencies": [
      "shipment.tracking_number",
      "delivery.timestamp",
      "delivery.receiver_name",
      "delivery.signature"
    ],
    "visible_to_roles": ["SHIPPING", "CSR", "BRANCH_MANAGER", "DIVISION_MANAGER", "FINANCE"],
    "visible_in_portal": true,
    "portal_availability": "after_delivery"
  },
  {
    "id": "will_call_ticket",
    "label": "Will-Call Pickup Ticket",
    "type": "pickup_document",
    "triggering_stage": "stage_for_pickup",
    "auto_generate": true,
    "template_id": "will_call_ticket",
    "data_dependencies": [
      "job.job_number",
      "customer.company_name",
      "job.items[].description",
      "job.items[].quantity",
      "staging.location",
      "job.balance_due"
    ],
    "visible_to_roles": ["SHIPPING", "RETAIL_COUNTER"],
    "visible_in_portal": false,
    "print_copies": 1
  },
  {
    "id": "receiving_report",
    "label": "Receiving Report",
    "type": "receiving_document",
    "triggering_stage": "receive_material",
    "auto_generate": true,
    "template_id": "receiving_report",
    "data_dependencies": [
      "receipt.receipt_number",
      "receipt.po_number",
      "vendor.name",
      "receipt.items[].description",
      "receipt.items[].quantity_ordered",
      "receipt.items[].quantity_received",
      "receipt.items[].variance",
      "receipt.total_weight"
    ],
    "visible_to_roles": ["SHIPPING", "PURCHASING", "BRANCH_MANAGER"],
    "visible_in_portal": false,
    "print_copies": 1
  }
]
```

---

## 4. billing_triggers

```json
{
  "shipment_triggers": [
    {
      "event": "shipment.delivered",
      "trigger_type": "automatic",
      "billing_action": "create_invoice_draft",
      "conditions": [
        "shipment.freight_terms IN ['prepaid', 'prepaid_add', 'our_truck']",
        "shipment.status == 'DELIVERED'",
        "pod_received == true"
      ],
      "data_passed_to_billing": [
        "shipment_id",
        "job_ids[]",
        "customer_id",
        "delivery_date",
        "freight_charges",
        "pod_document_id"
      ],
      "delay_hours": 0,
      "notify_roles": ["FINANCE"]
    },
    {
      "event": "shipment.dispatched",
      "trigger_type": "automatic",
      "billing_action": "create_invoice_draft",
      "conditions": [
        "customer.billing_preference == 'on_ship'",
        "shipment.status == 'DISPATCHED'"
      ],
      "data_passed_to_billing": [
        "shipment_id",
        "job_ids[]",
        "customer_id",
        "ship_date",
        "freight_charges"
      ],
      "delay_hours": 0,
      "notify_roles": ["FINANCE"]
    }
  ],
  "job_triggers": [
    {
      "event": "job.delivered",
      "trigger_type": "automatic",
      "billing_action": "mark_job_billable",
      "conditions": [
        "job.status == 'DELIVERED'",
        "job.billing_status == 'pending'"
      ],
      "data_passed_to_billing": [
        "job_id",
        "order_id",
        "customer_id",
        "line_items[]",
        "processing_charges[]",
        "delivery_date"
      ],
      "delay_hours": 0
    },
    {
      "event": "job.will_call_released",
      "trigger_type": "automatic",
      "billing_action": "mark_job_billable",
      "conditions": [
        "job.freight_terms == 'will_call'",
        "job.released_to_customer == true"
      ],
      "data_passed_to_billing": [
        "job_id",
        "order_id",
        "customer_id",
        "release_date",
        "released_by"
      ],
      "delay_hours": 0
    },
    {
      "event": "job.completed",
      "trigger_type": "automatic",
      "billing_action": "mark_job_billable",
      "conditions": [
        "customer.billing_preference == 'on_complete'",
        "job.status == 'COMPLETED'"
      ],
      "data_passed_to_billing": [
        "job_id",
        "order_id",
        "customer_id",
        "completion_date"
      ],
      "delay_hours": 0
    }
  ],
  "freight_triggers": [
    {
      "event": "freight.cost_confirmed",
      "trigger_type": "automatic",
      "billing_action": "add_freight_charge",
      "conditions": [
        "shipment.freight_terms == 'prepaid_add'",
        "freight.actual_cost IS NOT NULL"
      ],
      "data_passed_to_billing": [
        "shipment_id",
        "freight_cost",
        "carrier_invoice_number"
      ],
      "delay_hours": 24,
      "delay_reason": "Wait for carrier invoice"
    }
  ],
  "exception_triggers": [
    {
      "event": "claim.filed",
      "trigger_type": "automatic",
      "billing_action": "hold_invoice",
      "conditions": [
        "claim.type IN ['shortage', 'damage']",
        "claim.status == 'open'"
      ],
      "data_passed_to_billing": [
        "shipment_id",
        "claim_id",
        "affected_job_ids[]",
        "claim_amount"
      ],
      "hold_reason": "Pending claim resolution"
    },
    {
      "event": "claim.resolved",
      "trigger_type": "automatic",
      "billing_action": "release_invoice_hold",
      "conditions": [
        "claim.status == 'resolved'"
      ],
      "data_passed_to_billing": [
        "shipment_id",
        "claim_id",
        "resolution_type",
        "credit_amount"
      ]
    }
  ],
  "pos_triggers": [
    {
      "event": "pos.transaction_complete",
      "trigger_type": "immediate",
      "billing_action": "record_payment",
      "conditions": [
        "transaction.payment_received == true"
      ],
      "data_passed_to_billing": [
        "transaction_id",
        "payment_method",
        "payment_amount",
        "customer_id"
      ],
      "creates_invoice": true,
      "invoice_status": "paid"
    }
  ],
  "aggregation_rules": [
    {
      "id": "daily_batch",
      "description": "Batch all billable jobs for customer into single invoice",
      "applies_when": "customer.invoice_frequency == 'daily'",
      "group_by": ["customer_id", "ship_to_id"],
      "schedule": "daily_at_1700"
    },
    {
      "id": "weekly_batch",
      "description": "Weekly invoice consolidation",
      "applies_when": "customer.invoice_frequency == 'weekly'",
      "group_by": ["customer_id"],
      "schedule": "friday_at_1700"
    },
    {
      "id": "per_shipment",
      "description": "Invoice per shipment",
      "applies_when": "customer.invoice_frequency == 'per_shipment'",
      "group_by": ["shipment_id"],
      "schedule": "immediate"
    }
  ]
}
```

---

## 5. customer_visibility

| Portal State | Visible Status Label | Internal State Mapping | Docs Visible | Tracking Visible | Actions Available |
|--------------|---------------------|------------------------|--------------|------------------|-------------------|
| `order_received` | Order Received | `ORDERED` | quote, order_confirmation | No | view_order, request_change |
| `in_production` | In Production | `SCHEDULED`, `IN_PROCESS` | order_confirmation | No | view_order, request_update |
| `quality_check` | Quality Check | `WAITING_QC` | None | No | view_order |
| `ready_to_ship` | Ready to Ship | `READY_TO_SHIP`, `PACKAGING` | packing_list (preview) | No | view_order, request_delivery_change |
| `shipped` | Shipped | `DISPATCHED` | BOL, packing_list, cert_bundle | Yes (tracking_url) | view_order, track_shipment |
| `in_transit` | In Transit | `IN_TRANSIT` | BOL, packing_list, cert_bundle | Yes (live_tracking) | track_shipment, report_issue |
| `out_for_delivery` | Out for Delivery | `IN_TRANSIT` (carrier_status) | BOL, packing_list, cert_bundle | Yes (live_tracking) | track_shipment |
| `delivered` | Delivered | `DELIVERED` | BOL, packing_list, cert_bundle, POD | No | download_docs, report_issue, reorder |
| `ready_for_pickup` | Ready for Pickup | `READY_TO_SHIP` (will_call) | packing_list, pickup_instructions | No | view_order, view_hours, get_directions |
| `picked_up` | Picked Up | `DELIVERED` (will_call) | packing_list, receipt | No | download_docs, reorder |
| `delayed` | Delayed | `EXCEPTION` | BOL, packing_list | Yes | track_shipment, contact_support |
| `issue_reported` | Issue Under Review | `CLAIM_PENDING` | BOL, packing_list, claim_reference | No | view_claim_status, contact_support |
| `partial_delivery` | Partial Delivery | `DELIVERED` (partial) | BOL, packing_list, POD | No | download_docs, view_backorder, report_issue |
| `cancelled` | Cancelled | `CANCELLED` | cancellation_notice | No | view_order, contact_support |

### Portal Notification Rules

| Event | Notification Type | Channels | Timing |
|-------|------------------|----------|--------|
| order_confirmed | confirmation | email, portal | immediate |
| production_started | status_update | portal | immediate |
| ready_to_ship | pickup_ready | email, sms, portal | immediate (will_call only) |
| shipped | shipment_notification | email, sms, portal | immediate |
| carrier_update | tracking_update | portal | on_carrier_scan |
| out_for_delivery | delivery_alert | sms, portal | immediate |
| delivered | delivery_confirmation | email, portal | immediate |
| exception | delay_notification | email, sms, portal | immediate |
| claim_update | claim_status | email, portal | on_status_change |

### Document Access Control

| Document | Role: CUSTOMER_PORTAL | Visibility Condition | Download Allowed | Print Allowed |
|----------|----------------------|---------------------|------------------|---------------|
| Order Confirmation | ✓ | always | ✓ | ✓ |
| Quote | ✓ | always | ✓ | ✓ |
| BOL | ✓ | after_dispatch | ✓ | ✓ |
| Packing List | ✓ | after_dispatch | ✓ | ✓ |
| Cert Bundle (MTR/COA) | ✓ | after_dispatch | ✓ | ✓ |
| Commercial Invoice | ✓ | after_dispatch | ✓ | ✓ |
| POD | ✓ | after_delivery | ✓ | ✓ |
| Invoice | ✓ | after_billing | ✓ | ✓ |
| Claim Reference | ✓ | when_claim_open | view_only | ✗ |
| Hazmat Docs | ✗ | never | ✗ | ✗ |
| Internal Notes | ✗ | never | ✗ | ✗ |

---

## 6. Screen Component Summary

```json
{
  "screens": [
    {
      "id": "shipment_board",
      "label": "Shipment Board",
      "layout": "kanban",
      "columns": ["draft", "packaged", "carrier_assigned", "docs_ready", "dispatched", "delivered"],
      "filters": ["customer", "carrier", "ship_date", "priority"],
      "primary_role": "SHIPPING"
    },
    {
      "id": "job_selection_board",
      "label": "Jobs Ready to Ship",
      "layout": "filterable_table",
      "columns": ["job_number", "customer", "ship_to", "items", "weight", "requested_date", "priority"],
      "actions": ["select", "select_all_customer", "create_shipment"],
      "primary_role": "SHIPPING"
    },
    {
      "id": "packaging_workstation",
      "label": "Packaging Workstation",
      "layout": "split_panel",
      "left": "unpackaged_items",
      "right": "packages",
      "interaction": "drag_drop",
      "primary_role": "SHIPPING"
    },
    {
      "id": "carrier_assignment",
      "label": "Carrier Assignment",
      "layout": "form_with_rates",
      "sections": ["shipment_summary", "carrier_selection", "rate_comparison", "pickup_scheduling"],
      "primary_role": "SHIPPING"
    },
    {
      "id": "document_center",
      "label": "Document Center",
      "layout": "document_grid",
      "actions": ["generate", "preview", "print", "email", "download"],
      "primary_role": "SHIPPING"
    },
    {
      "id": "dispatch_station",
      "label": "Dispatch Station",
      "layout": "checklist_form",
      "sections": ["load_verification", "driver_info", "signature_capture"],
      "primary_role": "SHIPPING"
    },
    {
      "id": "transit_tracker",
      "label": "Transit Tracker",
      "layout": "map_with_list",
      "features": ["live_tracking", "eta_updates", "exception_alerts"],
      "primary_role": "SHIPPING"
    },
    {
      "id": "delivery_confirmation",
      "label": "Delivery Confirmation",
      "layout": "form",
      "sections": ["delivery_details", "pod_upload", "exceptions"],
      "primary_role": "SHIPPING"
    },
    {
      "id": "receiving_scheduler",
      "label": "Receiving Scheduler",
      "layout": "calendar_with_list",
      "views": ["day", "week"],
      "primary_role": "SHIPPING"
    },
    {
      "id": "receiving_station",
      "label": "Receiving Station",
      "layout": "scan_and_verify",
      "sections": ["po_lookup", "item_verification", "weight_capture", "location_assignment"],
      "primary_role": "SHIPPING"
    },
    {
      "id": "will_call_staging",
      "label": "Will-Call Staging",
      "layout": "queue_list",
      "columns": ["job_number", "customer", "ready_since", "location", "balance_due"],
      "primary_role": "SHIPPING"
    },
    {
      "id": "will_call_release",
      "label": "Will-Call Release",
      "layout": "verification_form",
      "sections": ["customer_verification", "payment_collection", "signature_capture"],
      "primary_role": "RETAIL_COUNTER"
    }
  ]
}
```

---

*Document generated for Build Phase: Shipping & Receiving App*
