# 56 — Build App Modules

> **Purpose:** Structured app/module definitions for hybrid-shell React + MUI platform.  
> **Scope:** Phase 1 internal + portal apps  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. apps

```json
[
  {
    "id": "order_intake_app",
    "label": "Order Intake / Sales Desk",
    "description": "Quote creation, order entry, customer lookup, pricing, and order management for inside sales and CSR teams",
    "primary_roles": ["CSR", "BRANCH_MANAGER", "RETAIL_COUNTER"],
    "core_screens": [
      "customer_search",
      "customer_detail",
      "quote_builder",
      "quote_list",
      "order_entry",
      "order_detail",
      "order_board",
      "product_catalog_search",
      "availability_checker",
      "pricing_calculator",
      "credit_status_panel",
      "rma_entry"
    ],
    "key_entities": [
      "Customer",
      "Quote",
      "QuoteLine",
      "SalesOrder",
      "SalesOrderLine",
      "Product",
      "PriceList",
      "CreditAccount",
      "Contact",
      "ShipToAddress",
      "RMA"
    ],
    "inputs": [
      "customer_master",
      "product_catalog",
      "price_lists",
      "inventory_availability",
      "credit_status",
      "ship_to_addresses",
      "sales_rep_assignments",
      "discount_authorization_limits",
      "commodity_base_prices",
      "customer_contract_pricing"
    ],
    "outputs": [
      "quotes",
      "sales_orders",
      "order_lines",
      "promise_date_requests",
      "credit_check_requests",
      "work_order_requests",
      "rma_requests"
    ],
    "events_emitted": [
      "quote.created",
      "quote.sent",
      "quote.expired",
      "quote.converted",
      "order.created",
      "order.confirmed",
      "order.modified",
      "order.cancelled",
      "order.line_added",
      "order.line_removed",
      "order.rush_requested",
      "order.hold_requested",
      "promise_date.requested",
      "credit_check.requested",
      "rma.created"
    ],
    "events_consumed": [
      "inventory.availability_changed",
      "pricing.updated",
      "credit.limit_changed",
      "credit.hold_placed",
      "credit.hold_released",
      "shipment.shipped",
      "shipment.delivered",
      "work_order.completed",
      "promise_date.confirmed",
      "customer.updated"
    ],
    "dependencies": [
      "inventory_app",
      "billing_trigger_app"
    ]
  },
  {
    "id": "planning_scheduling_app",
    "label": "Planning & Scheduling",
    "description": "Work order creation, scheduling, capacity planning, and production sequencing across work centers",
    "primary_roles": ["PLANNER", "BRANCH_MANAGER"],
    "core_screens": [
      "work_order_list",
      "work_order_detail",
      "scheduling_board",
      "gantt_chart",
      "capacity_dashboard",
      "work_center_view",
      "material_availability_panel",
      "promise_date_calculator",
      "rush_order_queue",
      "scheduling_conflicts",
      "release_queue"
    ],
    "key_entities": [
      "WorkOrder",
      "WorkOrderOperation",
      "WorkCenter",
      "Routing",
      "RoutingStep",
      "CapacitySlot",
      "ScheduleBlock",
      "MaterialAllocation",
      "SetupMatrix"
    ],
    "inputs": [
      "sales_orders",
      "order_lines",
      "work_center_capacity",
      "routing_templates",
      "setup_times",
      "standard_times",
      "material_availability",
      "operator_schedules",
      "maintenance_windows",
      "holiday_calendar"
    ],
    "outputs": [
      "work_orders",
      "schedule_assignments",
      "promise_dates",
      "capacity_forecasts",
      "material_requirements",
      "operator_assignments"
    ],
    "events_emitted": [
      "work_order.created",
      "work_order.scheduled",
      "work_order.released",
      "work_order.prioritized",
      "work_order.rescheduled",
      "work_order.cancelled",
      "promise_date.confirmed",
      "promise_date.changed",
      "capacity.overbooked",
      "capacity.updated",
      "schedule.published",
      "material.allocated",
      "material.shortage_detected"
    ],
    "events_consumed": [
      "order.created",
      "order.modified",
      "order.cancelled",
      "order.rush_requested",
      "operation.completed",
      "operation.delayed",
      "inventory.received",
      "inventory.adjusted",
      "equipment.down",
      "equipment.up",
      "shipment.required_by"
    ],
    "dependencies": [
      "order_intake_app",
      "shop_floor_app",
      "inventory_app"
    ]
  },
  {
    "id": "shop_floor_app",
    "label": "Shop Floor Terminal",
    "description": "Operator interface for job queue, time tracking, output recording, quality checks, and scrap reporting",
    "primary_roles": ["OPERATOR", "QA_MANAGER", "PLANNER"],
    "core_screens": [
      "operator_dashboard",
      "job_queue",
      "active_job_panel",
      "operation_detail",
      "time_clock",
      "output_entry",
      "scrap_entry",
      "quality_check_form",
      "work_instructions_viewer",
      "equipment_status",
      "material_request",
      "ncr_entry",
      "shift_handoff"
    ],
    "key_entities": [
      "WorkOrderOperation",
      "LaborEntry",
      "OutputRecord",
      "ScrapRecord",
      "QualityCheck",
      "QualityResult",
      "NCR",
      "EquipmentStatus",
      "WorkInstruction",
      "Operator"
    ],
    "inputs": [
      "work_order_queue",
      "operation_assignments",
      "work_instructions",
      "quality_specs",
      "inspection_plans",
      "standard_times",
      "operator_certifications",
      "equipment_status",
      "material_locations"
    ],
    "outputs": [
      "labor_entries",
      "output_records",
      "scrap_records",
      "quality_results",
      "ncr_reports",
      "equipment_issues",
      "material_requests",
      "operation_completions"
    ],
    "events_emitted": [
      "operation.started",
      "operation.paused",
      "operation.resumed",
      "operation.completed",
      "operation.delayed",
      "labor.clocked_in",
      "labor.clocked_out",
      "output.recorded",
      "scrap.recorded",
      "quality.passed",
      "quality.failed",
      "ncr.created",
      "equipment.issue_reported",
      "material.requested",
      "shift.ended"
    ],
    "events_consumed": [
      "work_order.released",
      "work_order.prioritized",
      "work_order.cancelled",
      "material.delivered",
      "equipment.maintenance_scheduled",
      "quality.spec_updated",
      "schedule.updated"
    ],
    "dependencies": [
      "planning_scheduling_app",
      "inventory_app"
    ]
  },
  {
    "id": "shipping_receiving_app",
    "label": "Shipping & Receiving Console",
    "description": "Inbound receiving, outbound shipping, BOL generation, carrier coordination, and dock management",
    "primary_roles": ["SHIPPING", "RETAIL_COUNTER"],
    "core_screens": [
      "receiving_dashboard",
      "po_receipt_entry",
      "receipt_inspection",
      "putaway_assignment",
      "shipping_dashboard",
      "shipment_staging",
      "pick_list_generation",
      "bol_generator",
      "packing_slip_generator",
      "carrier_schedule",
      "dock_door_status",
      "will_call_queue",
      "load_verification",
      "weight_capture",
      "mtr_attachment"
    ],
    "key_entities": [
      "PurchaseOrderReceipt",
      "ReceiptLine",
      "PutawayTask",
      "Shipment",
      "ShipmentLine",
      "PickTask",
      "BillOfLading",
      "PackingSlip",
      "Carrier",
      "DockDoor",
      "WillCallOrder",
      "MTRDocument"
    ],
    "inputs": [
      "purchase_orders",
      "sales_orders_to_ship",
      "inventory_locations",
      "carrier_master",
      "freight_rates",
      "dock_schedule",
      "customer_shipping_instructions",
      "hazmat_requirements",
      "weight_tolerances"
    ],
    "outputs": [
      "receipts",
      "inventory_adjustments",
      "shipments",
      "bols",
      "packing_slips",
      "mtr_associations",
      "freight_charges",
      "tracking_numbers"
    ],
    "events_emitted": [
      "receipt.started",
      "receipt.completed",
      "receipt.discrepancy_found",
      "putaway.assigned",
      "putaway.completed",
      "shipment.staged",
      "shipment.loaded",
      "shipment.shipped",
      "shipment.will_call_ready",
      "shipment.will_call_picked_up",
      "bol.generated",
      "carrier.checked_in",
      "carrier.departed",
      "mtr.attached",
      "weight.captured"
    ],
    "events_consumed": [
      "order.ready_to_ship",
      "work_order.completed",
      "po.scheduled_arrival",
      "carrier.arrival_scheduled",
      "inventory.staged",
      "billing.invoice_required"
    ],
    "dependencies": [
      "order_intake_app",
      "inventory_app",
      "billing_trigger_app"
    ]
  },
  {
    "id": "inventory_app",
    "label": "Inventory Management",
    "description": "Inventory visibility, movements, adjustments, transfers, cycle counts, and location management",
    "primary_roles": ["SHIPPING", "PLANNER", "BRANCH_MANAGER", "PURCHASING"],
    "core_screens": [
      "inventory_search",
      "inventory_detail",
      "location_browser",
      "stock_status_dashboard",
      "movement_entry",
      "transfer_request",
      "adjustment_entry",
      "cycle_count_list",
      "cycle_count_entry",
      "reorder_review",
      "lot_trace",
      "unit_history"
    ],
    "key_entities": [
      "InventoryUnit",
      "InventoryLocation",
      "InventoryMovement",
      "InventoryAdjustment",
      "TransferOrder",
      "CycleCount",
      "CycleCountLine",
      "Lot",
      "Heat",
      "Coil",
      "Bundle"
    ],
    "inputs": [
      "product_catalog",
      "location_master",
      "unit_of_measure",
      "lot_tracking_rules",
      "min_max_levels",
      "abc_classifications",
      "valuation_method"
    ],
    "outputs": [
      "inventory_positions",
      "availability_by_location",
      "movement_history",
      "adjustment_records",
      "transfer_orders",
      "cycle_count_variances",
      "reorder_signals"
    ],
    "events_emitted": [
      "inventory.received",
      "inventory.moved",
      "inventory.adjusted",
      "inventory.transferred",
      "inventory.reserved",
      "inventory.unreserved",
      "inventory.consumed",
      "inventory.scrapped",
      "inventory.availability_changed",
      "inventory.below_min",
      "inventory.above_max",
      "cycle_count.completed",
      "cycle_count.variance_found"
    ],
    "events_consumed": [
      "receipt.completed",
      "shipment.shipped",
      "operation.output_recorded",
      "operation.scrap_recorded",
      "transfer.requested",
      "order.reserved",
      "order.cancelled"
    ],
    "dependencies": []
  },
  {
    "id": "billing_trigger_app",
    "label": "Billing Trigger",
    "description": "Minimal Phase 1 billing: shipment-to-invoice trigger, invoice preview, and billing queue management",
    "primary_roles": ["FINANCE", "BRANCH_MANAGER", "CSR"],
    "core_screens": [
      "billing_queue",
      "invoice_preview",
      "invoice_detail",
      "billing_exceptions",
      "credit_memo_entry",
      "billing_hold_list",
      "batch_invoice_run"
    ],
    "key_entities": [
      "BillingEvent",
      "InvoiceHeader",
      "InvoiceLine",
      "CreditMemo",
      "BillingHold",
      "BillingException"
    ],
    "inputs": [
      "shipped_orders",
      "shipment_details",
      "pricing_at_ship",
      "freight_charges",
      "customer_billing_rules",
      "tax_rates",
      "payment_terms"
    ],
    "outputs": [
      "invoices",
      "credit_memos",
      "billing_exceptions",
      "ar_transactions"
    ],
    "events_emitted": [
      "invoice.created",
      "invoice.sent",
      "invoice.voided",
      "credit_memo.created",
      "billing.exception_raised",
      "billing.hold_placed",
      "billing.hold_released"
    ],
    "events_consumed": [
      "shipment.shipped",
      "shipment.delivered",
      "order.pricing_updated",
      "rma.received",
      "credit.adjustment_required"
    ],
    "dependencies": [
      "shipping_receiving_app",
      "order_intake_app"
    ]
  },
  {
    "id": "customer_status_portal_app",
    "label": "Customer Status Portal",
    "description": "Basic customer self-service: order status, shipment tracking, document access, and reorder capability",
    "primary_roles": ["CUSTOMER_PORTAL"],
    "core_screens": [
      "portal_dashboard",
      "order_list",
      "order_status_detail",
      "shipment_tracking",
      "quote_list",
      "quote_detail",
      "invoice_list",
      "invoice_detail",
      "document_library",
      "mtr_download",
      "reorder_form",
      "contact_us",
      "account_settings"
    ],
    "key_entities": [
      "CustomerAccount",
      "SalesOrder",
      "Shipment",
      "Quote",
      "Invoice",
      "MTRDocument",
      "COADocument",
      "PortalUser"
    ],
    "inputs": [
      "customer_orders",
      "customer_quotes",
      "customer_shipments",
      "customer_invoices",
      "customer_documents",
      "customer_balance",
      "product_catalog_subset"
    ],
    "outputs": [
      "quote_requests",
      "reorders",
      "document_download_logs",
      "contact_requests"
    ],
    "events_emitted": [
      "portal.quote_requested",
      "portal.reorder_placed",
      "portal.document_downloaded",
      "portal.contact_submitted",
      "portal.user_logged_in",
      "portal.user_settings_changed"
    ],
    "events_consumed": [
      "order.status_changed",
      "shipment.status_changed",
      "quote.sent",
      "invoice.created",
      "document.available"
    ],
    "dependencies": [
      "order_intake_app",
      "shipping_receiving_app"
    ]
  },
  {
    "id": "retail_pos_app",
    "label": "Retail Counter POS",
    "description": "Walk-in customer transactions, will-call pickups, cash/card payments, and small-quantity sales",
    "primary_roles": ["RETAIL_COUNTER", "BRANCH_MANAGER"],
    "core_screens": [
      "pos_main",
      "product_lookup",
      "cart_panel",
      "payment_entry",
      "receipt_printer",
      "will_call_lookup",
      "will_call_release",
      "return_entry",
      "drawer_count",
      "end_of_day_closeout",
      "customer_quick_add",
      "cut_ticket_entry"
    ],
    "key_entities": [
      "POSTransaction",
      "POSTransactionLine",
      "Payment",
      "CashDrawer",
      "Receipt",
      "ReturnTransaction",
      "WillCallRelease",
      "CutTicket"
    ],
    "inputs": [
      "product_catalog",
      "inventory_at_location",
      "retail_pricing",
      "tax_rates",
      "payment_methods",
      "will_call_orders",
      "customer_lookup"
    ],
    "outputs": [
      "pos_transactions",
      "payments_collected",
      "receipts",
      "will_call_releases",
      "return_transactions",
      "drawer_reconciliations",
      "cut_tickets"
    ],
    "events_emitted": [
      "pos.transaction_started",
      "pos.transaction_completed",
      "pos.transaction_voided",
      "pos.payment_collected",
      "pos.return_processed",
      "pos.will_call_released",
      "pos.drawer_opened",
      "pos.drawer_counted",
      "pos.day_closed",
      "cut_ticket.created"
    ],
    "events_consumed": [
      "inventory.availability_changed",
      "will_call.ready",
      "pricing.updated",
      "customer.updated"
    ],
    "dependencies": [
      "inventory_app",
      "order_intake_app",
      "shipping_receiving_app"
    ]
  }
]
```

