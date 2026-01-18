# 60 — Build Order Intake & POS Workflows

> **Purpose:** UI workflow and data capture specifications for CSR Order Entry and Retail POS.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. workflow

```json
{
  "csr_flow": {
    "id": "csr_order_entry",
    "label": "CSR Order Entry",
    "app": "order_intake_app",
    "steps": [
      {
        "step": 1,
        "id": "select_customer",
        "label": "Select Customer",
        "required": true,
        "can_skip": false,
        "outputs": ["customer_id", "ship_to_id", "credit_status", "pricing_tier"]
      },
      {
        "step": 2,
        "id": "define_job",
        "label": "Define Job",
        "required": true,
        "can_skip": false,
        "outputs": ["job_type", "division", "po_number", "requested_date"]
      },
      {
        "step": 3,
        "id": "select_material",
        "label": "Select Material",
        "required": true,
        "can_skip": false,
        "repeatable": true,
        "outputs": ["material_id", "grade", "size", "quantity", "uom"]
      },
      {
        "step": 4,
        "id": "configure_processing",
        "label": "Configure Processing",
        "required": false,
        "can_skip": true,
        "skip_condition": "job_type == 'stock_sale'",
        "repeatable": true,
        "outputs": ["processing_type", "target_dimensions", "tolerances", "special_instructions"]
      },
      {
        "step": 5,
        "id": "price_and_terms",
        "label": "Price & Terms",
        "required": true,
        "can_skip": false,
        "outputs": ["unit_price", "processing_charge", "freight_terms", "payment_terms", "discounts"]
      },
      {
        "step": 6,
        "id": "confirm_and_submit",
        "label": "Review & Submit",
        "required": true,
        "can_skip": false,
        "outputs": ["order_id", "confirmation_number"]
      }
    ],
    "navigation": {
      "allow_back": true,
      "allow_jump": true,
      "save_draft_on_exit": true,
      "auto_save_interval_seconds": 30
    }
  },
  "retail_flow": {
    "id": "retail_pos_transaction",
    "label": "Retail Counter Sale",
    "app": "retail_pos_app",
    "steps": [
      {
        "step": 1,
        "id": "scan_or_search_item",
        "label": "Add Items",
        "required": true,
        "can_skip": false,
        "repeatable": true,
        "outputs": ["product_id", "quantity", "unit_price"]
      },
      {
        "step": 2,
        "id": "cut_to_size",
        "label": "Cut to Size",
        "required": false,
        "can_skip": true,
        "skip_condition": "no_cutting_required",
        "outputs": ["cut_length", "cut_quantity", "cutting_charge"]
      },
      {
        "step": 3,
        "id": "customer_info",
        "label": "Customer",
        "required": false,
        "can_skip": true,
        "skip_condition": "cash_sale",
        "outputs": ["customer_id", "tax_exempt_status"]
      },
      {
        "step": 4,
        "id": "review_cart",
        "label": "Review Cart",
        "required": true,
        "can_skip": false,
        "outputs": ["cart_total", "tax_amount", "grand_total"]
      },
      {
        "step": 5,
        "id": "take_payment",
        "label": "Payment",
        "required": true,
        "can_skip": false,
        "outputs": ["payment_method", "payment_amount", "change_due"]
      },
      {
        "step": 6,
        "id": "print_docs",
        "label": "Complete",
        "required": true,
        "can_skip": false,
        "outputs": ["receipt_printed", "transaction_id"]
      }
    ],
    "navigation": {
      "allow_back": true,
      "allow_jump": false,
      "save_draft_on_exit": false,
      "timeout_minutes": 10
    }
  },
  "will_call_pickup_flow": {
    "id": "will_call_pickup",
    "label": "Will-Call Pickup",
    "app": "retail_pos_app",
    "steps": [
      {
        "step": 1,
        "id": "lookup_order",
        "label": "Find Order",
        "required": true,
        "outputs": ["order_id", "customer_name", "items"]
      },
      {
        "step": 2,
        "id": "verify_customer",
        "label": "Verify Customer",
        "required": true,
        "outputs": ["verified", "id_type", "signature_captured"]
      },
      {
        "step": 3,
        "id": "collect_balance",
        "label": "Collect Balance",
        "required": false,
        "skip_condition": "prepaid",
        "outputs": ["payment_method", "payment_amount"]
      },
      {
        "step": 4,
        "id": "release_material",
        "label": "Release",
        "required": true,
        "outputs": ["release_timestamp", "released_by"]
      }
    ]
  },
  "quote_flow": {
    "id": "csr_quote_entry",
    "label": "Create Quote",
    "app": "order_intake_app",
    "steps": [
      {
        "step": 1,
        "id": "select_customer",
        "label": "Select Customer",
        "required": true,
        "outputs": ["customer_id", "contact_id", "pricing_tier"]
      },
      {
        "step": 2,
        "id": "add_line_items",
        "label": "Add Items",
        "required": true,
        "repeatable": true,
        "outputs": ["material_id", "processing", "quantity", "quoted_price"]
      },
      {
        "step": 3,
        "id": "set_terms",
        "label": "Terms & Validity",
        "required": true,
        "outputs": ["valid_days", "freight_terms", "notes"]
      },
      {
        "step": 4,
        "id": "review_and_send",
        "label": "Review & Send",
        "required": true,
        "outputs": ["quote_id", "sent_to_email", "sent_timestamp"]
      }
    ]
  }
}
```

---

## 2. screen_sequence

