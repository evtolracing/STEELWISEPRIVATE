# 70-BUILD-INTEGRATION-UI-SURFACES

> UI representation of external system integrations (ERP, MES, EDI).

---

## 1. integration_points

```json
[
  {
    "surface": "order_intake_app",
    "screen": "order_entry_form",
    "external_system": "ERP",
    "data_flow_direction": "outbound",
    "description": "Order header and lines pushed to ERP on submit",
    "UI_element": "status_line",
    "placement": "order_header_bar",
    "status_states": ["pending_sync", "synced", "sync_failed", "not_applicable"],
    "actions": ["retry_sync", "view_error", "skip_sync"]
  },
  {
    "surface": "order_intake_app",
    "screen": "order_entry_form",
    "external_system": "EDI",
    "data_flow_direction": "inbound",
    "description": "EDI 850 purchase orders imported as draft orders",
    "UI_element": "badge",
    "placement": "order_source_chip",
    "status_states": ["edi_received", "edi_parsed", "edi_error", "manual_entry"],
    "actions": ["view_raw_edi", "reparse", "convert_to_manual"]
  },
  {
    "surface": "order_intake_app",
    "screen": "order_list",
    "external_system": "ERP",
    "data_flow_direction": "bidirectional",
    "description": "Order sync status indicator per row",
    "UI_element": "icon",
    "placement": "row_status_column",
    "status_states": ["synced", "pending", "failed", "partial"],
    "actions": ["view_sync_details"]
  },
  {
    "surface": "order_intake_app",
    "screen": "order_detail",
    "external_system": "ERP",
    "data_flow_direction": "inbound",
    "description": "Customer credit/AR data pulled from ERP",
    "UI_element": "panel",
    "placement": "customer_info_section",
    "status_states": ["live", "cached", "unavailable"],
    "actions": ["refresh_credit"]
  },
  {
    "surface": "order_intake_app",
    "screen": "customer_lookup",
    "external_system": "ERP",
    "data_flow_direction": "inbound",
    "description": "Customer master synced from ERP",
    "UI_element": "badge",
    "placement": "customer_card",
    "status_states": ["erp_master", "local_only", "sync_pending"],
    "actions": ["push_to_erp", "pull_from_erp"]
  },
  {
    "surface": "order_intake_app",
    "screen": "quote_builder",
    "external_system": "ERP",
    "data_flow_direction": "outbound",
    "description": "Quote synced to ERP CRM module",
    "UI_element": "status_line",
    "placement": "quote_header",
    "status_states": ["draft_local", "synced", "sync_failed"],
    "actions": ["sync_now", "view_in_erp"]
  },
  {
    "surface": "shipping_receiving_app",
    "screen": "receiving_desk",
    "external_system": "EDI",
    "data_flow_direction": "inbound",
    "description": "EDI 856 ASN pre-populates receiving",
    "UI_element": "badge",
    "placement": "receipt_header",
    "status_states": ["asn_matched", "asn_partial", "no_asn", "asn_mismatch"],
    "actions": ["view_asn", "override_asn", "report_discrepancy"]
  },
  {
    "surface": "shipping_receiving_app",
    "screen": "receiving_desk",
    "external_system": "ERP",
    "data_flow_direction": "outbound",
    "description": "Receipt posted to ERP inventory/AP",
    "UI_element": "status_line",
    "placement": "receipt_footer",
    "status_states": ["pending_post", "posted", "post_failed"],
    "actions": ["post_now", "retry", "view_error"]
  },
  {
    "surface": "shipping_receiving_app",
    "screen": "shipping_desk",
    "external_system": "EDI",
    "data_flow_direction": "outbound",
    "description": "EDI 856 ASN generated on ship confirm",
    "UI_element": "icon",
    "placement": "shipment_row",
    "status_states": ["asn_pending", "asn_sent", "asn_ack", "asn_failed"],
    "actions": ["send_asn", "resend", "view_edi"]
  },
  {
    "surface": "shipping_receiving_app",
    "screen": "shipping_desk",
    "external_system": "ERP",
    "data_flow_direction": "outbound",
    "description": "Shipment triggers ERP invoice/delivery",
    "UI_element": "status_line",
    "placement": "shipment_detail_panel",
    "status_states": ["pending_invoice", "invoiced", "invoice_failed"],
    "actions": ["trigger_invoice", "view_invoice", "retry"]
  },
  {
    "surface": "shipping_receiving_app",
    "screen": "bol_generator",
    "external_system": "EDI",
    "data_flow_direction": "outbound",
    "description": "EDI 211 motor carrier tender",
    "UI_element": "badge",
    "placement": "carrier_section",
    "status_states": ["tender_pending", "tender_sent", "tender_accepted", "tender_rejected"],
    "actions": ["send_tender", "view_response", "manual_override"]
  },
  {
    "surface": "shipping_receiving_app",
    "screen": "carrier_tracking",
    "external_system": "EDI",
    "data_flow_direction": "inbound",
    "description": "EDI 214 carrier status updates",
    "UI_element": "panel",
    "placement": "tracking_timeline",
    "status_states": ["awaiting_update", "in_transit", "delivered", "exception"],
    "actions": ["refresh_status", "view_full_history"]
  },
  {
    "surface": "shop_floor_app",
    "screen": "operator_dashboard",
    "external_system": "MES",
    "data_flow_direction": "bidirectional",
    "description": "Work order dispatch from MES; completions to MES",
    "UI_element": "status_line",
    "placement": "job_card_footer",
    "status_states": ["mes_dispatched", "in_progress", "mes_reported", "mes_error"],
    "actions": ["report_complete", "report_scrap", "view_mes_job"]
  },
  {
    "surface": "shop_floor_app",
    "screen": "operator_dashboard",
    "external_system": "MES",
    "data_flow_direction": "inbound",
    "description": "Machine status from MES/PLC",
    "UI_element": "icon",
    "placement": "work_center_header",
    "status_states": ["running", "idle", "down", "offline"],
    "actions": ["view_machine_detail", "report_downtime"]
  },
  {
    "surface": "shop_floor_app",
    "screen": "job_detail_modal",
    "external_system": "MES",
    "data_flow_direction": "inbound",
    "description": "Real-time cycle counts and OEE from MES",
    "UI_element": "panel",
    "placement": "metrics_section",
    "status_states": ["live", "stale", "no_connection"],
    "actions": ["refresh_metrics"]
  },
  {
    "surface": "inventory_app",
    "screen": "inventory_list",
    "external_system": "ERP",
    "data_flow_direction": "bidirectional",
    "description": "Inventory quantities synced with ERP",
    "UI_element": "icon",
    "placement": "row_sync_column",
    "status_states": ["synced", "local_ahead", "erp_ahead", "conflict"],
    "actions": ["push_to_erp", "pull_from_erp", "resolve_conflict"]
  },
  {
    "surface": "inventory_app",
    "screen": "inventory_detail",
    "external_system": "ERP",
    "data_flow_direction": "inbound",
    "description": "Cost and valuation from ERP",
    "UI_element": "panel",
    "placement": "valuation_section",
    "status_states": ["current", "stale", "unavailable"],
    "actions": ["refresh_valuation"]
  },
  {
    "surface": "inventory_app",
    "screen": "adjustment_form",
    "external_system": "ERP",
    "data_flow_direction": "outbound",
    "description": "Adjustments posted to ERP inventory",
    "UI_element": "status_line",
    "placement": "form_footer",
    "status_states": ["pending_post", "posted", "post_failed"],
    "actions": ["post_adjustment", "retry"]
  },
  {
    "surface": "billing_app",
    "screen": "invoice_list",
    "external_system": "ERP",
    "data_flow_direction": "bidirectional",
    "description": "Invoices generated in ERP; status pulled back",
    "UI_element": "badge",
    "placement": "invoice_row",
    "status_states": ["draft", "posted", "paid", "voided", "sync_error"],
    "actions": ["view_in_erp", "resync"]
  },
  {
    "surface": "billing_app",
    "screen": "invoice_detail",
    "external_system": "EDI",
    "data_flow_direction": "outbound",
    "description": "EDI 810 invoice sent to customer",
    "UI_element": "icon",
    "placement": "invoice_header",
    "status_states": ["edi_pending", "edi_sent", "edi_ack", "edi_rejected"],
    "actions": ["send_edi", "resend", "view_edi"]
  },
  {
    "surface": "billing_app",
    "screen": "payment_list",
    "external_system": "ERP",
    "data_flow_direction": "inbound",
    "description": "Payment application from ERP AR",
    "UI_element": "status_line",
    "placement": "payment_row",
    "status_states": ["applied", "pending", "mismatch"],
    "actions": ["view_in_erp", "resolve_mismatch"]
  },
  {
    "surface": "billing_app",
    "screen": "payment_list",
    "external_system": "EDI",
    "data_flow_direction": "inbound",
    "description": "EDI 820 remittance advice",
    "UI_element": "badge",
    "placement": "payment_source",
    "status_states": ["edi_matched", "edi_unmatched", "manual"],
    "actions": ["view_remittance", "match_payment"]
  },
  {
    "surface": "analytics_app",
    "screen": "integration_dashboard",
    "external_system": "ERP",
    "data_flow_direction": "inbound",
    "description": "Sync health and error metrics",
    "UI_element": "panel",
    "placement": "erp_health_card",
    "status_states": ["healthy", "degraded", "down"],
    "actions": ["view_errors", "run_diagnostics"]
  },
  {
    "surface": "analytics_app",
    "screen": "integration_dashboard",
    "external_system": "EDI",
    "data_flow_direction": "bidirectional",
    "description": "EDI transaction volume and error rates",
    "UI_element": "panel",
    "placement": "edi_health_card",
    "status_states": ["healthy", "errors_present", "down"],
    "actions": ["view_transactions", "view_errors"]
  },
  {
    "surface": "analytics_app",
    "screen": "integration_dashboard",
    "external_system": "MES",
    "data_flow_direction": "inbound",
    "description": "MES connection status and data freshness",
    "UI_element": "panel",
    "placement": "mes_health_card",
    "status_states": ["connected", "partial", "disconnected"],
    "actions": ["view_machine_status", "run_diagnostics"]
  },
  {
    "surface": "admin_app",
    "screen": "integration_settings",
    "external_system": "ERP",
    "data_flow_direction": "bidirectional",
    "description": "ERP connection configuration",
    "UI_element": "panel",
    "placement": "erp_config_section",
    "status_states": ["configured", "unconfigured", "test_failed"],
    "actions": ["edit_config", "test_connection", "view_logs"]
  },
  {
    "surface": "admin_app",
    "screen": "integration_settings",
    "external_system": "EDI",
    "data_flow_direction": "bidirectional",
    "description": "EDI trading partner setup",
    "UI_element": "panel",
    "placement": "edi_config_section",
    "status_states": ["active", "inactive", "pending_test"],
    "actions": ["add_partner", "edit_partner", "send_test", "view_logs"]
  },
  {
    "surface": "admin_app",
    "screen": "integration_settings",
    "external_system": "MES",
    "data_flow_direction": "bidirectional",
    "description": "MES connection and work center mapping",
    "UI_element": "panel",
    "placement": "mes_config_section",
    "status_states": ["connected", "disconnected", "partial"],
    "actions": ["edit_config", "map_work_centers", "test_connection"]
  },
  {
    "surface": "admin_app",
    "screen": "sync_queue",
    "external_system": "ERP",
    "data_flow_direction": "outbound",
    "description": "Pending sync jobs to ERP",
    "UI_element": "panel",
    "placement": "queue_list",
    "status_states": ["queued", "processing", "completed", "failed", "retrying"],
    "actions": ["retry", "skip", "view_payload", "clear_queue"]
  },
  {
    "surface": "admin_app",
    "screen": "error_log",
    "external_system": "ERP",
    "data_flow_direction": "bidirectional",
    "description": "ERP sync error history",
    "UI_element": "panel",
    "placement": "error_list",
    "status_states": ["unresolved", "resolved", "ignored"],
    "actions": ["view_detail", "retry", "mark_resolved", "ignore"]
  },
  {
    "surface": "admin_app",
    "screen": "error_log",
    "external_system": "EDI",
    "data_flow_direction": "bidirectional",
    "description": "EDI transaction errors",
    "UI_element": "panel",
    "placement": "error_list",
    "status_states": ["unresolved", "resolved", "ignored"],
    "actions": ["view_raw", "reprocess", "mark_resolved"]
  },
  {
    "surface": "portal_app",
    "screen": "order_status",
    "external_system": "ERP",
    "data_flow_direction": "inbound",
    "description": "Invoice/payment status from ERP",
    "UI_element": "status_line",
    "placement": "order_detail_finance",
    "status_states": ["pending_invoice", "invoiced", "paid", "overdue"],
    "actions": ["view_invoice", "make_payment"]
  },
  {
    "surface": "portal_app",
    "screen": "documents",
    "external_system": "ERP",
    "data_flow_direction": "inbound",
    "description": "Invoice PDFs retrieved from ERP",
    "UI_element": "icon",
    "placement": "document_row",
    "status_states": ["available", "generating", "unavailable"],
    "actions": ["download", "request_regenerate"]
  }
]
```

