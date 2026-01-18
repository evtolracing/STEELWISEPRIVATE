# 74-AI-PORTAL-RFQ-NEGOTIATION

> Phase 22: Customer portal RFQ submission flow and AI-assisted negotiation/pricing for quotes.

---

## 1. rfq_submission_flow

```json
{
  "flow_id": "portal_rfq_submission",
  "steps": [
    {
      "step": 1,
      "name": "start_rfq",
      "screen": "rfq_builder",
      "actions": ["select_from_catalog", "upload_drawing", "paste_from_previous"],
      "validation": []
    },
    {
      "step": 2,
      "name": "add_line_items",
      "screen": "rfq_builder",
      "actions": ["add_item", "specify_qty", "specify_specs", "add_notes"],
      "validation": ["at_least_one_item"]
    },
    {
      "step": 3,
      "name": "upload_attachments",
      "screen": "rfq_attachments",
      "actions": ["upload_drawing", "upload_spec_sheet", "upload_reference"],
      "validation": [],
      "optional": true
    },
    {
      "step": 4,
      "name": "delivery_requirements",
      "screen": "rfq_delivery",
      "actions": ["select_ship_to", "enter_requested_date", "specify_shipping_method"],
      "validation": ["ship_to_required"]
    },
    {
      "step": 5,
      "name": "review_submit",
      "screen": "rfq_review",
      "actions": ["review_summary", "edit_items", "submit_rfq"],
      "validation": ["all_items_complete"]
    },
    {
      "step": 6,
      "name": "confirmation",
      "screen": "rfq_confirmation",
      "actions": ["view_rfq_number", "download_pdf", "return_to_dashboard"]
    }
  ]
}
```

---

## 2. rfq_screens

```json
[
  {
    "screen_id": "rfq_builder",
    "layout": "two_column",
    "components": [
      {
        "id": "item_list",
        "type": "DataTable",
        "columns": ["line", "product", "qty", "specs", "notes", "actions"],
        "editable": true
      },
      {
        "id": "add_item_panel",
        "type": "Panel",
        "children": [
          { "id": "product_search", "type": "Autocomplete", "source": "product_catalog" },
          { "id": "qty_input", "type": "NumberInput", "label": "Quantity" },
          { "id": "spec_fields", "type": "DynamicForm", "fields_from": "product.spec_template" },
          { "id": "notes_input", "type": "TextField", "multiline": true },
          { "id": "add_button", "type": "Button", "label": "Add to RFQ" }
        ]
      },
      {
        "id": "quick_add",
        "type": "ButtonGroup",
        "options": ["Paste from Excel", "Upload Drawing", "Copy from Previous Order"]
      }
    ]
  },
  {
    "screen_id": "rfq_attachments",
    "layout": "single_column",
    "components": [
      {
        "id": "dropzone",
        "type": "FileDropzone",
        "accept": [".pdf", ".dwg", ".dxf", ".xlsx", ".png", ".jpg"],
        "max_size_mb": 25,
        "max_files": 10
      },
      {
        "id": "file_list",
        "type": "List",
        "item_actions": ["preview", "delete", "add_note"]
      },
      {
        "id": "drawing_parser_banner",
        "type": "InfoBanner",
        "text": "We'll extract dimensions from your drawings automatically",
        "icon": "AutoAwesome"
      }
    ]
  },
  {
    "screen_id": "rfq_delivery",
    "layout": "form",
    "components": [
      {
        "id": "ship_to_selector",
        "type": "AddressSelector",
        "source": "customer.ship_to_addresses",
        "allow_new": true
      },
      {
        "id": "requested_date",
        "type": "DatePicker",
        "label": "Requested Delivery Date",
        "min_date": "today + lead_time_estimate"
      },
      {
        "id": "shipping_method",
        "type": "RadioGroup",
        "options": ["Best Way", "Customer Pickup", "Specific Carrier"],
        "conditional_fields": { "Specific Carrier": ["carrier_input", "account_input"] }
      },
      {
        "id": "special_instructions",
        "type": "TextField",
        "multiline": true
      }
    ]
  },
  {
    "screen_id": "rfq_review",
    "layout": "summary",
    "components": [
      {
        "id": "line_summary",
        "type": "Table",
        "columns": ["line", "product", "qty", "specs", "est_price"],
        "footer": "estimated_total"
      },
      {
        "id": "delivery_summary",
        "type": "Card",
        "fields": ["ship_to", "requested_date", "shipping_method"]
      },
      {
        "id": "attachments_summary",
        "type": "ChipList",
        "items_from": "attachments"
      },
      {
        "id": "edit_buttons",
        "type": "ButtonGroup",
        "options": ["Edit Items", "Edit Delivery", "Edit Attachments"]
      },
      {
        "id": "submit_button",
        "type": "Button",
        "variant": "contained",
        "label": "Submit RFQ",
        "action": "submit_rfq"
      }
    ]
  },
  {
    "screen_id": "rfq_confirmation",
    "layout": "centered",
    "components": [
      {
        "id": "success_icon",
        "type": "Icon",
        "icon": "CheckCircle",
        "size": "large",
        "color": "success"
      },
      {
        "id": "rfq_number",
        "type": "Typography",
        "variant": "h4",
        "text": "RFQ #{rfq_number} Submitted"
      },
      {
        "id": "next_steps",
        "type": "List",
        "items": [
          "We'll review your request within 1 business day",
          "You'll receive a quote via email and portal",
          "Questions? Contact your rep at {rep_email}"
        ]
      },
      {
        "id": "action_buttons",
        "type": "ButtonGroup",
        "options": ["Download PDF", "View RFQ", "Back to Dashboard"]
      }
    ]
  }
]
```