```json
[
  {
    "id": "customer_search_screen",
    "label": "Customer Search",
    "app": "order_intake_app",
    "workflow_step": "select_customer",
    "layout": "search_and_results",
    "fields": [
      { "id": "search_query", "type": "search_input", "placeholder": "Customer name, account #, phone, or email" },
      { "id": "filter_active_only", "type": "toggle", "default": true },
      { "id": "filter_location", "type": "dropdown", "options_source": "user.locations" }
    ],
    "results_columns": [
      { "field": "account_number", "label": "Account #", "width": 100 },
      { "field": "company_name", "label": "Company", "width": 200 },
      { "field": "city_state", "label": "Location", "width": 150 },
      { "field": "credit_status", "label": "Credit", "width": 80, "type": "status_badge" },
      { "field": "sales_rep", "label": "Rep", "width": 100 },
      { "field": "last_order_date", "label": "Last Order", "width": 100, "format": "date" }
    ],
    "primary_actions": [
      { "id": "select_customer", "label": "Select", "on_row_click": true },
      { "id": "view_customer_detail", "label": "View Details", "icon": "info" }
    ],
    "secondary_actions": [
      { "id": "create_new_customer", "label": "New Customer", "icon": "person_add" }
    ],
    "empty_state": {
      "message": "No customers found",
      "action": "create_new_customer"
    }
  },
  {
    "id": "customer_detail_panel",
    "label": "Customer Details",
    "app": "order_intake_app",
    "workflow_step": "select_customer",
    "layout": "side_panel",
    "sections": [
      {
        "id": "account_info",
        "label": "Account",
        "fields": [
          { "id": "account_number", "type": "display", "label": "Account #" },
          { "id": "company_name", "type": "display", "label": "Company" },
          { "id": "primary_contact", "type": "display", "label": "Contact" },
          { "id": "phone", "type": "display", "label": "Phone", "action": "click_to_call" },
          { "id": "email", "type": "display", "label": "Email", "action": "click_to_email" }
        ]
      },
      {
        "id": "credit_info",
        "label": "Credit",
        "fields": [
          { "id": "credit_limit", "type": "display", "format": "currency" },
          { "id": "current_balance", "type": "display", "format": "currency" },
          { "id": "available_credit", "type": "display", "format": "currency", "highlight_when_low": true },
          { "id": "credit_status", "type": "status_badge" },
          { "id": "payment_terms", "type": "display" }
        ]
      },
      {
        "id": "ship_to_addresses",
        "label": "Ship-To Addresses",
        "type": "selectable_list",
        "fields": [
          { "id": "address_name", "type": "display" },
          { "id": "full_address", "type": "display" },
          { "id": "is_default", "type": "badge", "visible_when": "item.is_default" }
        ]
      }
    ],
    "primary_actions": [
      { "id": "confirm_customer", "label": "Use This Customer", "color": "primary" }
    ],
    "secondary_actions": [
      { "id": "add_ship_to", "label": "Add Address", "icon": "add_location" },
      { "id": "edit_customer", "label": "Edit", "icon": "edit", "requires_permission": "customer.edit" }
    ]
  },
  {
    "id": "job_definition_screen",
    "label": "Job Details",
    "app": "order_intake_app",
    "workflow_step": "define_job",
    "layout": "form",
    "fields": [
      { "id": "job_type", "type": "chip_select", "label": "Job Type", "required": true, "options": [
        { "value": "stock_sale", "label": "Stock Sale", "icon": "inventory" },
        { "value": "processing", "label": "Processing", "icon": "precision_manufacturing" },
        { "value": "fabrication", "label": "Fabrication", "icon": "construction" },
        { "value": "consignment", "label": "Consignment", "icon": "handshake" }
      ]},
      { "id": "division", "type": "toggle_group", "label": "Division", "required": true, "options": [
        { "value": "metals", "label": "Metals" },
        { "value": "plastics", "label": "Plastics" }
      ]},
      { "id": "customer_po", "type": "text_input", "label": "Customer PO #", "required": false },
      { "id": "requested_date", "type": "date_picker", "label": "Requested Date", "required": true, "min": "today" },
      { "id": "priority", "type": "radio_group", "label": "Priority", "default": "standard", "options": [
        { "value": "rush", "label": "Rush (+25%)", "color": "error" },
        { "value": "hot", "label": "Hot (+10%)", "color": "warning" },
        { "value": "standard", "label": "Standard", "color": "default" },
        { "value": "economy", "label": "Economy (-5%)", "color": "info" }
      ]},
      { "id": "special_instructions", "type": "text_area", "label": "Special Instructions", "rows": 3 }
    ],
    "primary_actions": [
      { "id": "continue_to_material", "label": "Continue", "color": "primary" }
    ],
    "secondary_actions": [
      { "id": "save_draft", "label": "Save Draft", "icon": "save" },
      { "id": "back", "label": "Back", "icon": "arrow_back" }
    ]
  },
  {
    "id": "material_selection_screen",
    "label": "Select Material",
    "app": "order_intake_app",
    "workflow_step": "select_material",
    "layout": "catalog_browser",
    "filter_panel": {
      "fields": [
        { "id": "category", "type": "tree_select", "label": "Category", "options_source": "product_categories" },
        { "id": "grade", "type": "multi_select", "label": "Grade", "options_source": "grades_for_division" },
        { "id": "form", "type": "chip_select", "label": "Form", "options": ["coil", "sheet", "plate", "bar", "tube", "structural", "rod", "film"] },
        { "id": "thickness_range", "type": "range_slider", "label": "Thickness", "unit": "in" },
        { "id": "width_range", "type": "range_slider", "label": "Width", "unit": "in" },
        { "id": "in_stock_only", "type": "toggle", "label": "In Stock Only", "default": false }
      ]
    },
    "results_view": {
      "type": "card_grid",
      "card_fields": [
        { "field": "product_code", "position": "header" },
        { "field": "description", "position": "body" },
        { "field": "size_display", "position": "body" },
        { "field": "stock_qty", "position": "footer", "format": "quantity_with_uom" },
        { "field": "base_price", "position": "footer", "format": "currency_per_uom" }
      ]
    },
    "primary_actions": [
      { "id": "add_to_order", "label": "Add to Order", "on_card_click": true }
    ],
    "secondary_actions": [
      { "id": "check_availability", "label": "Check All Locations", "icon": "search" },
      { "id": "request_quote_non_stock", "label": "Request Non-Stock", "icon": "request_quote" }
    ]
  },
  {
    "id": "material_quantity_modal",
    "label": "Specify Quantity",
    "app": "order_intake_app",
    "workflow_step": "select_material",
    "layout": "modal",
    "fields": [
      { "id": "quantity", "type": "numeric_input", "label": "Quantity", "required": true, "size": "large" },
      { "id": "uom", "type": "dropdown", "label": "Unit", "options_source": "product.available_uoms" },
      { "id": "from_inventory", "type": "toggle", "label": "Allocate from Inventory", "default": true },
      { "id": "specific_lot", "type": "lookup", "label": "Specific Lot/Heat", "visible_when": "from_inventory", "optional": true },
      { "id": "notes", "type": "text_input", "label": "Line Notes", "optional": true }
    ],
    "info_display": [
      { "label": "Available", "binding": "product.available_qty" },
      { "label": "On Order", "binding": "product.on_order_qty" },
      { "label": "Est. Price", "binding": "calculated.line_total", "format": "currency" }
    ],
    "primary_actions": [
      { "id": "add_line", "label": "Add Line", "color": "primary" }
    ],
    "secondary_actions": [
      { "id": "cancel", "label": "Cancel" }
    ]
  },
  {
    "id": "processing_config_screen",
    "label": "Processing Configuration",
    "app": "order_intake_app",
    "workflow_step": "configure_processing",
    "layout": "multi_section_form",
    "context_display": {
      "fields": ["material_description", "quantity", "source_size"]
    },
    "sections": [
      {
        "id": "processing_type",
        "label": "Processing Type",
        "type": "chip_select_grid",
        "options_source": "processing_types_for_material",
        "columns": 3
      },
      {
        "id": "target_dimensions",
        "label": "Target Dimensions",
        "type": "dynamic_form",
        "schema_binding": "selected_processing.dimension_schema",
        "example_fields": [
          { "id": "target_width", "type": "dimension_input", "label": "Width", "unit": "in" },
          { "id": "target_length", "type": "dimension_input", "label": "Length", "unit": "in" },
          { "id": "pieces", "type": "numeric_input", "label": "Pieces" }
        ]
      },
      {
        "id": "tolerances",
        "label": "Tolerances",
        "type": "tolerance_selector",
        "options": [
          { "value": "standard", "label": "Standard", "description": "Industry standard tolerances" },
          { "value": "tight", "label": "Tight (+15%)", "description": "Tighter than standard" },
          { "value": "precision", "label": "Precision (+30%)", "description": "Close tolerance work" },
          { "value": "custom", "label": "Custom", "description": "Specify custom tolerances" }
        ]
      },
      {
        "id": "custom_tolerances",
        "label": "Custom Tolerances",
        "visible_when": "tolerances == 'custom'",
        "fields": [
          { "id": "width_tolerance_plus", "type": "decimal_input", "label": "+", "unit": "in" },
          { "id": "width_tolerance_minus", "type": "decimal_input", "label": "-", "unit": "in" },
          { "id": "length_tolerance_plus", "type": "decimal_input", "label": "+", "unit": "in" },
          { "id": "length_tolerance_minus", "type": "decimal_input", "label": "-", "unit": "in" }
        ]
      },
      {
        "id": "additional_options",
        "label": "Additional Options",
        "type": "checkbox_group",
        "options_source": "processing_options_for_type"
      },
      {
        "id": "special_instructions",
        "label": "Special Instructions",
        "type": "text_area",
        "rows": 3,
        "placeholder": "Edge condition, orientation, packaging requirements..."
      }
    ],
    "primary_actions": [
      { "id": "save_processing", "label": "Save Processing", "color": "primary" },
      { "id": "add_another_process", "label": "Add Another Process", "icon": "add" }
    ],
    "secondary_actions": [
      { "id": "skip_processing", "label": "No Processing Required" },
      { "id": "back", "label": "Back" }
    ]
  },
  {
    "id": "pricing_screen",
    "label": "Pricing & Terms",
    "app": "order_intake_app",
    "workflow_step": "price_and_terms",
    "layout": "split_panel",
    "left_panel": {
      "id": "line_items_summary",
      "type": "editable_table",
      "columns": [
        { "field": "line_number", "label": "#", "width": 40 },
        { "field": "description", "label": "Description", "width": 250 },
        { "field": "quantity", "label": "Qty", "width": 80, "editable": true },
        { "field": "uom", "label": "UOM", "width": 60 },
        { "field": "unit_price", "label": "Unit Price", "width": 100, "editable": true, "format": "currency" },
        { "field": "processing_charge", "label": "Processing", "width": 100, "format": "currency" },
        { "field": "line_total", "label": "Total", "width": 100, "format": "currency" }
      ],
      "row_actions": [
        { "id": "edit_line", "icon": "edit" },
        { "id": "remove_line", "icon": "delete", "confirm": true }
      ]
    },
    "right_panel": {
      "id": "order_totals",
      "sections": [
        {
          "id": "totals",
          "type": "summary_list",
          "items": [
            { "label": "Subtotal", "binding": "order.subtotal", "format": "currency" },
            { "label": "Processing", "binding": "order.processing_total", "format": "currency" },
            { "label": "Discount", "binding": "order.discount_amount", "format": "currency", "color": "success" },
            { "label": "Freight", "binding": "order.freight_estimate", "format": "currency" },
            { "label": "Tax", "binding": "order.tax_amount", "format": "currency" },
            { "label": "Total", "binding": "order.grand_total", "format": "currency", "bold": true, "size": "large" }
          ]
        },
        {
          "id": "discount_section",
          "type": "form",
          "fields": [
            { "id": "discount_type", "type": "dropdown", "label": "Discount", "options": [
              { "value": "none", "label": "No Discount" },
              { "value": "percent", "label": "Percentage" },
              { "value": "amount", "label": "Fixed Amount" },
              { "value": "price_override", "label": "Price Override" }
            ]},
            { "id": "discount_value", "type": "numeric_input", "visible_when": "discount_type != 'none'" },
            { "id": "discount_reason", "type": "dropdown", "label": "Reason", "visible_when": "discount_type != 'none'", "options_source": "discount_reasons" }
          ]
        },
        {
          "id": "terms_section",
          "type": "form",
          "fields": [
            { "id": "payment_terms", "type": "dropdown", "label": "Payment Terms", "default_binding": "customer.payment_terms", "options_source": "payment_terms" },
            { "id": "freight_terms", "type": "dropdown", "label": "Freight Terms", "options": [
              { "value": "prepaid", "label": "Prepaid" },
              { "value": "collect", "label": "Collect" },
              { "value": "prepaid_add", "label": "Prepaid & Add" },
              { "value": "will_call", "label": "Will Call" },
              { "value": "our_truck", "label": "Our Truck" }
            ]},
            { "id": "ship_via", "type": "dropdown", "label": "Ship Via", "options_source": "carriers" }
          ]
        }
      ]
    },
    "primary_actions": [
      { "id": "continue_to_review", "label": "Review Order", "color": "primary" }
    ],
    "secondary_actions": [
      { "id": "recalculate_pricing", "label": "Recalculate", "icon": "refresh" },
      { "id": "apply_contract_pricing", "label": "Apply Contract", "icon": "description" },
      { "id": "back", "label": "Back" }
    ]
  },
  {
    "id": "order_review_screen",
    "label": "Review & Submit",
    "app": "order_intake_app",
    "workflow_step": "confirm_and_submit",
    "layout": "review_summary",
    "sections": [
      {
        "id": "customer_summary",
        "label": "Customer",
        "type": "info_card",
        "fields": ["company_name", "ship_to_address", "contact_name", "contact_phone"],
        "edit_action": "jump_to_step:select_customer"
      },
      {
        "id": "job_summary",
        "label": "Job Details",
        "type": "info_card",
        "fields": ["job_type", "priority", "requested_date", "customer_po"],
        "edit_action": "jump_to_step:define_job"
      },
      {
        "id": "line_items_summary",
        "label": "Line Items",
        "type": "table",
        "columns": ["line", "description", "processing", "quantity", "price", "total"],
        "edit_action": "jump_to_step:select_material"
      },
      {
        "id": "totals_summary",
        "label": "Order Totals",
        "type": "summary_list",
        "items": ["subtotal", "processing", "discount", "freight", "tax", "total"]
      },
      {
        "id": "terms_summary",
        "label": "Terms",
        "type": "info_card",
        "fields": ["payment_terms", "freight_terms", "ship_via", "special_instructions"],
        "edit_action": "jump_to_step:price_and_terms"
      }
    ],
    "validation_summary": {
      "show_warnings": true,
      "show_info": true,
      "blocking_errors_prevent_submit": true
    },
    "primary_actions": [
      { "id": "submit_order", "label": "Submit Order", "color": "success", "size": "large", "confirm": true },
      { "id": "submit_as_quote", "label": "Save as Quote", "color": "secondary" }
    ],
    "secondary_actions": [
      { "id": "save_draft", "label": "Save Draft" },
      { "id": "print_preview", "label": "Print Preview", "icon": "print" },
      { "id": "email_preview", "label": "Email Preview", "icon": "email" },
      { "id": "back", "label": "Back" }
    ]
  },
  {
    "id": "pos_main_screen",
    "label": "Point of Sale",
    "app": "retail_pos_app",
    "workflow_step": "scan_or_search_item",
    "layout": "pos_layout",
    "left_panel": {
      "id": "product_entry",
      "sections": [
        {
          "id": "scan_area",
          "type": "barcode_input",
          "placeholder": "Scan barcode or enter product code",
          "autofocus": true,
          "size": "large"
        },
        {
          "id": "quick_categories",
          "type": "chip_grid",
          "options_source": "retail_quick_categories",
          "columns": 4
        },
        {
          "id": "product_search",
          "type": "search_with_results",
          "placeholder": "Search products...",
          "result_limit": 8
        },
        {
          "id": "recent_items",
          "type": "horizontal_scroll_list",
          "label": "Recent",
          "data_source": "session.recent_items"
        }
      ]
    },
    "right_panel": {
      "id": "cart_panel",
      "sections": [
        {
          "id": "cart_header",
          "type": "header",
          "fields": [
            { "id": "customer_name", "type": "display", "default": "Walk-In Customer" },
            { "id": "change_customer", "type": "link_button", "label": "Change" }
          ]
        },
        {
          "id": "cart_items",
          "type": "cart_list",
          "item_fields": [
            { "field": "description", "width": "flex" },
            { "field": "quantity", "width": 60, "editable": true },
            { "field": "unit_price", "width": 80, "format": "currency" },
            { "field": "line_total", "width": 80, "format": "currency" }
          ],
          "item_actions": [
            { "id": "edit_qty", "icon": "edit" },
            { "id": "remove", "icon": "delete" }
          ],
          "swipe_to_delete": true
        },
        {
          "id": "cart_totals",
          "type": "summary_list",
          "items": [
            { "label": "Subtotal", "binding": "cart.subtotal" },
            { "label": "Tax", "binding": "cart.tax" },
            { "label": "Total", "binding": "cart.total", "size": "large", "bold": true }
          ]
        }
      ]
    },
    "bottom_actions": {
      "type": "action_bar",
      "actions": [
        { "id": "clear_cart", "label": "Clear", "icon": "delete_sweep", "color": "error", "confirm": true },
        { "id": "hold_sale", "label": "Hold", "icon": "pause", "color": "warning" },
        { "id": "discount", "label": "Discount", "icon": "local_offer", "color": "secondary" },
        { "id": "cut_to_size", "label": "Cut", "icon": "content_cut", "color": "info" },
        { "id": "pay", "label": "Pay", "icon": "payment", "color": "success", "size": "large" }
      ]
    },
    "keyboard_shortcuts": [
      { "key": "F1", "action": "help" },
      { "key": "F2", "action": "hold_sale" },
      { "key": "F3", "action": "discount" },
      { "key": "F4", "action": "cut_to_size" },
      { "key": "F12", "action": "pay" },
      { "key": "Escape", "action": "clear_last" }
    ]
  },
  {
    "id": "cut_to_size_modal",
    "label": "Cut to Size",
    "app": "retail_pos_app",
    "workflow_step": "cut_to_size",
    "layout": "modal",
    "context_display": {
      "fields": ["product_description", "available_length", "price_per_unit"]
    },
    "fields": [
      { "id": "cut_type", "type": "chip_select", "label": "Cut Type", "options": [
        { "value": "single_cut", "label": "Single Cut" },
        { "value": "multiple_cuts", "label": "Multiple Cuts" },
        { "value": "custom", "label": "Custom Lengths" }
      ]},
      { "id": "cut_length", "type": "dimension_input", "label": "Length", "unit": "in", "size": "large" },
      { "id": "cut_quantity", "type": "numeric_stepper", "label": "Quantity", "min": 1, "default": 1, "size": "large" },
      { "id": "cutting_charge", "type": "display", "label": "Cutting Charge", "binding": "calculated.cutting_charge", "format": "currency" },
      { "id": "waste_estimate", "type": "display", "label": "Est. Waste", "binding": "calculated.waste" }
    ],
    "primary_actions": [
      { "id": "add_cut", "label": "Add to Cart", "color": "primary" }
    ],
    "secondary_actions": [
      { "id": "cancel", "label": "Cancel" }
    ]
  },
  {
    "id": "payment_screen",
    "label": "Payment",
    "app": "retail_pos_app",
    "workflow_step": "take_payment",
    "layout": "payment_layout",
    "total_display": {
      "field": "cart.total",
      "format": "currency",
      "size": "extra_large"
    },
    "payment_methods": {
      "type": "payment_method_grid",
      "options": [
        { "id": "cash", "label": "Cash", "icon": "payments", "color": "success" },
        { "id": "credit", "label": "Credit Card", "icon": "credit_card", "color": "primary" },
        { "id": "debit", "label": "Debit Card", "icon": "credit_card", "color": "primary" },
        { "id": "check", "label": "Check", "icon": "receipt", "color": "secondary" },
        { "id": "account", "label": "On Account", "icon": "account_balance", "color": "info", "requires": "customer_selected" },
        { "id": "split", "label": "Split Payment", "icon": "call_split", "color": "warning" }
      ]
    },
    "cash_payment_panel": {
      "visible_when": "payment_method == 'cash'",
      "fields": [
        { "id": "amount_tendered", "type": "currency_input", "label": "Amount Tendered", "size": "large" },
        { "id": "change_due", "type": "display", "label": "Change Due", "binding": "calculated.change", "format": "currency", "size": "large", "highlight": true }
      ],
      "quick_amounts": {
        "type": "button_grid",
        "options_source": "calculated.quick_cash_amounts",
        "columns": 4
      }
    },
    "card_payment_panel": {
      "visible_when": "payment_method IN ['credit', 'debit']",
      "fields": [
        { "id": "terminal_status", "type": "status_display", "binding": "payment_terminal.status" },
        { "id": "instructions", "type": "display", "value": "Insert, tap, or swipe card" }
      ]
    },
    "primary_actions": [
      { "id": "process_payment", "label": "Complete Sale", "color": "success", "size": "large" }
    ],
    "secondary_actions": [
      { "id": "back_to_cart", "label": "Back", "icon": "arrow_back" },
      { "id": "void_sale", "label": "Void Sale", "color": "error", "requires_permission": "pos.void" }
    ]
  },
  {
    "id": "sale_complete_screen",
    "label": "Sale Complete",
    "app": "retail_pos_app",
    "workflow_step": "print_docs",
    "layout": "confirmation",
    "success_message": {
      "icon": "check_circle",
      "title": "Sale Complete",
      "subtitle_binding": "transaction.id"
    },
    "receipt_options": {
      "type": "button_group",
      "options": [
        { "id": "print_receipt", "label": "Print Receipt", "icon": "print", "default": true },
        { "id": "email_receipt", "label": "Email Receipt", "icon": "email" },
        { "id": "no_receipt", "label": "No Receipt", "icon": "close" }
      ]
    },
    "change_display": {
      "visible_when": "payment_method == 'cash' AND change_due > 0",
      "label": "Change Due",
      "binding": "transaction.change_due",
      "format": "currency",
      "size": "extra_large"
    },
    "primary_actions": [
      { "id": "new_sale", "label": "New Sale", "color": "primary", "size": "large", "auto_focus": true }
    ],
    "secondary_actions": [
      { "id": "view_receipt", "label": "View Receipt", "icon": "receipt" },
      { "id": "reprint", "label": "Reprint", "icon": "print" }
    ],
    "auto_advance": {
      "enabled": true,
      "delay_seconds": 10,
      "action": "new_sale"
    }
  },
  {
    "id": "will_call_lookup_screen",
    "label": "Will-Call Pickup",
    "app": "retail_pos_app",
    "workflow_step": "lookup_order",
    "layout": "search_and_detail",
    "search_panel": {
      "fields": [
        { "id": "search_query", "type": "search_input", "placeholder": "Order #, customer name, or phone", "size": "large" }
      ],
      "results_list": {
        "columns": [
          { "field": "order_number", "label": "Order #" },
          { "field": "customer_name", "label": "Customer" },
          { "field": "ready_date", "label": "Ready Since", "format": "relative_date" },
          { "field": "item_count", "label": "Items" },
          { "field": "balance_due", "label": "Balance", "format": "currency" }
        ]
      }
    },
    "detail_panel": {
      "visible_when": "selected_order",
      "sections": [
        {
          "id": "order_info",
          "type": "info_card",
          "fields": ["order_number", "order_date", "customer_name", "contact_phone"]
        },
        {
          "id": "items",
          "type": "list",
          "data_binding": "selected_order.items"
        },
        {
          "id": "balance",
          "type": "summary",
          "fields": ["order_total", "amount_paid", "balance_due"]
        }
      ]
    },
    "primary_actions": [
      { "id": "release_order", "label": "Release Order", "color": "success", "visible_when": "balance_due == 0" },
      { "id": "collect_and_release", "label": "Collect & Release", "color": "primary", "visible_when": "balance_due > 0" }
    ]
  }
]
```