---

## 2. event_catalog

```json
[
  {
    "event_id": "EDI_850_RECEIVED",
    "external_system": "EDI",
    "direction": "inbound",
    "description": "Purchase order received from trading partner",
    "ui_display": "toast + inbox item",
    "severity": "info",
    "user_action_required": true,
    "action_prompt": "Review and convert to order"
  },
  {
    "event_id": "EDI_850_PARSE_ERROR",
    "external_system": "EDI",
    "direction": "inbound",
    "description": "Failed to parse inbound purchase order",
    "ui_display": "toast + error_log entry",
    "severity": "error",
    "user_action_required": true,
    "action_prompt": "Review raw EDI and fix mapping"
  },
  {
    "event_id": "EDI_855_SENT",
    "external_system": "EDI",
    "direction": "outbound",
    "description": "Purchase order acknowledgment sent",
    "ui_display": "order_status_update",
    "severity": "info",
    "user_action_required": false
  },
  {
    "event_id": "EDI_856_SENT",
    "external_system": "EDI",
    "direction": "outbound",
    "description": "Advance ship notice sent to customer",
    "ui_display": "shipment_status_update",
    "severity": "info",
    "user_action_required": false
  },
  {
    "event_id": "EDI_856_RECEIVED",
    "external_system": "EDI",
    "direction": "inbound",
    "description": "Advance ship notice received from vendor",
    "ui_display": "receiving_desk_alert",
    "severity": "info",
    "user_action_required": false
  },
  {
    "event_id": "EDI_810_SENT",
    "external_system": "EDI",
    "direction": "outbound",
    "description": "Invoice sent to trading partner",
    "ui_display": "invoice_status_update",
    "severity": "info",
    "user_action_required": false
  },
  {
    "event_id": "EDI_810_REJECTED",
    "external_system": "EDI",
    "direction": "inbound",
    "description": "Invoice rejected by trading partner",
    "ui_display": "toast + error_log entry",
    "severity": "error",
    "user_action_required": true,
    "action_prompt": "Review rejection reason and correct invoice"
  },
  {
    "event_id": "EDI_820_RECEIVED",
    "external_system": "EDI",
    "direction": "inbound",
    "description": "Remittance advice received",
    "ui_display": "payment_list_update",
    "severity": "info",
    "user_action_required": false
  },
  {
    "event_id": "EDI_820_MATCH_FAILED",
    "external_system": "EDI",
    "direction": "inbound",
    "description": "Remittance could not be matched to invoices",
    "ui_display": "toast + payment_list_flag",
    "severity": "warning",
    "user_action_required": true,
    "action_prompt": "Manually match remittance to invoices"
  },
  {
    "event_id": "EDI_214_RECEIVED",
    "external_system": "EDI",
    "direction": "inbound",
    "description": "Carrier status update received",
    "ui_display": "tracking_timeline_update",
    "severity": "info",
    "user_action_required": false
  },
  {
    "event_id": "EDI_214_EXCEPTION",
    "external_system": "EDI",
    "direction": "inbound",
    "description": "Carrier reported delivery exception",
    "ui_display": "toast + shipment_flag",
    "severity": "warning",
    "user_action_required": true,
    "action_prompt": "Contact carrier or customer"
  },
  {
    "event_id": "EDI_211_ACCEPTED",
    "external_system": "EDI",
    "direction": "inbound",
    "description": "Carrier accepted freight tender",
    "ui_display": "bol_status_update",
    "severity": "info",
    "user_action_required": false
  },
  {
    "event_id": "EDI_211_REJECTED",
    "external_system": "EDI",
    "direction": "inbound",
    "description": "Carrier rejected freight tender",
    "ui_display": "toast + bol_flag",
    "severity": "warning",
    "user_action_required": true,
    "action_prompt": "Select alternate carrier"
  },
  {
    "event_id": "ERP_ORDER_SYNCED",
    "external_system": "ERP",
    "direction": "outbound",
    "description": "Order successfully created in ERP",
    "ui_display": "order_status_update",
    "severity": "info",
    "user_action_required": false
  },
  {
    "event_id": "ERP_ORDER_SYNC_FAILED",
    "external_system": "ERP",
    "direction": "outbound",
    "description": "Failed to sync order to ERP",
    "ui_display": "toast + order_flag",
    "severity": "error",
    "user_action_required": true,
    "action_prompt": "Review error and retry sync"
  },
  {
    "event_id": "ERP_INVOICE_POSTED",
    "external_system": "ERP",
    "direction": "outbound",
    "description": "Invoice posted in ERP AR",
    "ui_display": "invoice_status_update",
    "severity": "info",
    "user_action_required": false
  },
  {
    "event_id": "ERP_INVOICE_POST_FAILED",
    "external_system": "ERP",
    "direction": "outbound",
    "description": "Invoice failed to post in ERP",
    "ui_display": "toast + invoice_flag",
    "severity": "error",
    "user_action_required": true,
    "action_prompt": "Check ERP for GL issues"
  },
  {
    "event_id": "ERP_PAYMENT_APPLIED",
    "external_system": "ERP",
    "direction": "inbound",
    "description": "Payment applied in ERP AR",
    "ui_display": "payment_list_update",
    "severity": "info",
    "user_action_required": false
  },
  {
    "event_id": "ERP_RECEIPT_POSTED",
    "external_system": "ERP",
    "direction": "outbound",
    "description": "Inventory receipt posted to ERP",
    "ui_display": "receiving_status_update",
    "severity": "info",
    "user_action_required": false
  },
  {
    "event_id": "ERP_RECEIPT_POST_FAILED",
    "external_system": "ERP",
    "direction": "outbound",
    "description": "Failed to post receipt to ERP",
    "ui_display": "toast + receiving_flag",
    "severity": "error",
    "user_action_required": true,
    "action_prompt": "Verify PO in ERP and retry"
  },
  {
    "event_id": "ERP_INVENTORY_SYNC",
    "external_system": "ERP",
    "direction": "bidirectional",
    "description": "Inventory quantities synchronized",
    "ui_display": "silent (log only)",
    "severity": "info",
    "user_action_required": false
  },
  {
    "event_id": "ERP_INVENTORY_CONFLICT",
    "external_system": "ERP",
    "direction": "bidirectional",
    "description": "Inventory quantity mismatch detected",
    "ui_display": "toast + inventory_flag",
    "severity": "warning",
    "user_action_required": true,
    "action_prompt": "Review and resolve conflict"
  },
  {
    "event_id": "ERP_CUSTOMER_SYNCED",
    "external_system": "ERP",
    "direction": "bidirectional",
    "description": "Customer master record synchronized",
    "ui_display": "silent (log only)",
    "severity": "info",
    "user_action_required": false
  },
  {
    "event_id": "ERP_CREDIT_UPDATED",
    "external_system": "ERP",
    "direction": "inbound",
    "description": "Customer credit limit/AR updated from ERP",
    "ui_display": "customer_info_refresh",
    "severity": "info",
    "user_action_required": false
  },
  {
    "event_id": "ERP_CREDIT_HOLD",
    "external_system": "ERP",
    "direction": "inbound",
    "description": "Customer placed on credit hold in ERP",
    "ui_display": "toast + customer_flag",
    "severity": "warning",
    "user_action_required": true,
    "action_prompt": "Confirm before accepting new orders"
  },
  {
    "event_id": "ERP_CONNECTION_LOST",
    "external_system": "ERP",
    "direction": "bidirectional",
    "description": "Lost connection to ERP system",
    "ui_display": "global_banner",
    "severity": "critical",
    "user_action_required": true,
    "action_prompt": "Contact IT / check ERP status"
  },
  {
    "event_id": "ERP_CONNECTION_RESTORED",
    "external_system": "ERP",
    "direction": "bidirectional",
    "description": "ERP connection restored",
    "ui_display": "global_banner_dismiss",
    "severity": "info",
    "user_action_required": false
  },
  {
    "event_id": "MES_JOB_DISPATCHED",
    "external_system": "MES",
    "direction": "outbound",
    "description": "Job dispatched to MES/work center",
    "ui_display": "job_status_update",
    "severity": "info",
    "user_action_required": false
  },
  {
    "event_id": "MES_JOB_STARTED",
    "external_system": "MES",
    "direction": "inbound",
    "description": "Job started on machine",
    "ui_display": "job_status_update",
    "severity": "info",
    "user_action_required": false
  },
  {
    "event_id": "MES_JOB_COMPLETED",
    "external_system": "MES",
    "direction": "inbound",
    "description": "Job completed on machine",
    "ui_display": "job_status_update",
    "severity": "info",
    "user_action_required": false
  },
  {
    "event_id": "MES_SCRAP_REPORTED",
    "external_system": "MES",
    "direction": "inbound",
    "description": "Scrap reported from machine",
    "ui_display": "job_detail_update + qa_alert",
    "severity": "warning",
    "user_action_required": true,
    "action_prompt": "Review scrap reason"
  },
  {
    "event_id": "MES_MACHINE_DOWN",
    "external_system": "MES",
    "direction": "inbound",
    "description": "Machine reported as down",
    "ui_display": "work_center_flag + toast",
    "severity": "critical",
    "user_action_required": true,
    "action_prompt": "Assign maintenance / reschedule jobs"
  },
  {
    "event_id": "MES_MACHINE_UP",
    "external_system": "MES",
    "direction": "inbound",
    "description": "Machine back online",
    "ui_display": "work_center_status_update",
    "severity": "info",
    "user_action_required": false
  },
  {
    "event_id": "MES_CYCLE_COUNT",
    "external_system": "MES",
    "direction": "inbound",
    "description": "Cycle count update from PLC",
    "ui_display": "job_metrics_update",
    "severity": "info",
    "user_action_required": false
  },
  {
    "event_id": "MES_CONNECTION_LOST",
    "external_system": "MES",
    "direction": "bidirectional",
    "description": "Lost connection to MES",
    "ui_display": "shop_floor_banner",
    "severity": "critical",
    "user_action_required": true,
    "action_prompt": "Switch to manual mode / contact IT"
  },
  {
    "event_id": "MES_CONNECTION_RESTORED",
    "external_system": "MES",
    "direction": "bidirectional",
    "description": "MES connection restored",
    "ui_display": "shop_floor_banner_dismiss",
    "severity": "info",
    "user_action_required": false
  },
  {
    "event_id": "SYNC_QUEUE_BACKLOG",
    "external_system": "ERP",
    "direction": "outbound",
    "description": "Sync queue exceeds threshold",
    "ui_display": "admin_alert",
    "severity": "warning",
    "user_action_required": true,
    "action_prompt": "Check ERP performance / clear queue"
  },
  {
    "event_id": "EDI_PARTNER_INACTIVE",
    "external_system": "EDI",
    "direction": "bidirectional",
    "description": "Trading partner marked inactive",
    "ui_display": "admin_notification",
    "severity": "warning",
    "user_action_required": true,
    "action_prompt": "Confirm partner status"
  }
]
```