---

## 3. ai_quote_generation

```json
{
  "trigger": "rfq_submitted",
  "process": [
    {
      "step": 1,
      "name": "parse_rfq",
      "actions": [
        "extract_line_items",
        "match_products_to_catalog",
        "parse_drawing_dimensions",
        "identify_processing_requirements"
      ]
    },
    {
      "step": 2,
      "name": "price_calculation",
      "actions": [
        "apply_customer_pricing_tier",
        "calculate_material_cost",
        "calculate_processing_cost",
        "apply_quantity_breaks",
        "check_contract_pricing"
      ]
    },
    {
      "step": 3,
      "name": "lead_time_estimation",
      "actions": [
        "check_inventory_availability",
        "estimate_processing_time",
        "account_for_capacity_load",
        "add_shipping_time"
      ]
    },
    {
      "step": 4,
      "name": "generate_draft_quote",
      "actions": [
        "compile_line_items",
        "add_terms_and_conditions",
        "calculate_totals",
        "flag_for_review_if_needed"
      ]
    },
    {
      "step": 5,
      "name": "review_flags",
      "conditions": [
        { "flag": "new_customer", "action": "require_credit_review" },
        { "flag": "custom_processing", "action": "require_engineering_review" },
        { "flag": "large_order", "threshold": "$50,000", "action": "require_manager_approval" },
        { "flag": "low_margin", "threshold": "margin < 15%", "action": "require_pricing_review" },
        { "flag": "unusual_specs", "action": "flag_for_csr_review" }
      ]
    }
  ],
  "output": {
    "quote_draft": true,
    "confidence_score": "0-100",
    "review_required": "boolean",
    "review_reasons": ["string"]
  }
}
```

---

## 4. negotiation_workflow

```json
{
  "stages": [
    {
      "stage": "quote_sent",
      "portal_actions": ["view_quote", "accept_quote", "request_revision", "decline"],
      "internal_visibility": "quote_dashboard"
    },
    {
      "stage": "revision_requested",
      "portal_actions": ["add_revision_notes", "attach_documents"],
      "internal_actions": ["review_revision", "adjust_pricing", "send_revised_quote"],
      "ai_assist": "suggest_counter_offer"
    },
    {
      "stage": "counter_offer",
      "portal_actions": ["view_counter", "accept", "counter_again", "decline"],
      "internal_actions": ["review_customer_counter", "accept", "counter", "decline"],
      "max_rounds": 3
    },
    {
      "stage": "accepted",
      "portal_actions": ["view_order", "download_confirmation"],
      "internal_actions": ["convert_to_order", "send_confirmation"],
      "auto_convert": "if accepted"
    },
    {
      "stage": "declined",
      "portal_actions": ["provide_decline_reason"],
      "internal_actions": ["log_lost_reason", "schedule_followup"],
      "ai_assist": "analyze_loss_reason"
    }
  ]
}
```

---

## 5. ai_negotiation_assist