---

## 3. data_capture_schemas

### customer_selection_schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "CustomerSelection",
  "required": ["customer_id"],
  "properties": {
    "customer_id": {
      "type": "string",
      "description": "Selected customer account ID"
    },
    "customer_name": {
      "type": "string",
      "description": "Company or individual name"
    },
    "account_number": {
      "type": "string",
      "pattern": "^[A-Z0-9]{6,10}$"
    },
    "customer_type": {
      "type": "string",
      "enum": ["commercial", "retail", "government", "internal", "cash"]
    },
    "pricing_tier": {
      "type": "string",
      "enum": ["list", "tier1", "tier2", "tier3", "contract", "cost_plus"]
    },
    "credit_status": {
      "type": "object",
      "properties": {
        "status": { "type": "string", "enum": ["good", "warning", "hold", "cod"] },
        "credit_limit": { "type": "number" },
        "available_credit": { "type": "number" },
        "past_due_amount": { "type": "number" },
        "days_past_due": { "type": "integer" }
      }
    },
    "payment_terms": {
      "type": "string",
      "enum": ["NET10", "NET15", "NET30", "NET45", "NET60", "COD", "CIA", "CC"]
    },
    "tax_exempt": {
      "type": "boolean",
      "default": false
    },
    "tax_exempt_number": {
      "type": "string",
      "description": "Tax exemption certificate number"
    },
    "ship_to_id": {
      "type": "string",
      "description": "Selected ship-to address ID"
    },
    "ship_to_address": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "address1": { "type": "string" },
        "address2": { "type": "string" },
        "city": { "type": "string" },
        "state": { "type": "string" },
        "zip": { "type": "string" },
        "country": { "type": "string", "default": "US" },
        "is_residential": { "type": "boolean", "default": false }
      }
    },
    "contact_id": {
      "type": "string"
    },
    "contact": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "phone": { "type": "string" },
        "email": { "type": "string", "format": "email" }
      }
    },
    "sales_rep_id": {
      "type": "string"
    },
    "special_pricing_rules": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "rule_id": { "type": "string" },
          "product_filter": { "type": "string" },
          "discount_type": { "type": "string" },
          "discount_value": { "type": "number" }
        }
      }
    }
  }
}
```

### material_selection_schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "MaterialSelection",
  "required": ["product_id", "quantity", "uom"],
  "properties": {
    "line_number": {
      "type": "integer",
      "minimum": 1
    },
    "product_id": {
      "type": "string",
      "description": "Product/SKU identifier"
    },
    "product_code": {
      "type": "string",
      "description": "Human-readable product code"
    },
    "description": {
      "type": "string",
      "maxLength": 500
    },
    "division": {
      "type": "string",
      "enum": ["metals", "plastics"]
    },
    "category": {
      "type": "string",
      "description": "Product category path"
    },
    "grade": {
      "type": "string",
      "description": "Material grade (e.g., A36, 304, HDPE)"
    },
    "form": {
      "type": "string",
      "enum": ["coil", "sheet", "plate", "bar", "tube", "pipe", "structural", "rod", "film", "block"]
    },
    "dimensions": {
      "type": "object",
      "properties": {
        "thickness": { "type": "number", "description": "Thickness in inches" },
        "width": { "type": "number", "description": "Width in inches" },
        "length": { "type": "number", "description": "Length in inches or feet" },
        "od": { "type": "number", "description": "Outside diameter" },
        "id": { "type": "number", "description": "Inside diameter" },
        "wall": { "type": "number", "description": "Wall thickness" }
      }
    },
    "quantity": {
      "type": "number",
      "minimum": 0.001
    },
    "uom": {
      "type": "string",
      "enum": ["EA", "LB", "KG", "FT", "IN", "M", "SQFT", "SQM", "CWT", "TON"]
    },
    "weight_per_unit": {
      "type": "number",
      "description": "Weight per UOM for weight-based pricing"
    },
    "source": {
      "type": "string",
      "enum": ["stock", "purchase", "transfer", "consignment"],
      "default": "stock"
    },
    "source_location_id": {
      "type": "string",
      "description": "Location to source from"
    },
    "specific_inventory_id": {
      "type": "string",
      "description": "Specific lot/coil/heat to allocate"
    },
    "heat_number": {
      "type": "string",
      "description": "Required heat number if specified"
    },
    "certification_required": {
      "type": "array",
      "items": { "type": "string", "enum": ["MTR", "COA", "COC", "DFARS", "domestic_melt"] }
    },
    "line_notes": {
      "type": "string",
      "maxLength": 1000
    }
  }
}
```

