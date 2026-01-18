# 78-BUILD-PORTAL-RFQ-NEGOTIATION

> Structured UI, workflows, and schemas for customer RFQ submission, quoting, and negotiation flows.

---

## 1. rfq_workflow

```json
{
  "workflow_id": "rfq_negotiation_v1",
  "initial_state": "draft",
  "states": {
    "draft": {
      "label": "Draft",
      "description": "Customer is composing RFQ",
      "owner": "CUSTOMER",
      "allowed_actions": ["edit", "add_line", "remove_line", "attach_document", "submit", "discard"],
      "transitions": [
        { "action": "submit", "target": "submitted", "conditions": ["has_line_items", "valid_contact"] },
        { "action": "discard", "target": "discarded" }
      ],
      "timeout": null,
      "notifications": []
    },
    "submitted": {
      "label": "Submitted",
      "description": "RFQ submitted, awaiting CSR review",
      "owner": "INTERNAL",
      "allowed_actions": ["assign_csr", "start_review", "request_clarification", "reject"],
      "transitions": [
        { "action": "start_review", "target": "in_review" },
        { "action": "request_clarification", "target": "clarification_needed" },
        { "action": "reject", "target": "rejected", "requires_reason": true }
      ],
      "timeout": { "hours": 4, "action": "escalate", "escalate_to": "BRANCH_MANAGER" },
      "notifications": [
        { "event": "on_enter", "recipients": ["assigned_csr", "csr_queue"], "template": "new_rfq_received" },
        { "event": "on_enter", "recipients": ["customer"], "template": "rfq_received_confirmation" }
      ],
      "sla": { "response_hours": 4, "metric": "time_to_first_response" }
    },
    "clarification_needed": {
      "label": "Clarification Needed",
      "description": "CSR requested additional information from customer",
      "owner": "CUSTOMER",
      "allowed_actions": ["respond_clarification", "withdraw"],
      "transitions": [
        { "action": "respond_clarification", "target": "submitted" },
        { "action": "withdraw", "target": "withdrawn" }
      ],
      "timeout": { "days": 7, "action": "auto_expire", "target": "expired" },
      "notifications": [
        { "event": "on_enter", "recipients": ["customer"], "template": "clarification_request" },
        { "event": "timeout_warning", "recipients": ["customer"], "template": "clarification_reminder", "before_hours": 24 }
      ]
    },
    "in_review": {
      "label": "In Review",
      "description": "CSR is preparing quote",
      "owner": "INTERNAL",
      "allowed_actions": ["edit_quote", "request_approval", "send_quote", "request_clarification", "reject"],
      "transitions": [
        { "action": "send_quote", "target": "quoted", "conditions": ["quote_complete", "within_authority"] },
        { "action": "request_approval", "target": "pending_approval", "conditions": ["exceeds_authority"] },
        { "action": "request_clarification", "target": "clarification_needed" },
        { "action": "reject", "target": "rejected", "requires_reason": true }
      ],
      "timeout": { "hours": 24, "action": "escalate", "escalate_to": "BRANCH_MANAGER" },
      "notifications": [],
      "sla": { "response_hours": 24, "metric": "time_to_quote" }
    },
    "pending_approval": {
      "label": "Pending Approval",
      "description": "Quote requires manager approval",
      "owner": "INTERNAL",
      "allowed_actions": ["approve", "reject_approval", "request_revision"],
      "transitions": [
        { "action": "approve", "target": "in_review" },
        { "action": "reject_approval", "target": "in_review", "requires_reason": true },
        { "action": "request_revision", "target": "in_review", "requires_reason": true }
      ],
      "timeout": { "hours": 8, "action": "escalate", "escalate_to": "DIVISION_MANAGER" },
      "notifications": [
        { "event": "on_enter", "recipients": ["approver"], "template": "approval_request" }
      ]
    },
    "quoted": {
      "label": "Quoted",
      "description": "Quote sent to customer, awaiting response",
      "owner": "CUSTOMER",
      "allowed_actions": ["accept", "counter", "reject", "request_extension"],
      "transitions": [
        { "action": "accept", "target": "accepted" },
        { "action": "counter", "target": "countered" },
        { "action": "reject", "target": "customer_rejected", "requires_reason": true },
        { "action": "request_extension", "target": "quoted", "extends_validity": true }
      ],
      "timeout": { "days": 14, "action": "auto_expire", "target": "expired" },
      "notifications": [
        { "event": "on_enter", "recipients": ["customer"], "template": "quote_ready" },
        { "event": "timeout_warning", "recipients": ["customer", "assigned_csr"], "template": "quote_expiring", "before_days": 3 }
      ],
      "validity": { "default_days": 14, "max_extension_days": 30 }
    },
    "countered": {
      "label": "Counter Received",
      "description": "Customer submitted counter-offer",
      "owner": "INTERNAL",
      "allowed_actions": ["accept_counter", "counter_back", "reject_counter", "request_clarification"],
      "transitions": [
        { "action": "accept_counter", "target": "accepted" },
        { "action": "counter_back", "target": "quoted" },
        { "action": "reject_counter", "target": "negotiation_failed", "requires_reason": true },
        { "action": "request_clarification", "target": "clarification_needed" }
      ],
      "timeout": { "hours": 24, "action": "escalate", "escalate_to": "BRANCH_MANAGER" },
      "notifications": [
        { "event": "on_enter", "recipients": ["assigned_csr"], "template": "counter_received" }
      ],
      "max_rounds": 5
    },
    "accepted": {
      "label": "Accepted",
      "description": "Quote accepted, ready for order conversion",
      "owner": "INTERNAL",
      "allowed_actions": ["convert_to_order", "hold"],
      "transitions": [
        { "action": "convert_to_order", "target": "converted" },
        { "action": "hold", "target": "on_hold" }
      ],
      "timeout": { "days": 7, "action": "reminder", "target": "accepted" },
      "notifications": [
        { "event": "on_enter", "recipients": ["customer"], "template": "acceptance_confirmed" },
        { "event": "on_enter", "recipients": ["assigned_csr"], "template": "quote_accepted_internal" }
      ]
    },
    "converted": {
      "label": "Converted to Order",
      "description": "RFQ successfully converted to sales order",
      "owner": "SYSTEM",
      "terminal": true,
      "allowed_actions": [],
      "transitions": [],
      "notifications": [
        { "event": "on_enter", "recipients": ["customer"], "template": "order_created" }
      ],
      "outcome": "won"
    },
    "rejected": {
      "label": "Rejected by Company",
      "description": "RFQ rejected by internal team",
      "owner": "SYSTEM",
      "terminal": true,
      "allowed_actions": [],
      "transitions": [],
      "notifications": [
        { "event": "on_enter", "recipients": ["customer"], "template": "rfq_rejected" }
      ],
      "outcome": "lost",
      "requires_reason": true
    },
    "customer_rejected": {
      "label": "Rejected by Customer",
      "description": "Customer rejected the quote",
      "owner": "SYSTEM",
      "terminal": true,
      "allowed_actions": [],
      "transitions": [],
      "notifications": [
        { "event": "on_enter", "recipients": ["assigned_csr"], "template": "customer_rejected_quote" }
      ],
      "outcome": "lost",
      "requires_reason": true
    },
    "negotiation_failed": {
      "label": "Negotiation Failed",
      "description": "Counter-offer rejected, negotiation ended",
      "owner": "SYSTEM",
      "terminal": true,
      "allowed_actions": [],
      "transitions": [],
      "notifications": [
        { "event": "on_enter", "recipients": ["customer"], "template": "negotiation_ended" }
      ],
      "outcome": "lost"
    },
    "expired": {
      "label": "Expired",
      "description": "RFQ or quote expired without action",
      "owner": "SYSTEM",
      "terminal": true,
      "allowed_actions": ["reopen"],
      "transitions": [
        { "action": "reopen", "target": "draft", "conditions": ["within_reopen_window"] }
      ],
      "notifications": [
        { "event": "on_enter", "recipients": ["customer", "assigned_csr"], "template": "rfq_expired" }
      ],
      "outcome": "expired",
      "reopen_window_days": 30
    },
    "withdrawn": {
      "label": "Withdrawn",
      "description": "Customer withdrew the RFQ",
      "owner": "SYSTEM",
      "terminal": true,
      "allowed_actions": [],
      "transitions": [],
      "notifications": [
        { "event": "on_enter", "recipients": ["assigned_csr"], "template": "rfq_withdrawn" }
      ],
      "outcome": "withdrawn"
    },
    "discarded": {
      "label": "Discarded",
      "description": "Draft RFQ discarded before submission",
      "owner": "SYSTEM",
      "terminal": true,
      "allowed_actions": [],
      "transitions": [],
      "notifications": [],
      "outcome": "discarded"
    },
    "on_hold": {
      "label": "On Hold",
      "description": "Accepted quote on hold pending customer action",
      "owner": "INTERNAL",
      "allowed_actions": ["resume", "cancel"],
      "transitions": [
        { "action": "resume", "target": "accepted" },
        { "action": "cancel", "target": "cancelled" }
      ],
      "timeout": { "days": 30, "action": "auto_cancel", "target": "cancelled" },
      "notifications": []
    },
    "cancelled": {
      "label": "Cancelled",
      "description": "RFQ cancelled after acceptance",
      "owner": "SYSTEM",
      "terminal": true,
      "allowed_actions": [],
      "transitions": [],
      "notifications": [
        { "event": "on_enter", "recipients": ["customer"], "template": "rfq_cancelled" }
      ],
      "outcome": "cancelled"
    }
  },
  "audit_events": [
    "state_change",
    "line_item_change",
    "document_attached",
    "price_changed",
    "validity_extended",
    "csr_assigned",
    "approval_requested",
    "counter_submitted"
  ],
  "escalation_chain": ["CSR", "BRANCH_MANAGER", "DIVISION_MANAGER"]
}
```