---

## 2. module_interactions

```json
{
  "order_intake_app": [
    "planning_scheduling_app",
    "inventory_app",
    "billing_trigger_app",
    "customer_status_portal_app",
    "retail_pos_app",
    "shipping_receiving_app"
  ],
  "planning_scheduling_app": [
    "order_intake_app",
    "shop_floor_app",
    "inventory_app",
    "shipping_receiving_app"
  ],
  "shop_floor_app": [
    "planning_scheduling_app",
    "inventory_app",
    "shipping_receiving_app"
  ],
  "shipping_receiving_app": [
    "order_intake_app",
    "inventory_app",
    "billing_trigger_app",
    "shop_floor_app",
    "retail_pos_app",
    "customer_status_portal_app"
  ],
  "inventory_app": [
    "order_intake_app",
    "planning_scheduling_app",
    "shop_floor_app",
    "shipping_receiving_app",
    "retail_pos_app"
  ],
  "billing_trigger_app": [
    "order_intake_app",
    "shipping_receiving_app",
    "customer_status_portal_app"
  ],
  "customer_status_portal_app": [
    "order_intake_app",
    "shipping_receiving_app",
    "billing_trigger_app"
  ],
  "retail_pos_app": [
    "order_intake_app",
    "inventory_app",
    "shipping_receiving_app"
  ]
}
```