### processing_instructions_schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "ProcessingInstructions",
  "required": ["processing_type"],
  "properties": {
    "line_number": {
      "type": "integer"
    },
    "processing_type": {
      "type": "string",
      "enum": [
        "slitting",
        "cut_to_length",
        "shearing",
        "blanking",
        "laser_cutting",
        "plasma_cutting",
        "waterjet_cutting",
        "sawing",
        "bending",
        "rolling",
        "leveling",
        "polishing",
        "deburring",
        "drilling",
        "tapping",
        "routing",
        "thermoforming",
        "machining"
      ]
    },
    "division": {
      "type": "string",
      "enum": ["metals", "plastics"]
    },
    "target_dimensions": {
      "type": "object",
      "properties": {
        "width": {
          "type": "object",
          "properties": {
            "value": { "type": "number" },
            "unit": { "type": "string", "default": "in" },
            "tolerance_plus": { "type": "number" },
            "tolerance_minus": { "type": "number" }
          }
        },
        "length": {
          "type": "object",
          "properties": {
            "value": { "type": "number" },
            "unit": { "type": "string", "default": "in" },
            "tolerance_plus": { "type": "number" },
            "tolerance_minus": { "type": "number" }
          }
        },
        "pieces": {
          "type": "integer",
          "minimum": 1
        },
        "angle": {
          "type": "number",
          "description": "For bending operations"
        },
        "radius": {
          "type": "number",
          "description": "For rolling or bending"
        }
      }
    },
    "tolerance_class": {
      "type": "string",
      "enum": ["standard", "tight", "precision", "custom"],
      "default": "standard"
    },
    "edge_condition": {
      "type": "string",
      "enum": ["mill", "deburred", "slit", "sheared", "ground", "polished"]
    },
    "surface_finish": {
      "type": "string",
      "enum": ["as_is", "2B", "2D", "#4", "#8", "mill", "polished"]
    },
    "options": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "paper_interleave",
          "plastic_wrap",
          "coil_vs_flat",
          "bundle",
          "skid",
          "heat_treat",
          "anneal",
          "stress_relieve",
          "prime_paint",
          "galvanize"
        ]
      }
    },
    "special_instructions": {
      "type": "string",
      "maxLength": 2000
    },
    "customer_drawing_url": {
      "type": "string",
      "format": "uri"
    },
    "quote_reference": {
      "type": "string",
      "description": "Reference to existing quote with approved pricing"
    }
  }
}
```

### pricing_inputs_schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "PricingInputs",
  "required": ["lines"],
  "properties": {
    "order_id": {
      "type": "string"
    },
    "pricing_date": {
      "type": "string",
      "format": "date"
    },
    "customer_id": {
      "type": "string"
    },
    "pricing_tier": {
      "type": "string"
    },
    "lines": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["line_number", "product_id", "quantity", "unit_price"],
        "properties": {
          "line_number": { "type": "integer" },
          "product_id": { "type": "string" },
          "quantity": { "type": "number" },
          "uom": { "type": "string" },
          "base_price": {
            "type": "number",
            "description": "List price before adjustments"
          },
          "unit_price": {
            "type": "number",
            "description": "Final unit price after adjustments"
          },
          "price_source": {
            "type": "string",
            "enum": ["list", "tier", "contract", "quote", "override", "cost_plus"]
          },
          "processing_charges": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "charge_type": { "type": "string" },
                "description": { "type": "string" },
                "amount": { "type": "number" },
                "per_unit": { "type": "boolean" }
              }
            }
          },
          "line_discount": {
            "type": "object",
            "properties": {
              "type": { "type": "string", "enum": ["percent", "amount", "price_override"] },
              "value": { "type": "number" },
              "reason": { "type": "string" },
              "approved_by": { "type": "string" }
            }
          },
          "extended_price": {
            "type": "number",
            "description": "quantity * unit_price"
          },
          "total_with_processing": {
            "type": "number"
          }
        }
      }
    },
    "order_discount": {
      "type": "object",
      "properties": {
        "type": { "type": "string", "enum": ["percent", "amount"] },
        "value": { "type": "number" },
        "reason": { "type": "string" },
        "requires_approval": { "type": "boolean" },
        "approved_by": { "type": "string" }
      }
    },
    "freight": {
      "type": "object",
      "properties": {
        "terms": { "type": "string", "enum": ["prepaid", "collect", "prepaid_add", "will_call", "our_truck"] },
        "carrier": { "type": "string" },
        "service": { "type": "string" },
        "estimated_cost": { "type": "number" },
        "charge_to_customer": { "type": "number" }
      }
    },
    "tax": {
      "type": "object",
      "properties": {
        "exempt": { "type": "boolean" },
        "exempt_number": { "type": "string" },
        "tax_rate": { "type": "number" },
        "taxable_amount": { "type": "number" },
        "tax_amount": { "type": "number" }
      }
    },
    "totals": {
      "type": "object",
      "properties": {
        "subtotal": { "type": "number" },
        "processing_total": { "type": "number" },
        "discount_total": { "type": "number" },
        "freight_charge": { "type": "number" },
        "tax_amount": { "type": "number" },
        "grand_total": { "type": "number" }
      }
    },
    "payment_terms": {
      "type": "string"
    },
    "margin_analysis": {
      "type": "object",
      "description": "Internal only - not shown to customer",
      "properties": {
        "total_cost": { "type": "number" },
        "gross_margin": { "type": "number" },
        "margin_percent": { "type": "number" },
        "below_minimum_margin": { "type": "boolean" }
      }
    }
  }
}
```