---

## 2. negotiation_UI

```json
{
  "portal_rfq_builder": {
    "id": "portal_rfq_builder",
    "route": "/portal/rfq/new",
    "title": "Request for Quote",
    "layout": "wizard",
    "owner": "CUSTOMER",
    "children": [
      {
        "id": "wizard_stepper",
        "type": "Stepper",
        "steps": ["Products", "Quantities & Specs", "Delivery", "Review & Submit"],
        "linear": true
      },
      {
        "id": "step_products",
        "type": "WizardStep",
        "stepIndex": 0,
        "children": [
          {
            "id": "product_search",
            "type": "Autocomplete",
            "props": {
              "label": "Search Products",
              "placeholder": "Enter SKU, description, or material type",
              "searchEndpoint": "/api/portal/products/search",
              "freeSolo": false
            }
          },
          {
            "id": "recent_products",
            "type": "ChipGroup",
            "props": {
              "label": "Recently Ordered",
              "source": "customer_order_history"
            }
          },
          {
            "id": "line_items_table",
            "type": "EditableTable",
            "columns": [
              { "field": "product", "header": "Product", "editable": false },
              { "field": "quantity", "header": "Quantity", "type": "number", "editable": true },
              { "field": "unit", "header": "Unit", "type": "select", "options": "product_units" },
              { "field": "actions", "header": "", "type": "actions", "buttons": ["Remove"] }
            ],
            "addButton": { "label": "Add Another Product" }
          }
        ]
      },
      {
        "id": "step_specs",
        "type": "WizardStep",
        "stepIndex": 1,
        "children": [
          {
            "id": "line_specs_accordion",
            "type": "Accordion",
            "itemSource": "line_items",
            "itemTemplate": {
              "header": "{product.name} - {quantity} {unit}",
              "children": [
                { "id": "grade_spec", "type": "Select", "label": "Grade", "options": "product_grades" },
                { "id": "finish_spec", "type": "Select", "label": "Finish", "options": "product_finishes" },
                { "id": "tolerance_spec", "type": "TextField", "label": "Tolerance Requirements" },
                { "id": "custom_processing", "type": "MultiSelect", "label": "Processing Required", "options": "processing_types" },
                { "id": "notes", "type": "TextField", "label": "Special Instructions", "multiline": true }
              ]
            }
          },
          {
            "id": "document_upload",
            "type": "FileUpload",
            "props": {
              "label": "Attach Drawings or Specifications",
              "accept": [".pdf", ".dwg", ".dxf", ".xlsx"],
              "maxFiles": 10,
              "maxSizeMB": 25
            }
          }
        ]
      },
      {
        "id": "step_delivery",
        "type": "WizardStep",
        "stepIndex": 2,
        "children": [
          {
            "id": "delivery_type",
            "type": "RadioGroup",
            "label": "Delivery Preference",
            "options": [
              { "value": "standard", "label": "Standard Delivery" },
              { "value": "expedited", "label": "Expedited (Additional Charges May Apply)" },
              { "value": "will_call", "label": "Will Call / Pickup" }
            ]
          },
          {
            "id": "ship_to_address",
            "type": "AddressSelector",
            "props": {
              "savedAddresses": "customer_addresses",
              "allowNew": true
            }
          },
          {
            "id": "requested_date",
            "type": "DatePicker",
            "label": "Requested Delivery Date",
            "props": {
              "minDate": "today + 3 days",
              "helperText": "Lead times vary by product"
            }
          },
          {
            "id": "lead_time_hint",
            "type": "AIHint",
            "props": {
              "suggestionType": "lead_time_range",
              "displayAs": "inline"
            }
          },
          {
            "id": "split_shipments",
            "type": "Checkbox",
            "label": "Allow split shipments if it helps meet the date"
          }
        ]
      },
      {
        "id": "step_review",
        "type": "WizardStep",
        "stepIndex": 3,
        "children": [
          {
            "id": "rfq_summary",
            "type": "RFQSummaryCard",
            "props": {
              "showLineItems": true,
              "showSpecs": true,
              "showDelivery": true,
              "showDocuments": true
            }
          },
          {
            "id": "contact_info",
            "type": "ContactCard",
            "props": {
              "editable": true,
              "fields": ["name", "email", "phone"]
            }
          },
          {
            "id": "terms_acceptance",
            "type": "Checkbox",
            "label": "I agree to the terms and conditions",
            "required": true
          },
          {
            "id": "submit_actions",
            "type": "ButtonGroup",
            "children": [
              { "id": "save_draft", "type": "Button", "variant": "outlined", "label": "Save Draft" },
              { "id": "submit", "type": "Button", "variant": "contained", "label": "Submit RFQ", "color": "primary" }
            ]
          }
        ]
      }
    ]
  },
  "portal_negotiation_view": {
    "id": "portal_negotiation",
    "route": "/portal/rfq/:rfqId",
    "title": "RFQ Details",
    "layout": "master_detail",
    "owner": "CUSTOMER",
    "children": [
      {
        "id": "header",
        "type": "PageHeader",
        "children": [
          { "id": "rfq_number", "type": "Typography", "variant": "h5" },
          { "id": "status_chip", "type": "StatusChip", "source": "rfq.status" },
          { "id": "validity_countdown", "type": "Countdown", "label": "Quote valid for", "endDate": "quote.valid_until", "showWhen": "status=quoted" }
        ]
      },
      {
        "id": "main_content",
        "type": "Grid",
        "columns": 12,
        "children": [
          {
            "id": "bid_thread",
            "type": "Paper",
            "gridSpan": 8,
            "children": [
              { "id": "panel_header", "type": "PanelHeader", "title": "Negotiation History" },
              {
                "id": "thread_timeline",
                "type": "Timeline",
                "itemSource": "negotiation_events",
                "itemTemplate": {
                  "id": "event_card",
                  "type": "NegotiationEventCard",
                  "props": {
                    "showTimestamp": true,
                    "showActor": true,
                    "expandable": true
                  },
                  "variants": {
                    "rfq_submitted": {
                      "icon": "Send",
                      "color": "info",
                      "content": "RFQSubmittedContent"
                    },
                    "quote_sent": {
                      "icon": "RequestQuote",
                      "color": "primary",
                      "content": "QuoteContent"
                    },
                    "counter_submitted": {
                      "icon": "SwapHoriz",
                      "color": "warning",
                      "content": "CounterContent"
                    },
                    "counter_response": {
                      "icon": "Reply",
                      "color": "primary",
                      "content": "QuoteContent"
                    },
                    "accepted": {
                      "icon": "CheckCircle",
                      "color": "success",
                      "content": "AcceptanceContent"
                    },
                    "rejected": {
                      "icon": "Cancel",
                      "color": "error",
                      "content": "RejectionContent"
                    }
                  }
                }
              },
              {
                "id": "current_quote_summary",
                "type": "QuoteSummaryCard",
                "showWhen": "status in [quoted, countered]",
                "props": {
                  "showLineItems": true,
                  "showTotals": true,
                  "showValidity": true,
                  "showDeliveryDate": true
                }
              }
            ]
          },
          {
            "id": "action_panel",
            "type": "Paper",
            "gridSpan": 4,
            "sticky": true,
            "children": [
              { "id": "panel_header", "type": "PanelHeader", "title": "Actions" },
              {
                "id": "action_buttons",
                "type": "Stack",
                "spacing": 2,
                "children": [
                  {
                    "id": "accept_btn",
                    "type": "Button",
                    "variant": "contained",
                    "color": "success",
                    "label": "Accept Quote",
                    "fullWidth": true,
                    "showWhen": "status=quoted",
                    "action": "accept_quote"
                  },
                  {
                    "id": "counter_btn",
                    "type": "Button",
                    "variant": "outlined",
                    "color": "primary",
                    "label": "Submit Counter-Offer",
                    "fullWidth": true,
                    "showWhen": "status=quoted AND counter_rounds < max_rounds",
                    "action": "open_counter_dialog"
                  },
                  {
                    "id": "reject_btn",
                    "type": "Button",
                    "variant": "text",
                    "color": "error",
                    "label": "Decline Quote",
                    "fullWidth": true,
                    "showWhen": "status=quoted",
                    "action": "open_reject_dialog"
                  },
                  {
                    "id": "extend_btn",
                    "type": "Button",
                    "variant": "text",
                    "label": "Request Extension",
                    "fullWidth": true,
                    "showWhen": "status=quoted AND days_remaining < 3",
                    "action": "request_extension"
                  }
                ]
              },
              {
                "id": "documents_section",
                "type": "Divider"
              },
              {
                "id": "attached_documents",
                "type": "DocumentList",
                "props": {
                  "source": "rfq.documents",
                  "downloadable": true,
                  "previewable": true
                }
              },
              {
                "id": "contact_csr",
                "type": "ContactCard",
                "props": {
                  "title": "Your Representative",
                  "source": "assigned_csr",
                  "showEmail": true,
                  "showPhone": true,
                  "showChat": true
                }
              }
            ]
          }
        ]
      },
      {
        "id": "counter_dialog",
        "type": "Dialog",
        "title": "Submit Counter-Offer",
        "maxWidth": "md",
        "children": [
          {
            "id": "counter_form",
            "type": "Form",
            "children": [
              {
                "id": "counter_type",
                "type": "RadioGroup",
                "label": "Counter Type",
                "options": [
                  { "value": "price", "label": "Price Adjustment" },
                  { "value": "date", "label": "Delivery Date Change" },
                  { "value": "both", "label": "Both Price and Date" },
                  { "value": "other", "label": "Other Terms" }
                ]
              },
              {
                "id": "line_adjustments",
                "type": "EditableTable",
                "showWhen": "counter_type in [price, both]",
                "columns": [
                  { "field": "product", "header": "Product", "editable": false },
                  { "field": "quoted_price", "header": "Quoted Price", "editable": false },
                  { "field": "counter_price", "header": "Your Counter Price", "type": "currency", "editable": true }
                ]
              },
              {
                "id": "counter_date",
                "type": "DatePicker",
                "label": "Requested Delivery Date",
                "showWhen": "counter_type in [date, both]"
              },
              {
                "id": "counter_notes",
                "type": "TextField",
                "label": "Justification / Notes",
                "multiline": true,
                "rows": 3,
                "helperText": "Explain your counter-offer to help us respond"
              }
            ]
          },
          {
            "id": "dialog_actions",
            "type": "DialogActions",
            "children": [
              { "id": "cancel", "type": "Button", "variant": "text", "label": "Cancel" },
              { "id": "submit_counter", "type": "Button", "variant": "contained", "label": "Submit Counter-Offer" }
            ]
          }
        ]
      },
      {
        "id": "reject_dialog",
        "type": "Dialog",
        "title": "Decline Quote",
        "maxWidth": "sm",
        "children": [
          {
            "id": "reject_form",
            "type": "Form",
            "children": [
              {
                "id": "reject_reason",
                "type": "Select",
                "label": "Reason for Declining",
                "required": true,
                "options": [
                  { "value": "price_too_high", "label": "Price too high" },
                  { "value": "lead_time_too_long", "label": "Lead time too long" },
                  { "value": "found_alternative", "label": "Found alternative supplier" },
                  { "value": "project_cancelled", "label": "Project cancelled" },
                  { "value": "budget_constraints", "label": "Budget constraints" },
                  { "value": "specs_not_met", "label": "Specifications not met" },
                  { "value": "other", "label": "Other" }
                ]
              },
              {
                "id": "reject_details",
                "type": "TextField",
                "label": "Additional Details (Optional)",
                "multiline": true,
                "rows": 2
              }
            ]
          },
          {
            "id": "dialog_actions",
            "type": "DialogActions",
            "children": [
              { "id": "cancel", "type": "Button", "variant": "text", "label": "Cancel" },
              { "id": "confirm_reject", "type": "Button", "variant": "contained", "color": "error", "label": "Decline Quote" }
            ]
          }
        ]
      }
    ]
  },
  "internal_quoting_view": {
    "id": "internal_quoting",
    "route": "/sales/rfq/:rfqId",
    "title": "RFQ Quoting",
    "layout": "master_detail",
    "owner": "INTERNAL",
    "roles": ["CSR", "BRANCH_MANAGER", "DIVISION_MANAGER"],
    "children": [
      {
        "id": "header",
        "type": "PageHeader",
        "children": [
          { "id": "rfq_number", "type": "Typography", "variant": "h5" },
          { "id": "customer_name", "type": "Typography", "variant": "subtitle1" },
          { "id": "status_chip", "type": "StatusChip" },
          { "id": "sla_indicator", "type": "SLAIndicator", "metrics": ["time_to_quote", "response_time"] },
          { "id": "actions", "type": "ButtonGroup", "children": [
            { "id": "send_quote", "type": "Button", "variant": "contained", "label": "Send Quote" },
            { "id": "more_menu", "type": "IconButton", "icon": "MoreVert" }
          ]}
        ]
      },
      {
        "id": "main_content",
        "type": "Grid",
        "columns": 12,
        "children": [
          {
            "id": "quote_editor",
            "type": "Paper",
            "gridSpan": 8,
            "children": [
              {
                "id": "line_items_section",
                "type": "Section",
                "title": "Quote Line Items",
                "children": [
                  {
                    "id": "quote_table",
                    "type": "EditableTable",
                    "columns": [
                      { "field": "product", "header": "Product", "width": 200 },
                      { "field": "requested_qty", "header": "Req. Qty", "editable": false },
                      { "field": "quoted_qty", "header": "Quote Qty", "type": "number", "editable": true },
                      { "field": "unit", "header": "Unit" },
                      { "field": "cost", "header": "Cost", "type": "currency", "internal_only": true },
                      { "field": "unit_price", "header": "Unit Price", "type": "currency", "editable": true },
                      { "field": "margin_percent", "header": "Margin %", "type": "percent", "internal_only": true, "computed": true },
                      { "field": "ext_price", "header": "Ext. Price", "type": "currency", "computed": true },
                      { "field": "ai_suggestion", "header": "", "type": "ai_badge" }
                    ],
                    "rowExpand": {
                      "children": [
                        { "id": "specs", "type": "SpecsDisplay" },
                        { "id": "inventory_check", "type": "InventoryAvailability" },
                        { "id": "lead_time", "type": "LeadTimeCalculator" }
                      ]
                    }
                  },
                  {
                    "id": "totals_row",
                    "type": "QuoteTotals",
                    "props": {
                      "showSubtotal": true,
                      "showFreight": true,
                      "showTotal": true,
                      "showMargin": true,
                      "marginInternal": true
                    }
                  }
                ]
              },
              {
                "id": "delivery_section",
                "type": "Section",
                "title": "Delivery",
                "children": [
                  {
                    "id": "delivery_grid",
                    "type": "Grid",
                    "columns": 3,
                    "children": [
                      { "id": "requested_date", "type": "DateDisplay", "label": "Requested Date", "source": "rfq.requested_date" },
                      { "id": "quoted_date", "type": "DatePicker", "label": "Quoted Ship Date", "editable": true },
                      { "id": "ai_date_suggestion", "type": "AIDateSuggestion" }
                    ]
                  },
                  {
                    "id": "ship_to",
                    "type": "AddressDisplay",
                    "label": "Ship To",
                    "source": "rfq.ship_to"
                  }
                ]
              },
              {
                "id": "terms_section",
                "type": "Section",
                "title": "Terms",
                "children": [
                  {
                    "id": "terms_grid",
                    "type": "Grid",
                    "columns": 2,
                    "children": [
                      { "id": "payment_terms", "type": "Select", "label": "Payment Terms", "options": "payment_terms", "default": "customer_default" },
                      { "id": "validity_days", "type": "Select", "label": "Quote Valid For", "options": [7, 14, 30, 60], "default": 14 },
                      { "id": "freight_terms", "type": "Select", "label": "Freight Terms", "options": "freight_terms" },
                      { "id": "fob_point", "type": "Select", "label": "FOB Point", "options": "fob_options" }
                    ]
                  }
                ]
              },
              {
                "id": "notes_section",
                "type": "Section",
                "title": "Notes",
                "children": [
                  { "id": "internal_notes", "type": "TextField", "label": "Internal Notes (Not visible to customer)", "multiline": true, "internal_only": true },
                  { "id": "customer_notes", "type": "TextField", "label": "Notes to Customer", "multiline": true }
                ]
              }
            ]
          },
          {
            "id": "side_panel",
            "type": "Paper",
            "gridSpan": 4,
            "sticky": true,
            "children": [
              {
                "id": "margin_summary",
                "type": "MarginSummaryCard",
                "internal_only": true,
                "props": {
                  "showTotalMargin": true,
                  "showMarginPercent": true,
                  "showFloorWarning": true,
                  "showHistoricalComparison": true
                }
              },
              {
                "id": "ai_suggestions_panel",
                "type": "AISuggestionsPanel",
                "internal_only": true,
                "children": [
                  { "id": "pricing_suggestions", "type": "AIPricingSuggestions" },
                  { "id": "date_suggestions", "type": "AIDateSuggestions" },
                  { "id": "alternative_suggestions", "type": "AIAlternativeSuggestions" }
                ]
              },
              {
                "id": "customer_context",
                "type": "CustomerContextCard",
                "props": {
                  "showTier": true,
                  "showCreditStatus": true,
                  "showRecentOrders": true,
                  "showWinRate": true
                }
              },
              {
                "id": "negotiation_history",
                "type": "NegotiationMiniTimeline",
                "props": {
                  "maxEvents": 5,
                  "showCounterRounds": true
                }
              },
              {
                "id": "documents",
                "type": "DocumentList",
                "props": {
                  "source": "rfq.documents",
                  "uploadEnabled": true
                }
              }
            ]
          }
        ]
      }
    ]
  },
  "internal_rfq_queue": {
    "id": "rfq_queue",
    "route": "/sales/rfq-queue",
    "title": "RFQ Queue",
    "layout": "list",
    "owner": "INTERNAL",
    "children": [
      {
        "id": "header",
        "type": "PageHeader",
        "children": [
          { "id": "title", "type": "Typography", "variant": "h4", "text": "RFQ Queue" },
          { "id": "refresh", "type": "IconButton", "icon": "Refresh" },
          { "id": "filters_toggle", "type": "Button", "variant": "outlined", "label": "Filters" }
        ]
      },
      {
        "id": "status_tabs",
        "type": "Tabs",
        "tabs": [
          { "label": "All", "value": "all" },
          { "label": "New", "value": "submitted", "badge": "count" },
          { "label": "In Review", "value": "in_review" },
          { "label": "Quoted", "value": "quoted" },
          { "label": "Countered", "value": "countered", "badge": "count" },
          { "label": "Accepted", "value": "accepted" }
        ]
      },
      {
        "id": "rfq_table",
        "type": "DataTable",
        "columns": [
          { "field": "rfq_number", "header": "RFQ #", "sortable": true, "link": true },
          { "field": "customer_name", "header": "Customer", "sortable": true },
          { "field": "status", "header": "Status", "type": "chip" },
          { "field": "line_count", "header": "Lines", "type": "number" },
          { "field": "total_value", "header": "Est. Value", "type": "currency" },
          { "field": "requested_date", "header": "Req. Date", "type": "date" },
          { "field": "sla_status", "header": "SLA", "type": "sla_indicator" },
          { "field": "assigned_csr", "header": "Assigned To" },
          { "field": "counter_rounds", "header": "Rounds", "type": "number" },
          { "field": "actions", "header": "", "type": "actions" }
        ],
        "rowClick": "navigate_to_detail",
        "selectable": true,
        "bulkActions": ["assign", "export"]
      }
    ]
  }
}
```