---

## 3. mapping_rules_summary

### 3.1 Order / Quote Mappings

| SteelWise Entity | ERP Entity | EDI Transaction | Mapping Notes |
|------------------|------------|-----------------|---------------|
| Order | Sales Order | 850 (inbound) | Order.external_id = ERP.sales_order_no; EDI PO# → Order.po_number |
| Order.line_items[] | SO Line Items | 850 segments | Product mapped by SKU or UPC; qty, price, requested_date |
| Order.customer_id | Customer Master | N01/N04 segments | Match by EDI ID or customer.external_id |
| Order.ship_to | Ship-To Address | N3/N4 segments | Address validation required; default to customer.ship_to if omitted |
| Quote | Quote/Opportunity | N/A | Quote.external_id = ERP.quote_no; manual sync or scheduled |
| Order.status | SO Status | 855 (outbound) | Map internal status → EDI acknowledgment codes |

### 3.2 Shipment / Logistics Mappings

| SteelWise Entity | ERP Entity | EDI Transaction | Mapping Notes |
|------------------|------------|-----------------|---------------|
| Shipment | Delivery Note | 856 (outbound) | Shipment.id → ASN reference; triggers ERP delivery creation |
| Shipment.packages[] | Packing List Lines | HL segments | Hierarchical: shipment → order → pack → item |
| Shipment.carrier | Carrier Master | N/A | ERP carrier code for freight cost posting |
| Shipment.tracking_number | Tracking Ref | REF segments | Carrier PRO number / tracking ID |
| ShipmentStatus | Delivery Status | 214 (inbound) | Map carrier codes → internal status enum |
| BOL | Bill of Lading | 211 (outbound) | Tender to carrier; includes weight, class, pickup time |