---

## 4. division_logic

| Condition | Division | Allowed Materials | Allowed Processes | Notes |
|-----------|----------|-------------------|-------------------|-------|
| grade IN steel_grades | metals | carbon_steel, alloy_steel, tool_steel | slitting, shearing, cut_to_length, plasma, laser, sawing, bending, leveling | Standard steel processing |
| grade IN stainless_grades | metals | stainless_steel | slitting, shearing, cut_to_length, laser, waterjet, bending, polishing | Avoid plasma (oxidation) |
| grade IN aluminum_grades | metals | aluminum | slitting, shearing, cut_to_length, laser, waterjet, sawing, bending | Lower laser power, special coolant |
| grade IN copper_grades | metals | copper, brass, bronze | shearing, sawing, waterjet | No plasma, no laser for reflective |
| grade IN titanium_grades | metals | titanium | waterjet, sawing, drilling | Specialized tooling required |
| grade IN acrylic_grades | plastics | acrylic, PMMA | routing, laser_cutting, polishing, thermoforming | Laser OK, no plasma |
| grade IN hdpe_grades | plastics | HDPE, LDPE | routing, sawing, drilling, welding | No thermoforming |
| grade IN abs_grades | plastics | ABS | routing, thermoforming, drilling | Standard plastic processing |
| grade IN polycarbonate_grades | plastics | polycarbonate, Lexan | routing, drilling, bending, thermoforming | Heat bending possible |
| grade IN pvc_grades | plastics | PVC | routing, sawing, welding | No laser (toxic fumes) |
| grade IN nylon_grades | plastics | nylon, Delrin, UHMW | routing, sawing, machining | CNC machining capable |
| grade IN fiberglass_grades | plastics | fiberglass, FRP | routing, sawing, drilling | Dust extraction required |
| form == coil AND division == metals | metals | coil_stock | slitting, cut_to_length, leveling, blanking | Coil-specific operations |
| form == sheet AND division == metals | metals | sheet_stock | shearing, laser, plasma, waterjet, bending | Flat stock operations |
| form == plate AND thickness > 0.5 | metals | plate_stock | plasma, waterjet, sawing, drilling | Heavy plate operations |
| form == bar OR form == structural | metals | bar_stock, structural | sawing, drilling, miter_cutting | Long product operations |
| form == tube OR form == pipe | metals | tube_stock, pipe | sawing, laser_tube, bending, notching | Tube-specific operations |
| form == sheet AND division == plastics | plastics | plastic_sheet | routing, laser, thermoforming | Plastic sheet operations |
| form == rod AND division == plastics | plastics | plastic_rod | sawing, machining, turning | Rod/bar plastic operations |
| customer.contract_restrictions | * | contract_specific | contract_specific | Customer contract may limit options |
| work_center.capabilities | * | work_center_specific | work_center_specific | Available equipment determines options |