---

## 3. failure_modes

| app_id | failure_type | visible_effect_on_UI | mitigation_in_UI |
|--------|--------------|----------------------|------------------|
| order_intake_app | inventory_service_unavailable | Availability column shows "Unknown", ATP dates missing | Show cached last-known qty with timestamp badge; allow order entry with "unconfirmed" flag |
| order_intake_app | pricing_service_timeout | Price column shows spinner > 3s | Fall back to cached price list with "may be stale" indicator; allow manual price entry for authorized users |
| order_intake_app | credit_check_failed | Credit status shows error icon | Display last-known credit status; allow order with "credit pending" hold; notify CSR to follow up |
| order_intake_app | customer_search_slow | Search results delayed > 2s | Show skeleton loader; implement typeahead debounce; display "partial results" after timeout |
| planning_scheduling_app | capacity_calculation_timeout | Gantt chart fails to render | Show list view fallback; display "schedule approximate" warning; allow manual drag-drop |
| planning_scheduling_app | work_order_creation_failed | Toast error after submit | Preserve form data in localStorage; show retry button; log to error queue for admin |
| planning_scheduling_app | material_availability_stale | Material panel shows warning icon | Display timestamp of last sync; add manual refresh button; highlight potentially affected work orders |
| shop_floor_app | offline_mode | Banner "Working Offline" | Queue all transactions locally; auto-sync on reconnect; show pending count badge |
| shop_floor_app | time_clock_service_down | Clock in/out buttons disabled | Enable offline punch with local timestamp; sync on recovery; alert supervisor |
| shop_floor_app | quality_spec_load_failed | Inspection form shows error | Allow manual entry with "spec unavailable" flag; require supervisor override to proceed |
| shop_floor_app | barcode_scan_failed | Scan indicator turns red | Show manual entry fallback input; display last 5 scanned items for quick reselect |
| shipping_receiving_app | scale_integration_down | Weight field shows "Manual Entry" | Enable manual weight input; flag shipment for audit; log scale downtime |
| shipping_receiving_app | carrier_api_timeout | Carrier tracking shows spinner | Allow BOL generation without tracking; queue tracking number retrieval; show "tracking pending" |
| shipping_receiving_app | bol_print_failed | Print dialog error | Offer PDF download fallback; queue to alternate printer; save BOL for retry |
| shipping_receiving_app | mtr_upload_failed | Attachment icon shows error | Allow receipt to continue; queue MTR for retry; mark lot as "docs pending" |
| inventory_app | location_lookup_slow | Location browser spinner > 2s | Implement virtual scrolling; show cached location tree; allow location entry by code |
| inventory_app | adjustment_save_failed | Toast error on submit | Preserve adjustment in draft; show retry option; log for supervisor review |
| inventory_app | sync_conflict | Conflict modal appears | Show both versions side-by-side; allow user selection or merge; log resolution |
| billing_trigger_app | invoice_generation_failed | Queue item shows error badge | Display error details; allow retry; enable manual invoice creation |
| billing_trigger_app | tax_calculation_timeout | Tax field shows "Calculating..." | Use cached tax rate with warning; allow manual override for authorized users |
| billing_trigger_app | ar_system_unavailable | "AR Sync Pending" banner | Queue invoices locally; show unsync'd count; auto-retry with exponential backoff |
| customer_status_portal_app | order_data_stale | "Last updated X mins ago" timestamp | Show last-known data with refresh button; explain data may be delayed |
| customer_status_portal_app | document_download_failed | Download icon shows error | Offer retry; provide support contact; log failed download |
| customer_status_portal_app | session_expired | Modal "Session Expired" | Preserve current page state; redirect to login; restore state after re-auth |
| retail_pos_app | payment_terminal_offline | Payment buttons disabled | Show "Cash Only" mode; enable manual card entry for fallback; log affected transactions |
| retail_pos_app | receipt_printer_jammed | Print error toast | Offer email receipt; queue print for retry; allow transaction to complete |
| retail_pos_app | drawer_mismatch | Closeout shows variance alert | Require variance explanation; flag for manager review; block new day until resolved |
| retail_pos_app | inventory_sync_failed | Qty may be inaccurate banner | Allow sale with warning; flag for inventory audit; notify when sync restored |