### 3.3 Inventory Mappings

| SteelWise Entity | ERP Entity | EDI Transaction | Mapping Notes |
|------------------|------------|-----------------|---------------|
| InventoryItem | Inventory Lot/Serial | N/A | Bidirectional sync by product + location + lot |
| InventoryItem.quantity | On-Hand Qty | N/A | Sync delta or full snapshot on schedule |
| InventoryItem.location | Warehouse/Bin | N/A | Map location.code → ERP warehouse + bin |
| InventoryAdjustment | Inventory Movement | N/A | Adjustment → ERP misc receipt/issue |
| Receipt | Goods Receipt | 856 (inbound) | Vendor ASN pre-populates; receipt confirms to ERP |
| Receipt.po_reference | Purchase Order | 850 (outbound) | Link to ERP PO for three-way match |

### 3.4 Billing / Finance Mappings

| SteelWise Entity | ERP Entity | EDI Transaction | Mapping Notes |
|------------------|------------|-----------------|---------------|
| Invoice | AR Invoice | 810 (outbound) | Invoice created in ERP; EDI 810 sent to customer |
| Invoice.line_items[] | Invoice Lines | IT1 segments | Product, qty, price, extended amount |
| Invoice.total | Invoice Total | TDS segment | Gross, discounts, taxes, net |
| Payment | AR Payment | 820 (inbound) | Remittance advice matched to open invoices |
| CreditMemo | AR Credit | N/A | Sync to ERP as negative invoice or credit memo |
| PurchaseOrder | AP PO | 850 (outbound) | Outbound PO to vendor; triggers vendor ASN expectation |