### Grade Lists Reference

```json
{
  "steel_grades": ["A36", "A572-50", "A514", "1018", "1045", "4140", "4340", "A2", "D2", "O1", "S7"],
  "stainless_grades": ["304", "304L", "316", "316L", "410", "430", "17-4PH", "303", "321"],
  "aluminum_grades": ["3003", "5052", "6061", "6063", "7075", "2024", "5083"],
  "copper_grades": ["C110", "C260", "C360", "C932"],
  "titanium_grades": ["Grade2", "Grade5", "6Al-4V"],
  "acrylic_grades": ["PMMA-Clear", "PMMA-Cast", "PMMA-Extruded"],
  "hdpe_grades": ["HDPE-Natural", "HDPE-Black", "LDPE"],
  "abs_grades": ["ABS-Natural", "ABS-Black", "ABS-FR"],
  "polycarbonate_grades": ["PC-Clear", "PC-Gray", "Lexan", "Makrolon"],
  "pvc_grades": ["PVC-Type1", "PVC-Type2", "CPVC"],
  "nylon_grades": ["Nylon6", "Nylon66", "Delrin", "UHMW", "Acetal"],
  "fiberglass_grades": ["FRP-Polyester", "FRP-Vinyl", "G10", "FR4"]
}
```

---

## 5. validation_rules