---

## 3. negotiation_schemas

```json
{
  "rfq_input_schema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "required": ["customer_id", "line_items", "contact"],
    "properties": {
      "customer_id": {
        "type": "string",
        "format": "uuid",
        "description": "Customer account ID"
      },
      "rfq_number": {
        "type": "string",
        "description": "Auto-generated RFQ number",
        "readOnly": true
      },
      "line_items": {
        "type": "array",
        "minItems": 1,
        "items": {
          "type": "object",
          "required": ["product_id", "quantity", "unit"],
          "properties": {
            "line_number": { "type": "integer", "minimum": 1 },
            "product_id": { "type": "string", "format": "uuid" },
            "product_sku": { "type": "string" },
            "product_name": { "type": "string" },
            "quantity": { "type": "number", "minimum": 0.001 },
            "unit": { "type": "string", "enum": ["LB", "KG", "EA", "FT", "IN", "PC", "TON", "CWT"] },
            "specifications": {
              "type": "object",
              "properties": {
                "grade": { "type": "string" },
                "finish": { "type": "string" },
                "thickness": { "type": "number" },
                "width": { "type": "number" },
                "length": { "type": "number" },
                "tolerance": { "type": "string" },
                "temper": { "type": "string" },
                "coating": { "type": "string" },
                "color": { "type": "string" }
              }
            },
            "processing": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "type": { "type": "string", "enum": ["CUT_TO_LENGTH", "SLIT", "SHEAR", "PLASMA", "LASER", "WATERJET", "BEND", "ROLL", "PUNCH", "DRILL", "SAW", "DEBURR", "POLISH", "PAINT", "PLATE", "HEAT_TREAT"] },
                  "parameters": { "type": "object" },
                  "notes": { "type": "string" }
                }
              }
            },
            "notes": { "type": "string", "maxLength": 2000 }
          }
        }
      },
      "delivery": {
        "type": "object",
        "properties": {
          "type": { "type": "string", "enum": ["standard", "expedited", "will_call"] },
          "requested_date": { "type": "string", "format": "date" },
          "ship_to_address_id": { "type": "string", "format": "uuid" },
          "ship_to_address": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "line1": { "type": "string" },
              "line2": { "type": "string" },
              "city": { "type": "string" },
              "state": { "type": "string" },
              "postal_code": { "type": "string" },
              "country": { "type": "string", "default": "US" }
            }
          },
          "allow_split_shipments": { "type": "boolean", "default": false },
          "special_instructions": { "type": "string", "maxLength": 1000 }
        }
      },
      "contact": {
        "type": "object",
        "required": ["name", "email"],
        "properties": {
          "name": { "type": "string" },
          "email": { "type": "string", "format": "email" },
          "phone": { "type": "string" },
          "role": { "type": "string" }
        }
      },
      "documents": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": { "type": "string", "format": "uuid" },
            "name": { "type": "string" },
            "type": { "type": "string", "enum": ["drawing", "specification", "po", "other"] },
            "url": { "type": "string", "format": "uri" },
            "size_bytes": { "type": "integer" }
          }
        }
      },
      "reference_po": { "type": "string" },
      "project_name": { "type": "string" },
      "notes": { "type": "string", "maxLength": 5000 },
      "metadata": {
        "type": "object",
        "properties": {
          "source": { "type": "string", "enum": ["portal", "email", "phone", "edi"] },
          "submitted_at": { "type": "string", "format": "date-time" },
          "ip_address": { "type": "string" },
          "user_agent": { "type": "string" }
        }
      }
    }
  },
  "quote_output_schema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "required": ["rfq_id", "quote_number", "line_items", "totals", "validity"],
    "properties": {
      "rfq_id": { "type": "string", "format": "uuid" },
      "quote_number": { "type": "string" },
      "quote_version": { "type": "integer", "minimum": 1 },
      "is_counter_response": { "type": "boolean", "default": false },
      "counter_round": { "type": "integer", "default": 0 },
      "line_items": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["line_number", "product_id", "quantity", "unit_price"],
          "properties": {
            "line_number": { "type": "integer" },
            "rfq_line_number": { "type": "integer" },
            "product_id": { "type": "string", "format": "uuid" },
            "product_sku": { "type": "string" },
            "product_name": { "type": "string" },
            "product_description": { "type": "string" },
            "requested_quantity": { "type": "number" },
            "quoted_quantity": { "type": "number" },
            "unit": { "type": "string" },
            "unit_price": { "type": "number", "minimum": 0 },
            "extended_price": { "type": "number" },
            "specifications": { "type": "object" },
            "processing": { "type": "array" },
            "lead_time_days": { "type": "integer" },
            "availability_status": { "type": "string", "enum": ["in_stock", "available", "special_order", "backordered"] },
            "notes": { "type": "string" },
            "_internal": {
              "type": "object",
              "description": "Internal fields - never exposed to customer",
              "properties": {
                "cost": { "type": "number" },
                "margin_percent": { "type": "number" },
                "margin_amount": { "type": "number" },
                "cost_breakdown": { "type": "object" },
                "pricing_rule_applied": { "type": "string" },
                "discount_applied": { "type": "number" },
                "floor_price": { "type": "number" },
                "ai_suggested_price": { "type": "number" },
                "price_override_reason": { "type": "string" }
              }
            }
          }
        }
      },
      "totals": {
        "type": "object",
        "properties": {
          "subtotal": { "type": "number" },
          "freight_estimate": { "type": "number" },
          "processing_charges": { "type": "number" },
          "taxes": { "type": "number" },
          "total": { "type": "number" },
          "_internal": {
            "type": "object",
            "properties": {
              "total_cost": { "type": "number" },
              "total_margin": { "type": "number" },
              "margin_percent": { "type": "number" }
            }
          }
        }
      },
      "delivery": {
        "type": "object",
        "properties": {
          "quoted_ship_date": { "type": "string", "format": "date" },
          "estimated_delivery_date": { "type": "string", "format": "date" },
          "ship_to_address": { "type": "object" },
          "freight_terms": { "type": "string" },
          "fob_point": { "type": "string" },
          "carrier_notes": { "type": "string" }
        }
      },
      "terms": {
        "type": "object",
        "properties": {
          "payment_terms": { "type": "string" },
          "payment_terms_days": { "type": "integer" }
        }
      },
      "validity": {
        "type": "object",
        "required": ["valid_from", "valid_until"],
        "properties": {
          "valid_from": { "type": "string", "format": "date-time" },
          "valid_until": { "type": "string", "format": "date-time" },
          "validity_days": { "type": "integer" },
          "extension_requested": { "type": "boolean" },
          "extension_granted_until": { "type": "string", "format": "date-time" }
        }
      },
      "notes_to_customer": { "type": "string" },
      "conditions": {
        "type": "array",
        "items": { "type": "string" }
      },
      "documents": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "name": { "type": "string" },
            "type": { "type": "string" },
            "url": { "type": "string" }
          }
        }
      },
      "_internal": {
        "type": "object",
        "description": "Internal metadata - never exposed",
        "properties": {
          "created_by": { "type": "string" },
          "approved_by": { "type": "string" },
          "approval_required": { "type": "boolean" },
          "approval_status": { "type": "string" },
          "internal_notes": { "type": "string" },
          "pricing_strategy": { "type": "string" },
          "competitive_context": { "type": "string" },
          "win_probability": { "type": "number" }
        }
      }
    }
  },
  "counter_schema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "required": ["rfq_id", "quote_id", "counter_type"],
    "properties": {
      "rfq_id": { "type": "string", "format": "uuid" },
      "quote_id": { "type": "string", "format": "uuid" },
      "counter_round": { "type": "integer", "minimum": 1 },
      "counter_type": {
        "type": "string",
        "enum": ["price", "date", "both", "quantity", "specs", "other"]
      },
      "line_adjustments": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "line_number": { "type": "integer" },
            "original_unit_price": { "type": "number" },
            "counter_unit_price": { "type": "number" },
            "original_quantity": { "type": "number" },
            "counter_quantity": { "type": "number" },
            "adjustment_reason": { "type": "string" }
          }
        }
      },
      "delivery_adjustment": {
        "type": "object",
        "properties": {
          "original_date": { "type": "string", "format": "date" },
          "counter_date": { "type": "string", "format": "date" },
          "reason": { "type": "string" }
        }
      },
      "total_adjustment": {
        "type": "object",
        "properties": {
          "original_total": { "type": "number" },
          "counter_total": { "type": "number" },
          "adjustment_percent": { "type": "number" }
        }
      },
      "notes": { "type": "string", "maxLength": 2000 },
      "submitted_by": { "type": "string" },
      "submitted_at": { "type": "string", "format": "date-time" },
      "source": {
        "type": "string",
        "enum": ["portal", "email", "phone", "csr_entry"]
      }
    }
  },
  "negotiation_event_schema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "required": ["event_type", "actor_type", "timestamp"],
    "properties": {
      "id": { "type": "string", "format": "uuid" },
      "rfq_id": { "type": "string", "format": "uuid" },
      "event_type": {
        "type": "string",
        "enum": [
          "rfq_created",
          "rfq_submitted",
          "rfq_assigned",
          "clarification_requested",
          "clarification_received",
          "quote_drafted",
          "quote_approval_requested",
          "quote_approved",
          "quote_rejected_internal",
          "quote_sent",
          "quote_viewed",
          "counter_submitted",
          "counter_accepted",
          "counter_rejected",
          "quote_accepted",
          "quote_rejected_customer",
          "extension_requested",
          "extension_granted",
          "order_created",
          "rfq_expired",
          "rfq_withdrawn",
          "document_attached",
          "note_added"
        ]
      },
      "actor_type": { "type": "string", "enum": ["customer", "csr", "manager", "system"] },
      "actor_id": { "type": "string" },
      "actor_name": { "type": "string" },
      "timestamp": { "type": "string", "format": "date-time" },
      "payload": {
        "type": "object",
        "description": "Event-specific data"
      },
      "visible_to_customer": { "type": "boolean", "default": true },
      "notes": { "type": "string" }
    }
  }
}
```