---

## 4. App Launch Contexts

```json
{
  "order_intake_app": {
    "default_route": "/orders",
    "deep_links": [
      "/orders/:orderId",
      "/quotes/:quoteId",
      "/customers/:customerId",
      "/orders/new?customerId=:customerId",
      "/quotes/new?customerId=:customerId"
    ],
    "launch_from": [
      { "source": "global_search", "context": "customer_id | order_id | quote_id" },
      { "source": "notification", "context": "order_event" },
      { "source": "planning_app", "context": "order_id (view source order)" }
    ]
  },
  "planning_scheduling_app": {
    "default_route": "/planning",
    "deep_links": [
      "/planning/schedule",
      "/planning/work-orders/:workOrderId",
      "/planning/capacity/:workCenterId",
      "/planning/release-queue"
    ],
    "launch_from": [
      { "source": "order_intake_app", "context": "order_id (schedule order)" },
      { "source": "shop_floor_app", "context": "work_order_id (escalate delay)" },
      { "source": "notification", "context": "capacity_alert | schedule_conflict" }
    ]
  },
  "shop_floor_app": {
    "default_route": "/shop-floor",
    "deep_links": [
      "/shop-floor/queue",
      "/shop-floor/job/:operationId",
      "/shop-floor/time-clock",
      "/shop-floor/quality/:checkId"
    ],
    "launch_from": [
      { "source": "planning_app", "context": "work_order_id (view progress)" },
      { "source": "kiosk_mode", "context": "work_center_id" },
      { "source": "notification", "context": "job_assigned | quality_required" }
    ]
  },
  "shipping_receiving_app": {
    "default_route": "/shipping",
    "deep_links": [
      "/shipping/outbound",
      "/shipping/inbound",
      "/shipping/shipment/:shipmentId",
      "/shipping/receipt/:receiptId",
      "/shipping/will-call"
    ],
    "launch_from": [
      { "source": "order_intake_app", "context": "order_id (track shipment)" },
      { "source": "planning_app", "context": "work_order_id (mark complete)" },
      { "source": "notification", "context": "carrier_arrived | shipment_ready" }
    ]
  },
  "inventory_app": {
    "default_route": "/inventory",
    "deep_links": [
      "/inventory/search",
      "/inventory/unit/:unitId",
      "/inventory/location/:locationId",
      "/inventory/cycle-count/:countId",
      "/inventory/movements"
    ],
    "launch_from": [
      { "source": "order_intake_app", "context": "product_id (check availability)" },
      { "source": "shop_floor_app", "context": "material_request_id" },
      { "source": "shipping_app", "context": "lot_id (trace)" }
    ]
  },
  "billing_trigger_app": {
    "default_route": "/billing",
    "deep_links": [
      "/billing/queue",
      "/billing/invoice/:invoiceId",
      "/billing/exceptions"
    ],
    "launch_from": [
      { "source": "shipping_app", "context": "shipment_id (trigger invoice)" },
      { "source": "order_intake_app", "context": "order_id (view invoices)" },
      { "source": "notification", "context": "billing_exception" }
    ]
  },
  "customer_status_portal_app": {
    "default_route": "/portal",
    "deep_links": [
      "/portal/orders",
      "/portal/orders/:orderId",
      "/portal/shipments/:shipmentId",
      "/portal/documents",
      "/portal/quotes"
    ],
    "launch_from": [
      { "source": "email_link", "context": "order_id | shipment_id | invoice_id" },
      { "source": "customer_login", "context": "customer_account_id" }
    ]
  },
  "retail_pos_app": {
    "default_route": "/pos",
    "deep_links": [
      "/pos/sale",
      "/pos/will-call",
      "/pos/returns",
      "/pos/closeout"
    ],
    "launch_from": [
      { "source": "kiosk_mode", "context": "location_id" },
      { "source": "shipping_app", "context": "will_call_order_id" }
    ]
  }
}
```