### 3.5 Production / Shop Floor Mappings

| SteelWise Entity | ERP Entity | MES Entity | Mapping Notes |
|------------------|------------|------------|---------------|
| Job | Production Order | Work Order | Job.id ↔ MES.work_order_id; status sync bidirectional |
| Job.operations[] | Routing Steps | Operations | Operation seq, work center, estimated time |
| Job.actual_hours | Labor Posting | Time Report | MES reports time; post to ERP labor |
| Job.scrap_qty | Scrap Transaction | Scrap Report | Scrap reason codes mapped between systems |
| WorkCenter | Work Center | Machine | Work_center.code = MES machine ID |
| WorkCenter.status | N/A | Machine Status | Real-time from MES; no ERP sync |

### 3.6 Customer / Master Data Mappings

| SteelWise Entity | ERP Entity | EDI Segment | Mapping Notes |
|------------------|------------|-------------|---------------|
| Customer | Customer Master | N/A | Bidirectional sync; ERP is master for credit/AR |
| Customer.credit_limit | Credit Limit | N/A | Read-only from ERP |
| Customer.payment_terms | Payment Terms | ITD | ERP terms code → days/discount |
| Customer.edi_partner_id | N/A | ISA/GS | Trading partner qualifier + ID |
| Product | Item Master | N/A | ERP is master; sync to SteelWise nightly |
| Product.price | Price List | N/A | Pull from ERP; local overrides allowed |
| Vendor | Vendor Master | N/A | ERP is master for purchasing |