```json
[
  {
    "field": "customer_id",
    "rule": "required",
    "error_message": "Customer is required"
  },
  {
    "field": "customer_id",
    "rule": "exists_in:customers",
    "error_message": "Selected customer not found"
  },
  {
    "field": "customer.credit_status",
    "rule": "not_equals:hold",
    "error_message": "Customer is on credit hold. Manager approval required.",
    "severity": "warning",
    "allow_override": true,
    "override_role": "BRANCH_MANAGER"
  },
  {
    "field": "customer.available_credit",
    "rule": "gte:order.grand_total",
    "error_message": "Order exceeds available credit ({available} available, {total} required)",
    "severity": "warning",
    "allow_override": true,
    "override_role": "BRANCH_MANAGER"
  },
  {
    "field": "ship_to_id",
    "rule": "required_if:freight_terms,not_in:will_call",
    "error_message": "Ship-to address required for delivery orders"
  },
  {
    "field": "requested_date",
    "rule": "required",
    "error_message": "Requested date is required"
  },
  {
    "field": "requested_date",
    "rule": "date:gte:today",
    "error_message": "Requested date cannot be in the past"
  },
  {
    "field": "requested_date",
    "rule": "date:lte:today+365",
    "error_message": "Requested date cannot be more than 1 year out"
  },
  {
    "field": "lines",
    "rule": "min_length:1",
    "error_message": "Order must have at least one line item"
  },
  {
    "field": "lines.*.product_id",
    "rule": "required",
    "error_message": "Product is required for line {index}"
  },
  {
    "field": "lines.*.quantity",
    "rule": "required|numeric|gt:0",
    "error_message": "Valid quantity required for line {index}"
  },
  {
    "field": "lines.*.quantity",
    "rule": "lte:lines.*.available_qty",
    "error_message": "Quantity exceeds available stock for line {index}",
    "severity": "warning",
    "allow_override": true
  },
  {
    "field": "lines.*.quantity",
    "rule": "gte:product.min_order_qty",
    "error_message": "Quantity below minimum order quantity ({min}) for line {index}"
  },
  {
    "field": "lines.*.unit_price",
    "rule": "required|numeric|gte:0",
    "error_message": "Valid unit price required for line {index}"
  },
  {
    "field": "lines.*.unit_price",
    "rule": "gte:lines.*.floor_price",
    "error_message": "Price below floor for line {index}. Approval required.",
    "severity": "error",
    "allow_override": true,
    "override_role": "DIVISION_MANAGER"
  },
  {
    "field": "lines.*.margin_percent",
    "rule": "gte:10",
    "error_message": "Margin below 10% for line {index}. Review pricing.",
    "severity": "warning",
    "allow_override": true,
    "override_role": "BRANCH_MANAGER"
  },
  {
    "field": "processing.target_dimensions.width.value",
    "rule": "required_if:processing_type,in:slitting,shearing",
    "error_message": "Target width required for {processing_type}"
  },
  {
    "field": "processing.target_dimensions.width.value",
    "rule": "lt:source_material.width",
    "error_message": "Target width cannot exceed source width"
  },
  {
    "field": "processing.target_dimensions.length.value",
    "rule": "required_if:processing_type,in:cut_to_length,shearing",
    "error_message": "Target length required for {processing_type}"
  },
  {
    "field": "processing.tolerance_class",
    "rule": "in:standard,tight,precision,custom",
    "error_message": "Invalid tolerance class"
  },
  {
    "field": "order_discount.value",
    "rule": "lte:10",
    "error_message": "Discount exceeds 10%. Manager approval required.",
    "severity": "warning",
    "allow_override": true,
    "override_role": "BRANCH_MANAGER",
    "applies_when": "order_discount.type == 'percent'"
  },
  {
    "field": "order_discount.value",
    "rule": "lte:20",
    "error_message": "Discount exceeds 20%. Division approval required.",
    "severity": "error",
    "allow_override": true,
    "override_role": "DIVISION_MANAGER",
    "applies_when": "order_discount.type == 'percent'"
  },
  {
    "field": "order_discount.reason",
    "rule": "required_if:order_discount.value,gt:0",
    "error_message": "Discount reason is required"
  },
  {
    "field": "freight.terms",
    "rule": "required",
    "error_message": "Freight terms are required"
  },
  {
    "field": "payment_terms",
    "rule": "required",
    "error_message": "Payment terms are required"
  },
  {
    "field": "customer_po",
    "rule": "required_if:customer.po_required,true",
    "error_message": "Customer PO is required for this customer"
  },
  {
    "field": "customer_po",
    "rule": "unique:orders.customer_po,where:customer_id",
    "error_message": "PO number {value} already used for this customer",
    "severity": "warning"
  },
  {
    "field": "tax_exempt",
    "rule": "requires:tax_exempt_number",
    "error_message": "Tax exempt certificate number required",
    "applies_when": "tax_exempt == true"
  },
  {
    "field": "processing.processing_type",
    "rule": "in_allowed_for_division",
    "error_message": "{processing_type} not available for {division} division"
  },
  {
    "field": "lines.*.heat_number",
    "rule": "required_if:certification_required,contains:MTR",
    "error_message": "Heat number required when MTR certification is required"
  },
  {
    "field": "pos.amount_tendered",
    "rule": "gte:cart.total",
    "error_message": "Amount tendered must cover total",
    "applies_when": "payment_method == 'cash'"
  },
  {
    "field": "pos.return_quantity",
    "rule": "lte:original_quantity",
    "error_message": "Return quantity cannot exceed original purchase"
  },
  {
    "field": "will_call.signature",
    "rule": "required",
    "error_message": "Customer signature required for will-call release"
  }
]
```