---

## 4. ai_suggestions

```json
{
  "pricing_suggestion": {
    "suggestion_type": "pricing",
    "trigger_points": ["quote_line_added", "quote_line_edited", "counter_received"],
    "inputs": {
      "product": {
        "id": "string",
        "sku": "string",
        "category": "string",
        "current_cost": "number"
      },
      "customer": {
        "id": "string",
        "tier": "string",
        "historical_win_rate": "number",
        "avg_margin": "number",
        "price_sensitivity": "high|medium|low"
      },
      "quantity": "number",
      "market_context": {
        "commodity_trend": "up|down|stable",
        "competitor_intel": "object",
        "inventory_position": "high|normal|low"
      },
      "rfq_context": {
        "counter_round": "number",
        "previous_prices": "array",
        "requested_price": "number|null"
      }
    },
    "output": {
      "suggested_price": { "type": "number", "description": "Recommended unit price" },
      "floor_price": { "type": "number", "description": "Minimum acceptable price" },
      "ceiling_price": { "type": "number", "description": "Maximum reasonable price" },
      "confidence": { "type": "number", "range": [0, 1] },
      "expected_margin_percent": { "type": "number" },
      "win_probability": { "type": "number", "range": [0, 1] },
      "explanation": {
        "primary_factors": ["string"],
        "customer_context": "string",
        "market_context": "string"
      },
      "alternatives": [
        {
          "price": "number",
          "margin": "number",
          "win_probability": "number",
          "trade_off": "string"
        }
      ]
    },
    "display": {
      "location": "inline_with_price_field",
      "format": "popover",
      "actions": ["apply", "dismiss", "explain"]
    },
    "constraints": {
      "never_below_floor": true,
      "respect_contract_prices": true,
      "flag_if_exceeds_authority": true
    }
  },
  "due_date_suggestion": {
    "suggestion_type": "due_date",
    "trigger_points": ["quote_started", "delivery_section_opened", "date_field_focused"],
    "inputs": {
      "line_items": [
        {
          "product_id": "string",
          "quantity": "number",
          "processing_required": "array"
        }
      ],
      "customer": {
        "id": "string",
        "tier": "string",
        "location": "string"
      },
      "requested_date": "date|null",
      "delivery_type": "standard|expedited|will_call",
      "capacity_context": {
        "current_utilization": "number",
        "scheduled_maintenance": "array",
        "peak_periods": "array"
      },
      "inventory_context": {
        "availability": "in_stock|available|special_order",
        "lead_time_if_order": "number"
      }
    },
    "output": {
      "suggested_date": { "type": "date", "description": "Recommended ship date" },
      "earliest_possible_date": { "type": "date" },
      "standard_date": { "type": "date" },
      "confidence": { "type": "number", "range": [0, 1] },
      "on_time_probability": { "type": "number", "range": [0, 1] },
      "risk_factors": ["string"],
      "explanation": {
        "capacity_impact": "string",
        "inventory_status": "string",
        "processing_time": "string",
        "transit_time": "string"
      },
      "alternatives": [
        {
          "date": "date",
          "on_time_probability": "number",
          "trade_off": "string",
          "cost_impact": "number|null"
        }
      ]
    },
    "display": {
      "location": "beside_date_field",
      "format": "inline_with_popover",
      "actions": ["apply", "explain", "show_alternatives"]
    },
    "constraints": {
      "never_promise_below_50_percent_confidence_without_warning": true,
      "respect_customer_tier_priority": true,
      "account_for_holidays": true
    }
  },
  "alternative_material_suggestion": {
    "suggestion_type": "alternative_material",
    "trigger_points": ["product_unavailable", "lead_time_exceeds_request", "price_exceeds_target", "manual_request"],
    "inputs": {
      "original_product": {
        "id": "string",
        "sku": "string",
        "specifications": "object",
        "price": "number",
        "availability": "string",
        "lead_time": "number"
      },
      "customer_requirements": {
        "must_match_specs": ["string"],
        "flexible_specs": ["string"],
        "max_price": "number|null",
        "required_date": "date|null"
      },
      "context": {
        "reason_for_alternative": "unavailable|lead_time|price|customer_request"
      }
    },
    "output": {
      "alternatives": [
        {
          "product_id": "string",
          "product_sku": "string",
          "product_name": "string",
          "match_score": { "type": "number", "range": [0, 1] },
          "spec_comparison": {
            "matches": ["string"],
            "differences": [
              { "spec": "string", "original": "string", "alternative": "string", "impact": "none|minor|significant" }
            ]
          },
          "price": "number",
          "price_difference_percent": "number",
          "availability": "string",
          "lead_time_days": "number",
          "recommendation_reason": "string"
        }
      ],
      "best_match": { "type": "object", "description": "Top recommended alternative" },
      "explanation": "string",
      "requires_customer_approval": { "type": "boolean" }
    },
    "display": {
      "location": "side_panel",
      "format": "comparison_table",
      "actions": ["substitute", "add_to_quote", "dismiss"]
    },
    "constraints": {
      "always_disclose_differences": true,
      "require_customer_acknowledgment_for_substitutes": true,
      "never_substitute_without_flag": true
    }
  },
  "counter_response_suggestion": {
    "suggestion_type": "counter_response",
    "trigger_points": ["counter_received"],
    "inputs": {
      "original_quote": "quote_output_schema",
      "counter": "counter_schema",
      "customer_context": {
        "tier": "string",
        "relationship_value": "number",
        "historical_negotiations": [
          {
            "final_discount": "number",
            "rounds": "number",
            "outcome": "won|lost"
          }
        ]
      },
      "margin_context": {
        "floor_margin_percent": "number",
        "target_margin_percent": "number",
        "current_margin_percent": "number"
      }
    },
    "output": {
      "recommendation": {
        "type": "string",
        "enum": ["accept", "counter", "hold_firm", "reject"]
      },
      "suggested_response": {
        "line_adjustments": "array|null",
        "date_adjustment": "date|null",
        "total_adjustment": "number|null"
      },
      "confidence": "number",
      "rationale": "string",
      "risk_assessment": {
        "accept_risk": "string",
        "counter_risk": "string",
        "reject_risk": "string"
      },
      "talking_points": ["string"]
    },
    "display": {
      "location": "suggestion_panel",
      "format": "recommendation_card",
      "actions": ["apply", "modify", "dismiss"]
    }
  },
  "suggestion_feedback": {
    "capture_on": ["apply", "dismiss", "modify"],
    "fields": {
      "suggestion_id": "string",
      "suggestion_type": "string",
      "action_taken": "applied|modified|dismissed",
      "original_value": "any",
      "final_value": "any",
      "modification_reason": "string|null",
      "dismissal_reason": "string|null",
      "outcome_tracked": "boolean"
    },
    "outcome_tracking": {
      "pricing": { "track": "quote_accepted", "success": "won_at_suggested_margin" },
      "due_date": { "track": "shipped_on_time", "success": "met_promised_date" },
      "alternative": { "track": "customer_accepted_substitute", "success": "order_placed" }
    }
  }
}
```