---

## 4. UI Component Specifications

### 4.1 Sync Status Icons

| status | icon | color | tooltip |
|--------|------|-------|---------|
| synced | CheckCircle | success.main | "Synced with {system}" |
| pending | Sync | warning.main | "Sync pending" |
| failed | Error | error.main | "Sync failed - click for details" |
| partial | WarningAmber | warning.light | "Partially synced" |
| not_applicable | Remove | grey.400 | "No sync required" |
| conflict | Merge | error.light | "Conflict detected - resolution required" |

### 4.2 Sync Status Line Component

```json
{
  "component": "SyncStatusLine",
  "props": {
    "system": "ERP | EDI | MES",
    "status": "synced | pending | failed | partial",
    "lastSyncTime": "ISO timestamp",
    "externalRef": "string (e.g., ERP order no)",
    "errorMessage": "string | null"
  },
  "display": {
    "format": "{icon} {system}: {status} • Last sync: {relative_time}",
    "example": "✓ ERP: Synced • Last sync: 2 min ago"
  },
  "actions": [
    { "condition": "status == failed", "action": "retry", "label": "Retry" },
    { "condition": "status == failed", "action": "view_error", "label": "View Error" },
    { "condition": "status == synced", "action": "view_external", "label": "View in {system}" }
  ]
}
```