```json
{
  "capabilities": [
    {
      "id": "counter_offer_suggestion",
      "trigger": "customer_requests_price_reduction",
      "inputs": ["requested_discount", "customer_history", "margin_floor", "competitive_data"],
      "output": {
        "suggested_counter": "price or discount",
        "reasoning": "text",
        "win_probability": "percent"
      }
    },
    {
      "id": "value_add_suggestion",
      "trigger": "customer_price_sensitive",
      "inputs": ["customer_needs", "available_value_adds", "cost_to_us"],
      "output": {
        "suggestions": ["free shipping", "extended terms", "volume commitment discount"],
        "cost_impact": "dollar",
        "perceived_value": "rating"
      }
    },
    {
      "id": "walk_away_analysis",
      "trigger": "margin_below_floor OR terms_unacceptable",
      "inputs": ["proposed_deal", "margin_floor", "customer_ltv", "capacity_utilization"],
      "output": {
        "recommendation": "accept | counter | walk_away",
        "reasoning": "text",
        "confidence": "percent"
      }
    },
    {
      "id": "competitive_intel",
      "trigger": "customer_mentions_competitor",
      "inputs": ["competitor_name", "product_category", "historical_wins_losses"],
      "output": {
        "competitor_typical_pricing": "estimate",
        "our_differentiators": ["list"],
        "suggested_response": "text"
      }
    },
    {
      "id": "urgency_detection",
      "trigger": "rfq_language_analysis",
      "inputs": ["rfq_notes", "customer_history", "requested_date"],
      "output": {
        "urgency_score": "1-10",
        "pricing_flexibility": "low | medium | high",
        "negotiation_leverage": "us | them | neutral"
      }
    }
  ],
  "ui_display": {
    "location": "quote_detail > negotiation_assist_panel",
    "components": [
      { "type": "SuggestionCard", "for": "counter_offer_suggestion" },
      { "type": "ValueAddChips", "for": "value_add_suggestion" },
      { "type": "WinProbabilityGauge", "for": "walk_away_analysis" },
      { "type": "CompetitorInsightPanel", "for": "competitive_intel" }
    ],
    "visibility": "CSR, SALES, MANAGER"
  }
}
```

---

## 6. quote_status_mapping

| internal_status | portal_label | portal_color | portal_icon | customer_actions |
|-----------------|--------------|--------------|-------------|------------------|
| draft | — | — | — | (not visible) |
| pending_review | Quote Being Prepared | info | HourglassEmpty | none |
| sent | Quote Ready | success | Description | view, accept, request_revision, decline |
| revision_requested | Revision in Progress | warning | Edit | view revision notes |
| counter_sent | Counter Offer Sent | info | CompareArrows | view, accept, counter, decline |
| customer_counter | Your Counter Under Review | warning | HourglassEmpty | none |
| accepted | Order Confirmed | success | CheckCircle | view order |
| declined | Quote Declined | error | Cancel | request_new_quote |
| expired | Quote Expired | default | Schedule | request_requote |

---

## 7. portal_quote_screens

```json
[
  {
    "screen_id": "quote_list",
    "components": [
      {
        "id": "quote_table",
        "type": "DataTable",
        "columns": ["quote_number", "date", "items_count", "total", "status", "expires", "actions"]
      },
      {
        "id": "filters",
        "type": "FilterBar",
        "filters": ["status", "date_range"]
      }
    ]
  },
  {
    "screen_id": "quote_detail",
    "components": [
      {
        "id": "quote_header",
        "type": "Card",
        "fields": ["quote_number", "date", "expires", "status", "rep_contact"]
      },
      {
        "id": "line_items",
        "type": "Table",
        "columns": ["line", "product", "description", "qty", "unit_price", "ext_price"]
      },
      {
        "id": "totals",
        "type": "SummaryCard",
        "fields": ["subtotal", "freight_estimate", "taxes", "total"]
      },
      {
        "id": "terms",
        "type": "Accordion",
        "sections": ["payment_terms", "delivery_terms", "validity"]
      },
      {
        "id": "action_bar",
        "type": "ButtonGroup",
        "buttons": [
          { "label": "Accept Quote", "action": "accept", "variant": "contained" },
          { "label": "Request Revision", "action": "revision_modal", "variant": "outlined" },
          { "label": "Decline", "action": "decline_modal", "variant": "text" }
        ]
      },
      {
        "id": "revision_history",
        "type": "Timeline",
        "events": "quote_revisions"
      }
    ]
  },
  {
    "screen_id": "revision_modal",
    "type": "Dialog",
    "components": [
      {
        "id": "revision_type",
        "type": "RadioGroup",
        "options": ["Price adjustment", "Quantity change", "Spec change", "Delivery change", "Other"]
      },
      {
        "id": "revision_notes",
        "type": "TextField",
        "multiline": true,
        "placeholder": "Describe the changes you'd like..."
      },
      {
        "id": "target_price",
        "type": "NumberInput",
        "label": "Target Price (optional)",
        "conditional": "revision_type == 'Price adjustment'"
      },
      {
        "id": "submit_button",
        "type": "Button",
        "label": "Submit Revision Request"
      }
    ]
  },
  {
    "screen_id": "decline_modal",
    "type": "Dialog",
    "components": [
      {
        "id": "decline_reason",
        "type": "RadioGroup",
        "options": ["Price too high", "Lead time too long", "Specs don't match", "Found alternative", "Project cancelled", "Other"]
      },
      {
        "id": "decline_notes",
        "type": "TextField",
        "multiline": true,
        "placeholder": "Additional feedback (optional)"
      },
      {
        "id": "confirm_button",
        "type": "Button",
        "label": "Confirm Decline",
        "color": "error"
      }
    ]
  }
]
```