---

## 5. visibility_matrix

### Field Visibility: Internal vs Portal

| Field / Section | Portal (Customer) | CSR | Manager | Notes |
|-----------------|-------------------|-----|---------|-------|
| **RFQ Fields** |
| RFQ Number | ✓ | ✓ | ✓ | |
| Customer Name | ✓ (own) | ✓ | ✓ | |
| Line Items | ✓ | ✓ | ✓ | |
| Requested Quantity | ✓ | ✓ | ✓ | |
| Specifications | ✓ | ✓ | ✓ | |
| Requested Date | ✓ | ✓ | ✓ | |
| Customer Notes | ✓ | ✓ | ✓ | |
| Attached Documents | ✓ | ✓ | ✓ | |
| **Quote Fields** |
| Quote Number | ✓ | ✓ | ✓ | |
| Quoted Quantity | ✓ | ✓ | ✓ | |
| Unit Price | ✓ | ✓ | ✓ | |
| Extended Price | ✓ | ✓ | ✓ | |
| Subtotal | ✓ | ✓ | ✓ | |
| Freight Estimate | ✓ | ✓ | ✓ | |
| Total | ✓ | ✓ | ✓ | |
| Quoted Ship Date | ✓ | ✓ | ✓ | |
| Validity Period | ✓ | ✓ | ✓ | |
| Terms & Conditions | ✓ | ✓ | ✓ | |
| Notes to Customer | ✓ | ✓ | ✓ | |
| **INTERNAL ONLY** |
| Cost (per line) | ✗ | ✓ | ✓ | Never expose |
| Margin % | ✗ | ✓ | ✓ | Never expose |
| Margin $ | ✗ | ✓ | ✓ | Never expose |
| Floor Price | ✗ | ✓ | ✓ | Never expose |
| Pricing Rule Applied | ✗ | ✓ | ✓ | |
| Discount Given | ✗ | ✓ | ✓ | Sensitive |
| Cost Breakdown | ✗ | ✓ | ✓ | Never expose |
| AI Suggested Price | ✗ | ✓ | ✓ | |
| Win Probability | ✗ | ✓ | ✓ | |
| Internal Notes | ✗ | ✓ | ✓ | |
| Approval Status | ✗ | ✓ | ✓ | |
| Assigned CSR (full) | Contact only | ✓ | ✓ | Portal sees name/contact |
| Customer Tier | ✗ | ✓ | ✓ | |
| Credit Status | ✗ | ✓ | ✓ | |
| Historical Win Rate | ✗ | ✓ | ✓ | |
| Competitor Intel | ✗ | ✓ | ✓ | |
| **Counter Fields** |
| Counter Price | ✓ | ✓ | ✓ | |
| Counter Date | ✓ | ✓ | ✓ | |
| Counter Notes | ✓ | ✓ | ✓ | |
| Counter Round # | ✓ | ✓ | ✓ | |
| Margin Impact of Counter | ✗ | ✓ | ✓ | Never expose |
| AI Counter Recommendation | ✗ | ✓ | ✓ | |
| **Negotiation History** |
| State Changes | ✓ (filtered) | ✓ | ✓ | Portal sees customer-relevant only |
| Quote Sent Events | ✓ | ✓ | ✓ | |
| Counter Events | ✓ | ✓ | ✓ | |
| Internal Approvals | ✗ | ✓ | ✓ | |
| Internal Notes | ✗ | ✓ | ✓ | |
| CSR Assignments | ✗ | ✓ | ✓ | |
| SLA Metrics | ✗ | ✓ | ✓ | |
| **Analytics** |
| Own RFQ History | ✓ | ✓ | ✓ | Customer sees own only |
| Win/Loss Stats | ✗ | ✓ | ✓ | |
| Margin Analytics | ✗ | ✓ (limited) | ✓ | CSR sees own performance |
| Cycle Time Analytics | ✗ | ✓ | ✓ | |
| Customer Segment Analytics | ✗ | ✗ | ✓ | Manager only |