### 4.3 Integration Health Panel

```json
{
  "component": "IntegrationHealthPanel",
  "location": "analytics_app > integration_dashboard",
  "sections": [
    {
      "system": "ERP",
      "metrics": [
        { "label": "Connection", "value": "connected | disconnected" },
        { "label": "Sync Queue", "value": "{count} pending" },
        { "label": "Errors (24h)", "value": "{count}" },
        { "label": "Avg Latency", "value": "{ms} ms" }
      ]
    },
    {
      "system": "EDI",
      "metrics": [
        { "label": "Partners Active", "value": "{count}" },
        { "label": "Transactions (24h)", "value": "{count}" },
        { "label": "Errors (24h)", "value": "{count}" },
        { "label": "Pending Acks", "value": "{count}" }
      ]
    },
    {
      "system": "MES",
      "metrics": [
        { "label": "Connection", "value": "connected | partial | disconnected" },
        { "label": "Machines Online", "value": "{count} / {total}" },
        { "label": "Data Freshness", "value": "{seconds} sec" },
        { "label": "Errors (24h)", "value": "{count}" }
      ]
    }
  ]
}
```

### 4.4 Global Integration Banner

```json
{
  "component": "IntegrationBanner",
  "location": "shell > top_bar",
  "triggers": [
    { "event": "ERP_CONNECTION_LOST", "message": "ERP connection lost. Some features may be unavailable.", "severity": "critical" },
    { "event": "MES_CONNECTION_LOST", "message": "MES offline. Shop floor data not updating.", "severity": "critical" },
    { "event": "SYNC_QUEUE_BACKLOG", "message": "Sync queue backed up ({count} items). Updates may be delayed.", "severity": "warning" }
  ],
  "dismiss_on": ["ERP_CONNECTION_RESTORED", "MES_CONNECTION_RESTORED", "queue < threshold"],
  "actions": [
    { "label": "Details", "action": "navigate_to_integration_dashboard" },
    { "label": "Dismiss", "action": "dismiss_banner", "condition": "severity != critical" }
  ]
}
```