---

## 8. rfq_data_model

```json
{
  "RFQ": {
    "id": "uuid",
    "rfq_number": "string (auto-generated)",
    "customer_id": "uuid",
    "contact_id": "uuid",
    "status": "enum (submitted, reviewing, quoted, converted, cancelled)",
    "submitted_at": "datetime",
    "ship_to_address_id": "uuid",
    "requested_date": "date",
    "shipping_method": "string",
    "special_instructions": "text",
    "assigned_csr_id": "uuid",
    "quote_id": "uuid (nullable)"
  },
  "RFQLineItem": {
    "id": "uuid",
    "rfq_id": "uuid",
    "line_number": "integer",
    "product_id": "uuid (nullable if custom)",
    "description": "string",
    "quantity": "decimal",
    "unit": "string",
    "specifications": "json",
    "notes": "text",
    "attachments": "json (file references)"
  },
  "RFQAttachment": {
    "id": "uuid",
    "rfq_id": "uuid",
    "line_item_id": "uuid (nullable)",
    "file_name": "string",
    "file_type": "string",
    "file_size": "integer",
    "storage_path": "string",
    "parsed_data": "json (if drawing)",
    "uploaded_at": "datetime"
  },
  "QuoteRevision": {
    "id": "uuid",
    "quote_id": "uuid",
    "revision_number": "integer",
    "initiated_by": "customer | internal",
    "revision_type": "string",
    "notes": "text",
    "previous_total": "decimal",
    "new_total": "decimal",
    "created_at": "datetime",
    "created_by": "uuid"
  }
}
```

---

## 9. api_endpoints

```json
[
  {
    "method": "POST",
    "path": "/api/portal/rfq",
    "auth": "portal_customer",
    "body": "RFQ + line_items + attachments",
    "response": { "rfq_id": "uuid", "rfq_number": "string" }
  },
  {
    "method": "GET",
    "path": "/api/portal/rfq/{rfq_id}",
    "auth": "portal_customer (own)",
    "response": "RFQ + line_items + status"
  },
  {
    "method": "GET",
    "path": "/api/portal/quotes",
    "auth": "portal_customer",
    "response": { "quotes": "array" }
  },
  {
    "method": "GET",
    "path": "/api/portal/quotes/{quote_id}",
    "auth": "portal_customer (own)",
    "response": "Quote + line_items + revisions"
  },
  {
    "method": "POST",
    "path": "/api/portal/quotes/{quote_id}/accept",
    "auth": "portal_customer",
    "response": { "order_id": "uuid", "order_number": "string" }
  },
  {
    "method": "POST",
    "path": "/api/portal/quotes/{quote_id}/revision",
    "auth": "portal_customer",
    "body": { "revision_type": "string", "notes": "string", "target_price": "decimal" },
    "response": { "revision_id": "uuid" }
  },
  {
    "method": "POST",
    "path": "/api/portal/quotes/{quote_id}/decline",
    "auth": "portal_customer",
    "body": { "reason": "string", "notes": "string" },
    "response": { "acknowledged": true }
  },
  {
    "method": "POST",
    "path": "/api/internal/quotes/{quote_id}/counter",
    "auth": "CSR, MANAGER",
    "body": { "line_adjustments": "array", "notes": "string" },
    "response": { "revision_id": "uuid" }
  },
  {
    "method": "GET",
    "path": "/api/internal/quotes/{quote_id}/ai-assist",
    "auth": "CSR, MANAGER",
    "response": { "suggestions": "object" }
  }
]
```

---

## 10. permissions

| action | CUSTOMER_PORTAL | CSR | SALES | MANAGER | ADMIN |
|--------|-----------------|-----|-------|---------|-------|
| submit_rfq | ✓ | ✗ | ✗ | ✗ | ✗ |
| view_own_rfq | ✓ | ✓ | ✓ | ✓ | ✓ |
| view_all_rfqs | ✗ | ✓ | ✓ | ✓ | ✓ |
| generate_quote | ✗ | ✓ | ✓ | ✓ | ✓ |
| send_quote | ✗ | ✓ | ✓ | ✓ | ✓ |
| accept_quote | ✓ | ✗ | ✗ | ✗ | ✗ |
| request_revision | ✓ | ✗ | ✗ | ✗ | ✗ |
| process_revision | ✗ | ✓ | ✓ | ✓ | ✓ |
| approve_low_margin | ✗ | ✗ | ✗ | ✓ | ✓ |
| view_ai_assist | ✗ | ✓ | ✓ | ✓ | ✓ |
| override_ai_price | ✗ | ✓ | ✓ | ✓ | ✓ |