### API Response Filtering

| Endpoint | Portal Response | Internal Response |
|----------|-----------------|-------------------|
| `GET /api/rfq/:id` | Excludes `_internal` | Full response |
| `GET /api/quote/:id` | Excludes `_internal`, costs, margins | Full response |
| `GET /api/rfq/:id/events` | `visible_to_customer=true` only | All events |
| `GET /api/rfq/:id/history` | Filtered timeline | Complete audit log |

### UI Component Visibility

| Component | Portal | CSR | Manager |
|-----------|--------|-----|---------|
| MarginSummaryCard | ✗ | ✓ | ✓ |
| AIPricingSuggestions | ✗ | ✓ | ✓ |
| CustomerContextCard | ✗ | ✓ | ✓ |
| CostColumn (in table) | ✗ | ✓ | ✓ |
| MarginColumn (in table) | ✗ | ✓ | ✓ |
| InternalNotesField | ✗ | ✓ | ✓ |
| ApprovalWorkflow | ✗ | ✓ | ✓ |
| WinProbabilityIndicator | ✗ | ✓ | ✓ |
| CompetitorIntelPanel | ✗ | ✗ | ✓ |

---

## 6. analytics_signals

```json
{
  "metrics": {
    "win_rate": {
      "metric_id": "rfq_win_rate",
      "description": "Percentage of quoted RFQs that convert to orders",
      "formula": "count(status=converted) / count(status in [converted, customer_rejected, negotiation_failed, expired])",
      "dimensions": ["customer", "customer_tier", "product_category", "csr", "branch", "division", "time_period"],
      "granularity": ["daily", "weekly", "monthly", "quarterly"],
      "targets": {
        "overall": 0.35,
        "platinum_tier": 0.50,
        "gold_tier": 0.40,
        "standard_tier": 0.30
      },
      "alerts": [
        { "condition": "win_rate < 0.25", "severity": "warning" },
        { "condition": "win_rate < 0.15", "severity": "critical" }
      ]
    },
    "avg_margin": {
      "metric_id": "avg_quote_margin",
      "description": "Average margin percentage on won quotes",
      "formula": "avg(margin_percent) where status=converted",
      "dimensions": ["customer_tier", "product_category", "csr", "branch", "division", "time_period"],
      "granularity": ["daily", "weekly", "monthly"],
      "targets": {
        "overall": 0.22,
        "metals": 0.20,
        "plastics": 0.25
      },
      "related_metrics": ["margin_vs_floor_ratio", "discount_given_percent"]
    },
    "cycle_time": {
      "metric_id": "rfq_cycle_time",
      "description": "Time from RFQ submission to final outcome",
      "sub_metrics": {
        "time_to_first_response": {
          "formula": "avg(first_response_at - submitted_at)",
          "target_hours": 4,
          "sla_hours": 8
        },
        "time_to_quote": {
          "formula": "avg(quote_sent_at - submitted_at)",
          "target_hours": 24,
          "sla_hours": 48
        },
        "time_to_decision": {
          "formula": "avg(decision_at - quote_sent_at)",
          "target_days": 7
        },
        "total_cycle_time": {
          "formula": "avg(outcome_at - submitted_at)",
          "target_days": 10
        },
        "negotiation_duration": {
          "formula": "avg(final_decision_at - first_quote_at) where counter_rounds > 0",
          "target_days": 5
        }
      },
      "dimensions": ["customer_tier", "csr", "branch", "complexity_tier"],
      "granularity": ["daily", "weekly", "monthly"]
    },
    "frequency_by_customer": {
      "metric_id": "rfq_frequency",
      "description": "RFQ submission patterns by customer",
      "sub_metrics": {
        "rfqs_per_customer": {
          "formula": "count(rfqs) group by customer_id",
          "period": "monthly"
        },
        "avg_rfq_value": {
          "formula": "avg(quote_total) group by customer_id"
        },
        "rfq_to_order_ratio": {
          "formula": "count(converted) / count(submitted) group by customer_id"
        },
        "repeat_customer_rate": {
          "formula": "count(distinct customers with > 1 rfq) / count(distinct customers)"
        }
      },
      "dimensions": ["customer", "customer_tier", "industry", "region"],
      "granularity": ["monthly", "quarterly"]
    },
    "counter_analytics": {
      "metric_id": "negotiation_patterns",
      "description": "Counter-offer patterns and outcomes",
      "sub_metrics": {
        "counter_rate": {
          "formula": "count(has_counter) / count(quoted)",
          "description": "% of quotes that receive counter-offers"
        },
        "avg_counter_rounds": {
          "formula": "avg(counter_rounds) where has_counter",
          "target": 1.5
        },
        "counter_win_rate": {
          "formula": "count(converted where has_counter) / count(has_counter)"
        },
        "avg_counter_discount": {
          "formula": "avg((original_total - final_total) / original_total) where has_counter"
        },
        "counter_to_accept_rate": {
          "formula": "count(accepted_counter) / count(counters_submitted)"
        }
      },
      "dimensions": ["customer_tier", "product_category", "csr", "counter_type"]
    },
    "loss_analysis": {
      "metric_id": "rfq_loss_reasons",
      "description": "Analysis of lost RFQs",
      "sub_metrics": {
        "loss_by_reason": {
          "formula": "count group by rejection_reason",
          "reasons": ["price_too_high", "lead_time_too_long", "found_alternative", "project_cancelled", "budget_constraints", "specs_not_met", "other"]
        },
        "loss_by_stage": {
          "formula": "count group by status where outcome=lost",
          "stages": ["rejected", "customer_rejected", "negotiation_failed", "expired"]
        },
        "competitive_loss_rate": {
          "formula": "count(reason=found_alternative) / count(outcome=lost)"
        },
        "price_loss_rate": {
          "formula": "count(reason=price_too_high) / count(outcome=lost)"
        }
      },
      "dimensions": ["customer_tier", "product_category", "csr", "time_period"]
    },
    "sla_compliance": {
      "metric_id": "rfq_sla_metrics",
      "description": "SLA adherence for RFQ processing",
      "sub_metrics": {
        "first_response_sla_met": {
          "formula": "count(first_response_hours <= 4) / count(all)",
          "target": 0.95
        },
        "quote_sla_met": {
          "formula": "count(quote_hours <= 24) / count(all)",
          "target": 0.90
        },
        "escalation_rate": {
          "formula": "count(escalated) / count(all)",
          "target_max": 0.05
        }
      },
      "dimensions": ["csr", "branch", "time_period"]
    },
    "ai_effectiveness": {
      "metric_id": "ai_suggestion_performance",
      "description": "Performance of AI suggestions in RFQ process",
      "sub_metrics": {
        "pricing_suggestion_acceptance": {
          "formula": "count(pricing_suggestion_applied) / count(pricing_suggestion_shown)"
        },
        "date_suggestion_acceptance": {
          "formula": "count(date_suggestion_applied) / count(date_suggestion_shown)"
        },
        "ai_priced_win_rate": {
          "formula": "win_rate where ai_price_applied vs win_rate where ai_price_modified"
        },
        "margin_accuracy": {
          "formula": "correlation(ai_suggested_margin, actual_margin)"
        }
      },
      "dimensions": ["suggestion_type", "csr", "product_category"]
    }
  },
  "events": {
    "rfq_submitted": {
      "event_id": "rfq.submitted",
      "payload": ["rfq_id", "customer_id", "line_count", "estimated_value", "requested_date", "source"]
    },
    "quote_sent": {
      "event_id": "rfq.quote_sent",
      "payload": ["rfq_id", "quote_id", "customer_id", "total", "margin_percent", "validity_days", "csr_id"]
    },
    "counter_received": {
      "event_id": "rfq.counter_received",
      "payload": ["rfq_id", "counter_round", "adjustment_percent", "counter_type"]
    },
    "rfq_converted": {
      "event_id": "rfq.converted",
      "payload": ["rfq_id", "order_id", "customer_id", "final_total", "final_margin", "cycle_days", "counter_rounds"]
    },
    "rfq_lost": {
      "event_id": "rfq.lost",
      "payload": ["rfq_id", "customer_id", "loss_reason", "loss_stage", "quoted_total", "cycle_days"]
    }
  },
  "dashboards": {
    "rfq_performance": {
      "widgets": [
        { "type": "kpi", "metric": "win_rate", "comparison": "prior_period" },
        { "type": "kpi", "metric": "avg_margin", "comparison": "target" },
        { "type": "kpi", "metric": "cycle_time.time_to_quote", "comparison": "sla" },
        { "type": "funnel", "stages": ["submitted", "quoted", "countered", "accepted", "converted"] },
        { "type": "bar", "metric": "loss_by_reason", "groupBy": "rejection_reason" },
        { "type": "line", "metric": "win_rate", "trend": "weekly", "dimensions": ["customer_tier"] },
        { "type": "table", "metric": "csr_performance", "columns": ["csr", "rfq_count", "win_rate", "avg_margin", "avg_cycle_time"] }
      ],
      "filters": ["date_range", "branch", "division", "customer_tier", "product_category", "csr"],
      "roles": ["BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"]
    },
    "csr_dashboard": {
      "widgets": [
        { "type": "kpi", "metric": "my_win_rate" },
        { "type": "kpi", "metric": "my_pending_rfqs" },
        { "type": "kpi", "metric": "my_sla_compliance" },
        { "type": "list", "metric": "my_rfqs_needing_action", "limit": 10 },
        { "type": "line", "metric": "my_performance_trend" }
      ],
      "scope": "user_own_data",
      "roles": ["CSR"]
    }
  },
  "alerts": [
    {
      "alert_id": "win_rate_drop",
      "condition": "win_rate < target * 0.8 for 2 consecutive weeks",
      "severity": "warning",
      "recipients": ["DIVISION_MANAGER"]
    },
    {
      "alert_id": "sla_breach_spike",
      "condition": "sla_breach_rate > 0.1 in last 24h",
      "severity": "critical",
      "recipients": ["BRANCH_MANAGER"]
    },
    {
      "alert_id": "high_value_rfq_aging",
      "condition": "rfq.estimated_value > 50000 AND status=submitted for > 4h",
      "severity": "warning",
      "recipients": ["assigned_csr", "BRANCH_MANAGER"]
    }
  ]
}
```