---

## 5. Error Display Patterns

### 5.1 Sync Error Toast

```json
{
  "component": "SyncErrorToast",
  "props": {
    "title": "string",
    "message": "string",
    "system": "ERP | EDI | MES",
    "entityType": "order | shipment | invoice | job | inventory",
    "entityId": "string"
  },
  "actions": [
    { "label": "View Details", "action": "open_error_modal" },
    { "label": "Retry", "action": "retry_sync" },
    { "label": "Dismiss", "action": "dismiss" }
  ],
  "auto_dismiss": false,
  "duration_ms": null
}
```

### 5.2 Error Log Table Columns

| column | description | sortable | filterable |
|--------|-------------|----------|------------|
| timestamp | When error occurred | yes | date range |
| system | ERP / EDI / MES | yes | dropdown |
| event_type | Event ID from catalog | yes | dropdown |
| entity_type | order / job / invoice / etc | yes | dropdown |
| entity_id | Link to affected record | no | text search |
| error_code | System-specific error code | yes | text |
| error_message | Human-readable description | no | text search |
| status | unresolved / resolved / ignored | yes | dropdown |
| resolved_by | User who resolved | yes | user picker |
| resolved_at | Resolution timestamp | yes | date range |

---

## 6. Data Freshness Indicators

```json
{
  "freshness_thresholds": {
    "ERP": {
      "live": { "max_age_seconds": 60, "color": "success" },
      "recent": { "max_age_seconds": 300, "color": "warning" },
      "stale": { "max_age_seconds": null, "color": "error" }
    },
    "MES": {
      "live": { "max_age_seconds": 10, "color": "success" },
      "recent": { "max_age_seconds": 60, "color": "warning" },
      "stale": { "max_age_seconds": null, "color": "error" }
    },
    "EDI": {
      "description": "Not real-time; based on last transaction",
      "healthy": { "last_transaction_hours": 24, "color": "success" },
      "warning": { "last_transaction_hours": 72, "color": "warning" },
      "inactive": { "last_transaction_hours": null, "color": "error" }
    }
  },
  "ui_display": {
    "format": "small dot indicator + tooltip with timestamp",
    "placement": "next to data values sourced from external system"
  }
}
```