---

## 6. Shared Order Object Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "UnifiedOrderObject",
  "description": "Shared order structure used by both CSR and POS flows",
  "required": ["order_type", "customer", "lines", "totals"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "order_number": { "type": "string" },
    "order_type": {
      "type": "string",
      "enum": ["sales_order", "pos_transaction", "quote", "will_call_release"]
    },
    "source_app": {
      "type": "string",
      "enum": ["order_intake_app", "retail_pos_app", "customer_portal_app"]
    },
    "status": {
      "type": "string",
      "enum": ["draft", "pending", "confirmed", "processing", "ready", "shipped", "completed", "cancelled"]
    },
    "customer": { "$ref": "#/definitions/customer_selection" },
    "job_details": {
      "type": "object",
      "properties": {
        "job_type": { "type": "string" },
        "division": { "type": "string" },
        "priority": { "type": "string" },
        "customer_po": { "type": "string" },
        "requested_date": { "type": "string", "format": "date" },
        "promised_date": { "type": "string", "format": "date" },
        "special_instructions": { "type": "string" }
      }
    },
    "lines": {
      "type": "array",
      "items": { "$ref": "#/definitions/order_line" }
    },
    "totals": { "$ref": "#/definitions/order_totals" },
    "payments": {
      "type": "array",
      "items": { "$ref": "#/definitions/payment" }
    },
    "shipping": { "$ref": "#/definitions/shipping_info" },
    "metadata": {
      "type": "object",
      "properties": {
        "created_at": { "type": "string", "format": "date-time" },
        "created_by": { "type": "string" },
        "modified_at": { "type": "string", "format": "date-time" },
        "modified_by": { "type": "string" },
        "location_id": { "type": "string" },
        "terminal_id": { "type": "string" }
      }
    }
  },
  "definitions": {
    "customer_selection": { "$ref": "#customer_selection_schema" },
    "order_line": {
      "type": "object",
      "properties": {
        "line_number": { "type": "integer" },
        "material": { "$ref": "#material_selection_schema" },
        "processing": { "$ref": "#processing_instructions_schema" },
        "pricing": {
          "type": "object",
          "properties": {
            "unit_price": { "type": "number" },
            "extended_price": { "type": "number" },
            "processing_charges": { "type": "number" },
            "line_total": { "type": "number" }
          }
        },
        "status": { "type": "string" }
      }
    },
    "order_totals": {
      "type": "object",
      "properties": {
        "subtotal": { "type": "number" },
        "processing_total": { "type": "number" },
        "discount_total": { "type": "number" },
        "freight_charge": { "type": "number" },
        "tax_amount": { "type": "number" },
        "grand_total": { "type": "number" }
      }
    },
    "payment": {
      "type": "object",
      "properties": {
        "method": { "type": "string" },
        "amount": { "type": "number" },
        "reference": { "type": "string" },
        "timestamp": { "type": "string", "format": "date-time" }
      }
    },
    "shipping_info": {
      "type": "object",
      "properties": {
        "freight_terms": { "type": "string" },
        "carrier": { "type": "string" },
        "ship_to": { "type": "object" }
      }
    }
  }
}
```

---

*Document generated for Build Phase: Order Intake & POS Workflows*