---

## 7. data_model

```json
{
  "entities": {
    "RFQ": {
      "fields": {
        "id": "uuid",
        "rfq_number": "string unique",
        "customer_id": "uuid FK Customer",
        "status": "enum(draft, submitted, clarification_needed, in_review, pending_approval, quoted, countered, accepted, converted, rejected, customer_rejected, negotiation_failed, expired, withdrawn, on_hold, cancelled, discarded)",
        "source": "enum(portal, email, phone, edi)",
        "assigned_csr_id": "uuid FK User nullable",
        "contact_name": "string",
        "contact_email": "string",
        "contact_phone": "string nullable",
        "delivery_type": "enum(standard, expedited, will_call)",
        "requested_date": "date nullable",
        "ship_to_address": "jsonb",
        "allow_split_shipments": "boolean",
        "reference_po": "string nullable",
        "project_name": "string nullable",
        "customer_notes": "text nullable",
        "internal_notes": "text nullable",
        "submitted_at": "timestamp nullable",
        "quoted_at": "timestamp nullable",
        "decided_at": "timestamp nullable",
        "outcome": "enum(won, lost, expired, withdrawn, cancelled, discarded) nullable",
        "loss_reason": "string nullable",
        "counter_rounds": "integer default 0",
        "current_quote_id": "uuid FK Quote nullable",
        "converted_order_id": "uuid FK Order nullable",
        "tenant_id": "uuid"
      },
      "indexes": ["rfq_number", "customer_id", "status", "assigned_csr_id", "submitted_at", "tenant_id"]
    },
    "RFQLineItem": {
      "fields": {
        "id": "uuid",
        "rfq_id": "uuid FK RFQ",
        "line_number": "integer",
        "product_id": "uuid FK Product",
        "quantity": "decimal",
        "unit": "string",
        "specifications": "jsonb",
        "processing": "jsonb",
        "notes": "text nullable"
      },
      "indexes": ["rfq_id"]
    },
    "Quote": {
      "fields": {
        "id": "uuid",
        "rfq_id": "uuid FK RFQ",
        "quote_number": "string unique",
        "quote_version": "integer",
        "is_counter_response": "boolean",
        "counter_round": "integer",
        "created_by": "uuid FK User",
        "approved_by": "uuid FK User nullable",
        "approval_status": "enum(not_required, pending, approved, rejected) nullable",
        "subtotal": "decimal",
        "freight": "decimal",
        "processing_charges": "decimal",
        "taxes": "decimal",
        "total": "decimal",
        "total_cost": "decimal",
        "total_margin": "decimal",
        "margin_percent": "decimal",
        "quoted_ship_date": "date",
        "payment_terms": "string",
        "freight_terms": "string",
        "fob_point": "string",
        "valid_from": "timestamp",
        "valid_until": "timestamp",
        "notes_to_customer": "text nullable",
        "internal_notes": "text nullable",
        "conditions": "jsonb",
        "sent_at": "timestamp nullable",
        "tenant_id": "uuid"
      },
      "indexes": ["rfq_id", "quote_number", "created_by", "sent_at"]
    },
    "QuoteLineItem": {
      "fields": {
        "id": "uuid",
        "quote_id": "uuid FK Quote",
        "rfq_line_id": "uuid FK RFQLineItem",
        "line_number": "integer",
        "product_id": "uuid FK Product",
        "quoted_quantity": "decimal",
        "unit": "string",
        "unit_price": "decimal",
        "extended_price": "decimal",
        "cost": "decimal",
        "margin_percent": "decimal",
        "margin_amount": "decimal",
        "floor_price": "decimal",
        "ai_suggested_price": "decimal nullable",
        "pricing_rule_applied": "string nullable",
        "discount_percent": "decimal nullable",
        "lead_time_days": "integer",
        "availability_status": "string",
        "specifications": "jsonb",
        "processing": "jsonb",
        "notes": "text nullable"
      },
      "indexes": ["quote_id"]
    },
    "CounterOffer": {
      "fields": {
        "id": "uuid",
        "rfq_id": "uuid FK RFQ",
        "quote_id": "uuid FK Quote",
        "counter_round": "integer",
        "counter_type": "enum(price, date, both, quantity, specs, other)",
        "submitted_by": "string",
        "submitted_at": "timestamp",
        "source": "enum(portal, email, phone, csr_entry)",
        "line_adjustments": "jsonb",
        "delivery_adjustment": "jsonb nullable",
        "original_total": "decimal",
        "counter_total": "decimal",
        "adjustment_percent": "decimal",
        "notes": "text nullable",
        "response_quote_id": "uuid FK Quote nullable",
        "status": "enum(pending, accepted, rejected, countered)"
      },
      "indexes": ["rfq_id", "quote_id", "submitted_at"]
    },
    "RFQEvent": {
      "fields": {
        "id": "uuid",
        "rfq_id": "uuid FK RFQ",
        "event_type": "string",
        "actor_type": "enum(customer, csr, manager, system)",
        "actor_id": "uuid nullable",
        "actor_name": "string",
        "timestamp": "timestamp",
        "payload": "jsonb",
        "visible_to_customer": "boolean",
        "notes": "text nullable"
      },
      "indexes": ["rfq_id", "timestamp", "event_type"]
    },
    "RFQDocument": {
      "fields": {
        "id": "uuid",
        "rfq_id": "uuid FK RFQ",
        "name": "string",
        "type": "enum(drawing, specification, po, quote_pdf, other)",
        "storage_key": "string",
        "url": "string",
        "size_bytes": "integer",
        "uploaded_by": "uuid FK User",
        "uploaded_at": "timestamp",
        "visible_to_customer": "boolean"
      },
      "indexes": ["rfq_id"]
    }
  }
}
```