---

## 5. Shared Shell Integration Points

```json
{
  "shell_provides": [
    "authentication_context",
    "user_profile",
    "role_permissions",
    "tenant_context",
    "location_context",
    "notification_subscription",
    "global_search",
    "theme_provider",
    "error_boundary",
    "offline_indicator",
    "breadcrumb_service",
    "toast_service",
    "modal_service",
    "keyboard_shortcuts"
  ],
  "app_registers": [
    "nav_items",
    "search_providers",
    "notification_handlers",
    "quick_actions",
    "widget_definitions",
    "keyboard_shortcut_handlers"
  ],
  "cross_app_navigation": {
    "method": "shell_router.navigate(app_id, route, context)",
    "context_passing": "query_params | shell_state",
    "back_navigation": "shell_history_stack"
  },
  "shared_components": [
    "CustomerSelector",
    "ProductPicker",
    "LocationSelector",
    "DateRangePicker",
    "QuantityInput",
    "WeightInput",
    "UnitOfMeasureSelector",
    "StatusBadge",
    "DocumentViewer",
    "ConfirmDialog",
    "DataTable",
    "LoadingOverlay",
    "EmptyState"
  ]
}
```

---

## 6. Event Bus Topic Structure

```json
{
  "topics": [
    {
      "pattern": "order.*",
      "publishers": ["order_intake_app"],
      "subscribers": ["planning_scheduling_app", "shipping_receiving_app", "billing_trigger_app", "customer_status_portal_app", "inventory_app"]
    },
    {
      "pattern": "work_order.*",
      "publishers": ["planning_scheduling_app"],
      "subscribers": ["shop_floor_app", "shipping_receiving_app", "order_intake_app"]
    },
    {
      "pattern": "operation.*",
      "publishers": ["shop_floor_app"],
      "subscribers": ["planning_scheduling_app", "inventory_app", "shipping_receiving_app"]
    },
    {
      "pattern": "inventory.*",
      "publishers": ["inventory_app", "shipping_receiving_app", "shop_floor_app"],
      "subscribers": ["order_intake_app", "planning_scheduling_app", "retail_pos_app"]
    },
    {
      "pattern": "shipment.*",
      "publishers": ["shipping_receiving_app"],
      "subscribers": ["order_intake_app", "billing_trigger_app", "customer_status_portal_app", "inventory_app"]
    },
    {
      "pattern": "receipt.*",
      "publishers": ["shipping_receiving_app"],
      "subscribers": ["inventory_app", "planning_scheduling_app"]
    },
    {
      "pattern": "invoice.*",
      "publishers": ["billing_trigger_app"],
      "subscribers": ["customer_status_portal_app", "order_intake_app"]
    },
    {
      "pattern": "pos.*",
      "publishers": ["retail_pos_app"],
      "subscribers": ["inventory_app", "billing_trigger_app"]
    },
    {
      "pattern": "portal.*",
      "publishers": ["customer_status_portal_app"],
      "subscribers": ["order_intake_app"]
    }
  ]
}
```

---

*Document generated for Build Phase: App Module Definitions for Hybrid-Shell Platform*