---

## 8. api_endpoints

```json
[
  {
    "method": "POST",
    "path": "/api/portal/rfq",
    "description": "Customer submits new RFQ",
    "auth": "portal_customer",
    "body": "rfq_input_schema",
    "response": { "rfq": "object", "rfq_number": "string" }
  },
  {
    "method": "GET",
    "path": "/api/portal/rfq",
    "description": "Customer lists their RFQs",
    "auth": "portal_customer",
    "query": ["status", "from_date", "to_date"],
    "response": { "rfqs": "array", "pagination": "object" }
  },
  {
    "method": "GET",
    "path": "/api/portal/rfq/:id",
    "description": "Customer views RFQ detail (filtered)",
    "auth": "portal_customer",
    "response": "rfq + quote (internal fields stripped)"
  },
  {
    "method": "POST",
    "path": "/api/portal/rfq/:id/counter",
    "description": "Customer submits counter-offer",
    "auth": "portal_customer",
    "body": "counter_schema",
    "response": { "counter": "object", "status": "string" }
  },
  {
    "method": "POST",
    "path": "/api/portal/rfq/:id/accept",
    "description": "Customer accepts quote",
    "auth": "portal_customer",
    "response": { "status": "accepted", "next_steps": "string" }
  },
  {
    "method": "POST",
    "path": "/api/portal/rfq/:id/reject",
    "description": "Customer rejects quote",
    "auth": "portal_customer",
    "body": { "reason": "string", "details": "string" },
    "response": { "status": "customer_rejected" }
  },
  {
    "method": "GET",
    "path": "/api/rfq",
    "description": "Internal: List RFQs (queue)",
    "auth": "internal",
    "query": ["status", "assigned_csr", "customer_id", "from_date", "to_date"],
    "response": { "rfqs": "array", "pagination": "object" }
  },
  {
    "method": "GET",
    "path": "/api/rfq/:id",
    "description": "Internal: Full RFQ detail",
    "auth": "internal",
    "response": "full rfq + quote + events"
  },
  {
    "method": "POST",
    "path": "/api/rfq/:id/quote",
    "description": "Internal: Create/update quote",
    "auth": "internal",
    "body": "quote_output_schema (line items, terms, etc)",
    "response": { "quote": "object" }
  },
  {
    "method": "POST",
    "path": "/api/rfq/:id/quote/send",
    "description": "Internal: Send quote to customer",
    "auth": "internal",
    "response": { "status": "quoted", "sent_at": "timestamp" }
  },
  {
    "method": "POST",
    "path": "/api/rfq/:id/assign",
    "description": "Internal: Assign CSR",
    "auth": "internal",
    "body": { "csr_id": "uuid" },
    "response": { "assigned": true }
  },
  {
    "method": "POST",
    "path": "/api/rfq/:id/counter/:counterId/respond",
    "description": "Internal: Respond to counter-offer",
    "auth": "internal",
    "body": { "action": "accept|counter|reject", "quote": "object|null" },
    "response": { "status": "string" }
  },
  {
    "method": "POST",
    "path": "/api/rfq/:id/convert",
    "description": "Internal: Convert accepted RFQ to order",
    "auth": "internal",
    "response": { "order_id": "uuid", "order_number": "string" }
  },
  {
    "method": "GET",
    "path": "/api/rfq/:id/events",
    "description": "Get negotiation event timeline",
    "auth": "internal|portal_customer",
    "response": { "events": "array (filtered by visibility)" }
  },
  {
    "method": "GET",
    "path": "/api/rfq/analytics",
    "description": "RFQ analytics and metrics",
    "auth": "internal (manager+)",
    "query": ["metric", "dimensions", "from_date", "to_date"],
    "response": { "data": "array", "summary": "object" }
  }
]
```
