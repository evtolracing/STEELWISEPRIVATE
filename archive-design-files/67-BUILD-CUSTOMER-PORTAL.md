# 67 — Build Customer Portal & E-Commerce Integration

> **Purpose:** Customer-facing portal UI, status visibility, document access, and e-commerce integration surfaces.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. portal_flows

```json
{
  "login_and_auth": {
    "id": "auth_flow",
    "entry_point": "/portal/login",
    "steps": [
      {
        "step": 1,
        "id": "login",
        "screen": "login_screen",
        "inputs": ["email", "password"],
        "actions": ["login", "forgot_password", "request_access"],
        "next_on_success": "dashboard"
      },
      {
        "step": 2,
        "id": "forgot_password",
        "screen": "forgot_password_screen",
        "inputs": ["email"],
        "actions": ["send_reset_link", "back_to_login"],
        "next_on_success": "reset_sent_confirmation"
      },
      {
        "step": 3,
        "id": "reset_password",
        "screen": "reset_password_screen",
        "inputs": ["new_password", "confirm_password"],
        "validation": ["password_strength", "passwords_match"],
        "next_on_success": "login"
      },
      {
        "step": 4,
        "id": "request_access",
        "screen": "request_access_screen",
        "inputs": ["company_name", "contact_name", "email", "phone", "account_number_optional"],
        "actions": ["submit_request"],
        "next_on_success": "request_submitted_confirmation"
      },
      {
        "step": 5,
        "id": "mfa_challenge",
        "screen": "mfa_screen",
        "condition": "tenant.mfa_required OR user.mfa_enabled",
        "inputs": ["otp_code"],
        "actions": ["verify", "resend_code"],
        "next_on_success": "dashboard"
      }
    ],
    "session_management": {
      "timeout_minutes": 30,
      "refresh_token": true,
      "remember_me_days": 30
    }
  },
  "view_orders": {
    "id": "orders_list_flow",
    "entry_point": "/portal/orders",
    "steps": [
      {
        "step": 1,
        "id": "orders_list",
        "screen": "orders_list_screen",
        "data_source": "customer.orders",
        "filters": ["status", "date_range", "search"],
        "sort_options": ["order_date", "status", "total"],
        "pagination": { "page_size": 20, "infinite_scroll": false },
        "actions": ["view_detail", "reorder", "download_invoice"]
      }
    ],
    "default_filter": "status != 'cancelled' AND order_date >= 12_months_ago"
  },
  "view_order_detail": {
    "id": "order_detail_flow",
    "entry_point": "/portal/orders/{order_id}",
    "steps": [
      {
        "step": 1,
        "id": "order_detail",
        "screen": "order_detail_screen",
        "data_source": "order",
        "sections": ["header", "line_items", "status_timeline", "shipments", "documents", "actions"],
        "actions": ["reorder", "download_documents", "contact_support", "track_shipment"]
      },
      {
        "step": 2,
        "id": "shipment_tracking",
        "screen": "shipment_tracking_modal",
        "trigger": "track_shipment_action",
        "data_source": "shipment.tracking",
        "external_link": "carrier_tracking_url"
      }
    ]
  },
  "download_documents": {
    "id": "documents_flow",
    "entry_point": "/portal/documents",
    "steps": [
      {
        "step": 1,
        "id": "documents_list",
        "screen": "documents_list_screen",
        "data_source": "customer.documents",
        "filters": ["document_type", "date_range", "order_number"],
        "sort_options": ["date", "type", "order_number"],
        "actions": ["download", "view", "email"]
      },
      {
        "step": 2,
        "id": "document_viewer",
        "screen": "document_viewer_modal",
        "trigger": "view_action",
        "formats_supported": ["pdf"],
        "actions": ["download", "print", "email"]
      }
    ],
    "document_retention_days": 730
  },
  "request_quote": {
    "id": "quote_request_flow",
    "entry_point": "/portal/quotes/new",
    "steps": [
      {
        "step": 1,
        "id": "quote_type_selection",
        "screen": "quote_type_screen",
        "options": [
          { "id": "stock_items", "label": "Stock Items", "icon": "inventory" },
          { "id": "custom_processing", "label": "Custom Processing", "icon": "precision_manufacturing" },
          { "id": "bulk_order", "label": "Bulk Order", "icon": "warehouse" }
        ],
        "next": "quote_builder"
      },
      {
        "step": 2,
        "id": "quote_builder",
        "screen": "quote_builder_screen",
        "sections": ["product_search", "cart", "processing_options", "delivery_preferences"],
        "actions": ["add_item", "remove_item", "update_quantity", "submit_quote"]
      },
      {
        "step": 3,
        "id": "quote_review",
        "screen": "quote_review_screen",
        "sections": ["line_summary", "contact_info", "notes"],
        "inputs": ["special_instructions", "requested_by_date"],
        "actions": ["edit", "submit", "save_draft"]
      },
      {
        "step": 4,
        "id": "quote_confirmation",
        "screen": "quote_confirmation_screen",
        "displays": ["quote_reference", "expected_response_time", "csr_contact"],
        "actions": ["view_quote", "return_to_dashboard"]
      }
    ],
    "draft_save": {
      "auto_save_interval_sec": 30,
      "max_drafts": 5
    }
  },
  "reorder": {
    "id": "reorder_flow",
    "entry_point": "/portal/orders/{order_id}/reorder",
    "steps": [
      {
        "step": 1,
        "id": "reorder_review",
        "screen": "reorder_review_screen",
        "data_source": "original_order",
        "sections": ["line_items_editable", "quantity_adjustments", "delivery_options"],
        "validations": ["product_availability", "price_changes"],
        "warnings": ["price_changed", "item_discontinued", "out_of_stock"]
      },
      {
        "step": 2,
        "id": "reorder_checkout",
        "screen": "reorder_checkout_screen",
        "sections": ["order_summary", "shipping_address", "po_number", "payment_terms"],
        "inputs": ["po_number", "shipping_address_id", "special_instructions"],
        "actions": ["place_order", "request_quote_instead"]
      },
      {
        "step": 3,
        "id": "reorder_confirmation",
        "screen": "order_confirmation_screen",
        "displays": ["order_number", "estimated_ship_date", "order_total"],
        "actions": ["view_order", "return_to_dashboard", "print_confirmation"]
      }
    ],
    "pricing_mode": "current_prices",
    "requires_credit_check": true
  },
  "account_management": {
    "id": "account_flow",
    "entry_point": "/portal/account",
    "steps": [
      {
        "step": 1,
        "id": "account_overview",
        "screen": "account_overview_screen",
        "sections": ["company_info", "contacts", "addresses", "payment_terms", "credit_status"],
        "actions": ["edit_contact", "add_address", "change_password"]
      },
      {
        "step": 2,
        "id": "manage_users",
        "screen": "manage_users_screen",
        "condition": "user.is_primary_contact",
        "data_source": "customer.portal_users",
        "actions": ["invite_user", "edit_user", "deactivate_user"]
      },
      {
        "step": 3,
        "id": "payment_history",
        "screen": "payment_history_screen",
        "data_source": "customer.payments",
        "filters": ["date_range", "status"],
        "actions": ["download_statement"]
      }
    ]
  }
}
```

---

## 2. portal_screens

### Login & Authentication

```json
{
  "login_screen": {
    "id": "login_screen",
    "route": "/portal/login",
    "layout": "centered_card",
    "components": {
      "branding": {
        "type": "logo",
        "source": "tenant.branding.logo_url",
        "position": "top_center",
        "size": "large"
      },
      "login_form": {
        "type": "form",
        "fields": [
          {
            "id": "email",
            "type": "email",
            "label": "Email Address",
            "placeholder": "you@company.com",
            "autofocus": true,
            "validation": ["required", "email_format"]
          },
          {
            "id": "password",
            "type": "password",
            "label": "Password",
            "show_toggle": true,
            "validation": ["required"]
          },
          {
            "id": "remember_me",
            "type": "checkbox",
            "label": "Remember me for 30 days"
          }
        ],
        "submit_button": {
          "label": "Sign In",
          "loading_label": "Signing in...",
          "full_width": true
        }
      },
      "forgot_password_link": {
        "type": "link",
        "label": "Forgot your password?",
        "action": "navigate:/portal/forgot-password",
        "position": "below_form"
      },
      "request_access_section": {
        "type": "section",
        "label": "Don't have an account?",
        "action_button": {
          "label": "Request Portal Access",
          "variant": "outlined",
          "action": "navigate:/portal/request-access"
        },
        "position": "bottom"
      },
      "support_link": {
        "type": "text",
        "content": "Need help? Contact {tenant.support_email}",
        "position": "footer"
      }
    }
  },
  "mfa_screen": {
    "id": "mfa_screen",
    "route": "/portal/mfa",
    "layout": "centered_card",
    "components": {
      "header": {
        "type": "text",
        "content": "Two-Factor Authentication",
        "variant": "h5"
      },
      "instructions": {
        "type": "text",
        "content": "Enter the 6-digit code from your authenticator app",
        "variant": "body2"
      },
      "otp_input": {
        "type": "otp_input",
        "length": 6,
        "autofocus": true,
        "auto_submit": true
      },
      "resend_section": {
        "type": "section",
        "condition": "mfa_method == 'sms' OR mfa_method == 'email'",
        "content": "Didn't receive a code?",
        "action_link": {
          "label": "Resend Code",
          "action": "resend_mfa_code",
          "cooldown_seconds": 60
        }
      },
      "cancel_button": {
        "type": "button",
        "label": "Cancel",
        "variant": "text",
        "action": "navigate:/portal/login"
      }
    }
  }
}
```

### Dashboard

```json
{
  "dashboard_screen": {
    "id": "dashboard_screen",
    "route": "/portal",
    "layout": "dashboard",
    "components": {
      "welcome_header": {
        "type": "header",
        "content": "Welcome back, {user.first_name}",
        "subtitle": "{customer.company_name}",
        "position": "top"
      },
      "quick_actions": {
        "type": "action_card_row",
        "position": "top",
        "cards": [
          {
            "id": "new_quote",
            "icon": "request_quote",
            "label": "Request Quote",
            "action": "navigate:/portal/quotes/new",
            "color": "primary"
          },
          {
            "id": "view_orders",
            "icon": "receipt_long",
            "label": "View Orders",
            "action": "navigate:/portal/orders",
            "badge": "orders.in_progress_count"
          },
          {
            "id": "documents",
            "icon": "description",
            "label": "Documents",
            "action": "navigate:/portal/documents"
          },
          {
            "id": "contact_us",
            "icon": "support_agent",
            "label": "Contact Us",
            "action": "open_contact_modal"
          }
        ]
      },
      "orders_in_progress": {
        "type": "card",
        "title": "Orders In Progress",
        "position": "main_left",
        "content": {
          "type": "table",
          "data_source": "customer.orders.in_progress",
          "max_rows": 5,
          "columns": [
            { "field": "order_number", "label": "Order #", "link": "/portal/orders/{id}" },
            { "field": "order_date", "label": "Date", "format": "date_short" },
            { "field": "status", "label": "Status", "type": "status_badge" },
            { "field": "total", "label": "Total", "format": "currency" }
          ],
          "empty_state": {
            "icon": "inbox",
            "message": "No orders in progress"
          }
        },
        "footer_action": {
          "label": "View All Orders",
          "action": "navigate:/portal/orders"
        }
      },
      "recent_shipments": {
        "type": "card",
        "title": "Recent Shipments",
        "position": "main_right",
        "content": {
          "type": "list",
          "data_source": "customer.shipments.recent",
          "max_items": 5,
          "item_template": {
            "primary": "shipment.tracking_number",
            "secondary": "shipment.order_number",
            "tertiary": "{shipment.status} • {shipment.shipped_date}",
            "action": { "icon": "open_in_new", "action": "open_tracking_url" }
          },
          "empty_state": {
            "icon": "local_shipping",
            "message": "No recent shipments"
          }
        }
      },
      "account_summary": {
        "type": "card",
        "title": "Account Summary",
        "position": "sidebar",
        "content": {
          "type": "key_value_list",
          "items": [
            { "label": "Account Number", "value": "customer.account_number" },
            { "label": "Payment Terms", "value": "customer.payment_terms" },
            { "label": "Credit Limit", "value": "customer.credit_limit", "format": "currency" },
            { "label": "Available Credit", "value": "customer.available_credit", "format": "currency", "color_coded": true },
            { "label": "Open Balance", "value": "customer.open_balance", "format": "currency" }
          ]
        },
        "footer_action": {
          "label": "View Account Details",
          "action": "navigate:/portal/account"
        }
      },
      "csr_contact": {
        "type": "card",
        "title": "Your Sales Rep",
        "position": "sidebar_bottom",
        "content": {
          "type": "contact_card",
          "data_source": "customer.assigned_csr",
          "fields": ["name", "email", "phone"],
          "actions": [
            { "label": "Email", "icon": "email", "action": "mailto:{csr.email}" },
            { "label": "Call", "icon": "phone", "action": "tel:{csr.phone}" }
          ]
        }
      }
    }
  }
}
```

### Orders List

```json
{
  "orders_list_screen": {
    "id": "orders_list_screen",
    "route": "/portal/orders",
    "layout": "list_page",
    "components": {
      "page_header": {
        "type": "page_header",
        "title": "Orders",
        "actions": [
          {
            "id": "request_quote",
            "label": "Request Quote",
            "icon": "add",
            "variant": "contained",
            "action": "navigate:/portal/quotes/new"
          }
        ]
      },
      "filters_bar": {
        "type": "filters_bar",
        "position": "top",
        "filters": [
          {
            "id": "search",
            "type": "search",
            "placeholder": "Search orders, PO#, products...",
            "fields_searched": ["order_number", "po_number", "line_items.description"]
          },
          {
            "id": "status",
            "type": "multi_select",
            "label": "Status",
            "options_source": "order_statuses_customer_facing",
            "default": "all"
          },
          {
            "id": "date_range",
            "type": "date_range",
            "label": "Order Date",
            "presets": ["last_30_days", "last_90_days", "last_year", "all_time"],
            "default": "last_90_days"
          }
        ],
        "clear_button": true
      },
      "orders_table": {
        "type": "data_table",
        "data_source": "customer.orders",
        "columns": [
          {
            "id": "order_number",
            "label": "Order #",
            "width": 120,
            "sortable": true,
            "link": "/portal/orders/{id}"
          },
          {
            "id": "po_number",
            "label": "Your PO#",
            "width": 120,
            "sortable": true
          },
          {
            "id": "order_date",
            "label": "Date",
            "width": 100,
            "format": "date_short",
            "sortable": true,
            "default_sort": "desc"
          },
          {
            "id": "status",
            "label": "Status",
            "width": 140,
            "type": "status_badge"
          },
          {
            "id": "line_count",
            "label": "Items",
            "width": 60,
            "align": "center"
          },
          {
            "id": "total",
            "label": "Total",
            "width": 100,
            "format": "currency",
            "align": "right",
            "sortable": true
          },
          {
            "id": "actions",
            "label": "",
            "width": 120,
            "type": "action_menu",
            "actions": [
              { "id": "view", "label": "View Details", "icon": "visibility" },
              { "id": "reorder", "label": "Reorder", "icon": "replay" },
              { "id": "invoice", "label": "Download Invoice", "icon": "receipt", "condition": "has_invoice" }
            ]
          }
        ],
        "row_click": "navigate:/portal/orders/{id}",
        "pagination": {
          "type": "pages",
          "page_sizes": [20, 50, 100],
          "default_page_size": 20
        },
        "empty_state": {
          "icon": "receipt_long",
          "title": "No orders found",
          "message": "Adjust your filters or request a new quote",
          "action": {
            "label": "Request Quote",
            "action": "navigate:/portal/quotes/new"
          }
        }
      }
    }
  }
}
```

### Order Detail

```json
{
  "order_detail_screen": {
    "id": "order_detail_screen",
    "route": "/portal/orders/{order_id}",
    "layout": "detail_page",
    "components": {
      "page_header": {
        "type": "page_header",
        "title": "Order {order.order_number}",
        "breadcrumbs": [
          { "label": "Orders", "route": "/portal/orders" },
          { "label": "{order.order_number}" }
        ],
        "actions": [
          {
            "id": "reorder",
            "label": "Reorder",
            "icon": "replay",
            "variant": "contained",
            "action": "navigate:/portal/orders/{order_id}/reorder"
          },
          {
            "id": "download_menu",
            "type": "menu",
            "label": "Download",
            "icon": "download",
            "items": [
              { "id": "invoice", "label": "Invoice", "action": "download_invoice", "condition": "has_invoice" },
              { "id": "packing_slip", "label": "Packing Slip", "action": "download_packing_slip" },
              { "id": "mtrs", "label": "Mill Test Reports", "action": "download_mtrs", "condition": "has_mtrs" }
            ]
          }
        ]
      },
      "order_header_card": {
        "type": "card",
        "position": "top",
        "content": {
          "type": "grid",
          "columns": 4,
          "items": [
            { "label": "Order Date", "value": "{order.order_date}", "format": "date_long" },
            { "label": "Your PO#", "value": "{order.po_number}" },
            { "label": "Status", "value": "{order.status}", "type": "status_badge" },
            { "label": "Order Total", "value": "{order.grand_total}", "format": "currency", "size": "large" }
          ]
        }
      },
      "status_timeline": {
        "type": "card",
        "title": "Order Progress",
        "position": "main",
        "content": {
          "type": "horizontal_timeline",
          "data_source": "order.status_history",
          "steps": [
            { "id": "received", "label": "Order Received", "icon": "check_circle" },
            { "id": "confirmed", "label": "Confirmed", "icon": "thumb_up" },
            { "id": "processing", "label": "Processing", "icon": "precision_manufacturing" },
            { "id": "shipped", "label": "Shipped", "icon": "local_shipping" },
            { "id": "delivered", "label": "Delivered", "icon": "home" }
          ],
          "current_step": "order.timeline_step",
          "show_dates": true
        }
      },
      "line_items_card": {
        "type": "card",
        "title": "Order Items",
        "position": "main",
        "content": {
          "type": "table",
          "data_source": "order.line_items",
          "columns": [
            { "field": "line_number", "label": "#", "width": 40 },
            { "field": "product_code", "label": "Product", "width": 120 },
            { "field": "description", "label": "Description", "width": 300 },
            { "field": "quantity", "label": "Qty", "width": 80, "format": "quantity_uom" },
            { "field": "unit_price", "label": "Unit Price", "width": 100, "format": "currency" },
            { "field": "extended_price", "label": "Total", "width": 100, "format": "currency" },
            { "field": "status", "label": "Status", "width": 120, "type": "status_chip" }
          ],
          "expandable_rows": {
            "content_type": "line_detail",
            "fields": ["processing_notes", "dimensions", "grade", "mtr_link"]
          }
        },
        "footer": {
          "type": "order_totals",
          "items": [
            { "label": "Subtotal", "value": "order.subtotal" },
            { "label": "Processing", "value": "order.processing_total", "condition": "value > 0" },
            { "label": "Freight", "value": "order.freight_charge" },
            { "label": "Tax", "value": "order.tax_amount" },
            { "label": "Total", "value": "order.grand_total", "bold": true }
          ]
        }
      },
      "shipments_card": {
        "type": "card",
        "title": "Shipments",
        "position": "main",
        "condition": "order.shipments.length > 0",
        "content": {
          "type": "list",
          "data_source": "order.shipments",
          "item_template": {
            "type": "shipment_card",
            "fields": [
              { "field": "tracking_number", "label": "Tracking #" },
              { "field": "carrier", "label": "Carrier" },
              { "field": "ship_date", "label": "Shipped", "format": "date_short" },
              { "field": "status", "type": "status_chip" }
            ],
            "actions": [
              {
                "id": "track",
                "label": "Track Package",
                "icon": "open_in_new",
                "action": "open_url:{shipment.tracking_url}"
              }
            ]
          }
        }
      },
      "shipping_info_card": {
        "type": "card",
        "title": "Shipping Information",
        "position": "sidebar",
        "content": {
          "type": "address_display",
          "data_source": "order.shipping_address",
          "show_map_link": true
        }
      },
      "documents_card": {
        "type": "card",
        "title": "Documents",
        "position": "sidebar",
        "content": {
          "type": "document_list",
          "data_source": "order.documents",
          "item_template": {
            "icon_by_type": true,
            "fields": ["name", "type", "date"],
            "action": { "icon": "download", "action": "download_document" }
          }
        },
        "empty_state": {
          "message": "No documents available yet"
        }
      },
      "support_card": {
        "type": "card",
        "title": "Need Help?",
        "position": "sidebar_bottom",
        "content": {
          "type": "action_list",
          "items": [
            {
              "icon": "email",
              "label": "Email Support",
              "action": "mailto:{tenant.support_email}?subject=Order {order.order_number}"
            },
            {
              "icon": "phone",
              "label": "Call {location.phone}",
              "action": "tel:{location.phone}"
            },
            {
              "icon": "chat",
              "label": "Live Chat",
              "action": "open_chat",
              "condition": "tenant.chat_enabled"
            }
          ]
        }
      }
    }
  }
}
```

### Quote Request

```json
{
  "quote_builder_screen": {
    "id": "quote_builder_screen",
    "route": "/portal/quotes/new",
    "layout": "split_panel",
    "components": {
      "page_header": {
        "type": "page_header",
        "title": "Request Quote",
        "breadcrumbs": [
          { "label": "Dashboard", "route": "/portal" },
          { "label": "Request Quote" }
        ]
      },
      "product_search_panel": {
        "type": "panel",
        "position": "left",
        "width": "60%",
        "components": {
          "search_bar": {
            "type": "search",
            "placeholder": "Search products by name, grade, dimensions...",
            "autofocus": true
          },
          "category_filter": {
            "type": "chip_filter",
            "label": "Category",
            "options_source": "product_categories",
            "multi_select": false
          },
          "search_results": {
            "type": "product_grid",
            "data_source": "search_results",
            "card_template": {
              "fields": ["product_code", "description", "form", "grade"],
              "actions": [
                { "label": "Add to Quote", "action": "add_to_cart" }
              ]
            },
            "pagination": { "type": "infinite_scroll" }
          },
          "recent_products": {
            "type": "section",
            "title": "Recently Ordered",
            "visible_if": "search_query.empty",
            "content": {
              "type": "product_list",
              "data_source": "customer.recent_products",
              "max_items": 10
            }
          }
        }
      },
      "cart_panel": {
        "type": "panel",
        "position": "right",
        "width": "40%",
        "sticky": true,
        "components": {
          "cart_header": {
            "type": "header",
            "title": "Quote Items",
            "subtitle": "{cart.item_count} items"
          },
          "cart_items": {
            "type": "list",
            "data_source": "cart.items",
            "item_template": {
              "type": "cart_item",
              "fields": [
                { "field": "description", "editable": false },
                { "field": "quantity", "type": "stepper", "editable": true },
                { "field": "uom", "type": "dropdown", "options_source": "product.available_uoms" },
                { "field": "dimensions", "type": "dimension_input", "condition": "product.requires_dimensions" },
                { "field": "processing", "type": "multi_select", "options_source": "product.processing_options" }
              ],
              "actions": [
                { "icon": "delete", "action": "remove_from_cart" }
              ]
            },
            "empty_state": {
              "icon": "shopping_cart",
              "message": "Your quote is empty",
              "hint": "Search for products to add"
            }
          },
          "special_instructions": {
            "type": "textarea",
            "label": "Special Instructions",
            "placeholder": "Any special requirements, tolerances, or notes...",
            "max_length": 1000
          },
          "requested_date": {
            "type": "date_picker",
            "label": "Needed By (Optional)",
            "min_date": "today + 1"
          },
          "submit_actions": {
            "type": "button_group",
            "position": "bottom",
            "sticky": true,
            "buttons": [
              {
                "id": "save_draft",
                "label": "Save Draft",
                "variant": "outlined",
                "action": "save_draft"
              },
              {
                "id": "submit",
                "label": "Submit Quote Request",
                "variant": "contained",
                "action": "submit_quote",
                "disabled_if": "cart.item_count == 0"
              }
            ]
          }
        }
      }
    }
  }
}
```

### Reorder

```json
{
  "reorder_review_screen": {
    "id": "reorder_review_screen",
    "route": "/portal/orders/{order_id}/reorder",
    "layout": "checkout",
    "components": {
      "page_header": {
        "type": "page_header",
        "title": "Reorder from Order {original_order.order_number}",
        "breadcrumbs": [
          { "label": "Orders", "route": "/portal/orders" },
          { "label": "{original_order.order_number}", "route": "/portal/orders/{order_id}" },
          { "label": "Reorder" }
        ]
      },
      "warnings_banner": {
        "type": "alert_banner",
        "position": "top",
        "visible_if": "reorder.has_warnings",
        "severity": "warning",
        "content": {
          "type": "list",
          "data_source": "reorder.warnings",
          "item_template": {
            "icon_by_type": true,
            "text": "warning.message"
          }
        }
      },
      "line_items": {
        "type": "card",
        "title": "Items",
        "content": {
          "type": "editable_table",
          "data_source": "reorder.line_items",
          "columns": [
            { "field": "include", "type": "checkbox", "width": 40 },
            { "field": "product_code", "label": "Product", "width": 120 },
            { "field": "description", "label": "Description", "width": 250 },
            { 
              "field": "quantity", 
              "label": "Qty", 
              "width": 100, 
              "type": "number_input",
              "editable": true
            },
            { "field": "uom", "label": "UOM", "width": 60 },
            { 
              "field": "availability", 
              "label": "Availability", 
              "width": 120, 
              "type": "availability_chip" 
            },
            { 
              "field": "original_price", 
              "label": "Prev Price", 
              "width": 90, 
              "format": "currency",
              "style": "muted"
            },
            { 
              "field": "current_price", 
              "label": "Current", 
              "width": 90, 
              "format": "currency",
              "highlight_if": "differs_from_original"
            },
            { 
              "field": "line_total", 
              "label": "Total", 
              "width": 100, 
              "format": "currency" 
            }
          ],
          "row_disabled_if": "item.discontinued",
          "row_warning_if": "item.price_changed OR item.low_stock"
        }
      },
      "shipping_section": {
        "type": "card",
        "title": "Shipping",
        "content": {
          "type": "address_selector",
          "data_source": "customer.shipping_addresses",
          "selected": "original_order.shipping_address",
          "allow_new": true
        }
      },
      "order_details_section": {
        "type": "card",
        "title": "Order Details",
        "content": {
          "type": "form",
          "fields": [
            {
              "id": "po_number",
              "type": "text",
              "label": "Your PO Number",
              "required": "customer.po_required"
            },
            {
              "id": "requested_date",
              "type": "date_picker",
              "label": "Requested Ship Date",
              "min_date": "today + lead_time"
            },
            {
              "id": "special_instructions",
              "type": "textarea",
              "label": "Special Instructions",
              "placeholder": "Delivery instructions, contact info, etc."
            }
          ]
        }
      },
      "order_summary": {
        "type": "card",
        "title": "Order Summary",
        "position": "sidebar",
        "sticky": true,
        "content": {
          "type": "order_totals",
          "items": [
            { "label": "Subtotal", "value": "reorder.subtotal", "format": "currency" },
            { "label": "Estimated Freight", "value": "reorder.freight_estimate", "format": "currency" },
            { "label": "Estimated Tax", "value": "reorder.tax_estimate", "format": "currency" },
            { "label": "Estimated Total", "value": "reorder.grand_total", "format": "currency", "bold": true, "size": "large" }
          ],
          "disclaimer": "Final pricing confirmed upon order review"
        },
        "actions": {
          "type": "button_stack",
          "buttons": [
            {
              "id": "place_order",
              "label": "Place Order",
              "variant": "contained",
              "size": "large",
              "full_width": true,
              "action": "submit_reorder"
            },
            {
              "id": "request_quote",
              "label": "Request Quote Instead",
              "variant": "text",
              "action": "convert_to_quote"
            }
          ]
        }
      },
      "credit_status": {
        "type": "info_banner",
        "position": "sidebar",
        "condition": "customer.available_credit < reorder.grand_total",
        "severity": "warning",
        "content": "Order total may exceed available credit. Our team will review."
      }
    }
  }
}
```

### Documents

```json
{
  "documents_list_screen": {
    "id": "documents_list_screen",
    "route": "/portal/documents",
    "layout": "list_page",
    "components": {
      "page_header": {
        "type": "page_header",
        "title": "Documents"
      },
      "filters_bar": {
        "type": "filters_bar",
        "filters": [
          {
            "id": "search",
            "type": "search",
            "placeholder": "Search by order #, document name..."
          },
          {
            "id": "document_type",
            "type": "multi_select",
            "label": "Type",
            "options": [
              { "value": "invoice", "label": "Invoices" },
              { "value": "packing_slip", "label": "Packing Slips" },
              { "value": "mtr", "label": "Mill Test Reports" },
              { "value": "coc", "label": "Certificates of Conformance" },
              { "value": "bol", "label": "Bills of Lading" },
              { "value": "quote", "label": "Quotes" }
            ]
          },
          {
            "id": "date_range",
            "type": "date_range",
            "label": "Date",
            "presets": ["last_30_days", "last_90_days", "last_year"]
          }
        ]
      },
      "documents_table": {
        "type": "data_table",
        "data_source": "customer.documents",
        "columns": [
          { "field": "document_type", "label": "Type", "width": 150, "type": "document_type_chip" },
          { "field": "document_name", "label": "Document", "width": 250 },
          { "field": "order_number", "label": "Order #", "width": 120, "link": "/portal/orders/{order_id}" },
          { "field": "date", "label": "Date", "width": 100, "format": "date_short", "sortable": true },
          { "field": "size", "label": "Size", "width": 80, "format": "file_size" },
          {
            "field": "actions",
            "label": "",
            "width": 100,
            "type": "action_buttons",
            "actions": [
              { "id": "view", "icon": "visibility", "tooltip": "View", "action": "open_viewer" },
              { "id": "download", "icon": "download", "tooltip": "Download", "action": "download" }
            ]
          }
        ],
        "bulk_actions": [
          { "id": "download_selected", "label": "Download Selected", "icon": "download" }
        ],
        "row_selection": true
      }
    }
  }
}
```

---

## 3. status_mapping

### Order Status Mapping

| Internal Status | Portal Label | Color | Icon | Show Progress % | Description Shown |
|-----------------|--------------|-------|------|-----------------|-------------------|
| draft | - | - | - | - | (not visible) |
| pending_review | Received | blue | inbox | 10% | Order received, awaiting confirmation |
| confirmed | Confirmed | blue | check_circle | 20% | Order confirmed and scheduled |
| released | In Production | orange | precision_manufacturing | 40% | Being processed at our facility |
| in_progress | In Production | orange | precision_manufacturing | 50% | Being processed at our facility |
| partial_complete | Partially Complete | orange | hourglass_top | 60% | Some items ready |
| complete | Ready to Ship | green | inventory | 80% | Completed, preparing for shipment |
| shipped | Shipped | green | local_shipping | 90% | On the way |
| partial_shipped | Partially Shipped | green | local_shipping | 85% | Some items shipped |
| delivered | Delivered | green | check_circle | 100% | Delivered |
| invoiced | Complete | grey | receipt | 100% | Order complete |
| cancelled | Cancelled | red | cancel | - | Order cancelled |
| on_hold | On Hold | yellow | pause_circle | - | Contact us for details |

### Job Status Mapping (Line Item Level)

| Internal Job Status | Portal Label | Color | Icon |
|---------------------|--------------|-------|------|
| queued | Scheduled | grey | schedule |
| in_progress | Processing | orange | autorenew |
| staged | Ready | blue | check |
| completed | Complete | green | check_circle |
| shipped | Shipped | green | local_shipping |
| cancelled | Cancelled | red | cancel |
| on_hold | On Hold | yellow | pause |

### Shipment Status Mapping

| Internal Shipment Status | Portal Label | Color | Icon | Show Tracking |
|--------------------------|--------------|-------|------|---------------|
| pending | Preparing | grey | inventory | no |
| picked | Picked | blue | check_box | no |
| packed | Packed | blue | archive | no |
| label_created | Label Created | blue | qr_code | yes |
| shipped | In Transit | orange | local_shipping | yes |
| out_for_delivery | Out for Delivery | orange | delivery_dining | yes |
| delivered | Delivered | green | home | yes |
| exception | Delivery Issue | red | warning | yes |
| returned | Returned | red | keyboard_return | yes |

### Quote Status Mapping

| Internal Quote Status | Portal Label | Color | Icon |
|-----------------------|--------------|-------|------|
| draft | Draft | grey | edit |
| submitted | Submitted | blue | send |
| under_review | Under Review | orange | hourglass_empty |
| quoted | Quote Ready | green | request_quote |
| accepted | Accepted | green | check_circle |
| expired | Expired | red | timer_off |
| declined | Declined | red | cancel |

---

## 4. documents_exposed

```json
[
  {
    "document_type": "invoice",
    "label": "Invoice",
    "icon": "receipt",
    "source_entity": "order",
    "available_when": "order.status IN ('invoiced', 'complete', 'partial_shipped', 'shipped', 'delivered')",
    "format": "pdf",
    "generated_by": "billing_system",
    "retention_days": 2555,
    "permissions": {
      "view": ["CUSTOMER_PORTAL"],
      "download": ["CUSTOMER_PORTAL"]
    },
    "email_on_create": true,
    "filename_pattern": "INV-{invoice_number}.pdf"
  },
  {
    "document_type": "credit_memo",
    "label": "Credit Memo",
    "icon": "money_off",
    "source_entity": "order",
    "available_when": "credit_memo.exists",
    "format": "pdf",
    "generated_by": "billing_system",
    "retention_days": 2555,
    "permissions": {
      "view": ["CUSTOMER_PORTAL"],
      "download": ["CUSTOMER_PORTAL"]
    },
    "email_on_create": true,
    "filename_pattern": "CM-{credit_memo_number}.pdf"
  },
  {
    "document_type": "packing_slip",
    "label": "Packing Slip",
    "icon": "list_alt",
    "source_entity": "shipment",
    "available_when": "shipment.status IN ('packed', 'shipped', 'delivered')",
    "format": "pdf",
    "generated_by": "shipping_system",
    "retention_days": 730,
    "permissions": {
      "view": ["CUSTOMER_PORTAL"],
      "download": ["CUSTOMER_PORTAL"]
    },
    "email_on_create": false,
    "filename_pattern": "PS-{order_number}-{shipment_sequence}.pdf"
  },
  {
    "document_type": "bill_of_lading",
    "label": "Bill of Lading",
    "icon": "description",
    "source_entity": "shipment",
    "available_when": "shipment.status IN ('shipped', 'delivered') AND shipment.carrier_type = 'freight'",
    "format": "pdf",
    "generated_by": "shipping_system",
    "retention_days": 730,
    "permissions": {
      "view": ["CUSTOMER_PORTAL"],
      "download": ["CUSTOMER_PORTAL"]
    },
    "email_on_create": false,
    "filename_pattern": "BOL-{bol_number}.pdf"
  },
  {
    "document_type": "mtr",
    "label": "Mill Test Report",
    "icon": "science",
    "source_entity": "order_line",
    "available_when": "order_line.has_mtr AND order.status NOT IN ('draft', 'pending_review')",
    "format": "pdf",
    "generated_by": "external_upload",
    "retention_days": 3650,
    "permissions": {
      "view": ["CUSTOMER_PORTAL"],
      "download": ["CUSTOMER_PORTAL"]
    },
    "linked_to": "heat",
    "email_on_create": false,
    "filename_pattern": "MTR-{heat_number}.pdf"
  },
  {
    "document_type": "coc",
    "label": "Certificate of Conformance",
    "icon": "verified",
    "source_entity": "order",
    "available_when": "order.coc_required AND order.status IN ('complete', 'shipped', 'delivered')",
    "format": "pdf",
    "generated_by": "qa_system",
    "retention_days": 3650,
    "permissions": {
      "view": ["CUSTOMER_PORTAL"],
      "download": ["CUSTOMER_PORTAL"]
    },
    "email_on_create": true,
    "filename_pattern": "COC-{order_number}.pdf"
  },
  {
    "document_type": "quote_document",
    "label": "Quote",
    "icon": "request_quote",
    "source_entity": "quote",
    "available_when": "quote.status = 'quoted'",
    "format": "pdf",
    "generated_by": "order_system",
    "retention_days": 365,
    "permissions": {
      "view": ["CUSTOMER_PORTAL"],
      "download": ["CUSTOMER_PORTAL"]
    },
    "email_on_create": true,
    "filename_pattern": "QT-{quote_number}.pdf"
  },
  {
    "document_type": "order_confirmation",
    "label": "Order Confirmation",
    "icon": "task_alt",
    "source_entity": "order",
    "available_when": "order.status NOT IN ('draft', 'pending_review', 'cancelled')",
    "format": "pdf",
    "generated_by": "order_system",
    "retention_days": 730,
    "permissions": {
      "view": ["CUSTOMER_PORTAL"],
      "download": ["CUSTOMER_PORTAL"]
    },
    "email_on_create": true,
    "filename_pattern": "OC-{order_number}.pdf"
  },
  {
    "document_type": "statement",
    "label": "Account Statement",
    "icon": "account_balance",
    "source_entity": "customer",
    "available_when": "always",
    "format": "pdf",
    "generated_by": "billing_system",
    "on_demand": true,
    "retention_days": 730,
    "permissions": {
      "view": ["CUSTOMER_PORTAL"],
      "download": ["CUSTOMER_PORTAL"]
    },
    "parameters": ["start_date", "end_date"],
    "filename_pattern": "STMT-{customer_code}-{date_range}.pdf"
  },
  {
    "document_type": "pod",
    "label": "Proof of Delivery",
    "icon": "fact_check",
    "source_entity": "shipment",
    "available_when": "shipment.status = 'delivered' AND shipment.pod_available",
    "format": "pdf",
    "generated_by": "carrier_integration",
    "retention_days": 730,
    "permissions": {
      "view": ["CUSTOMER_PORTAL"],
      "download": ["CUSTOMER_PORTAL"]
    },
    "filename_pattern": "POD-{tracking_number}.pdf"
  }
]
```

---

## 5. integration_surface

### Events Published for E-Commerce

```json
{
  "events": [
    {
      "event_id": "order.created",
      "description": "New order created from any source",
      "payload": {
        "order_id": "uuid",
        "order_number": "string",
        "customer_id": "uuid",
        "source": "enum: portal | ecommerce | internal | edi",
        "total": "decimal",
        "line_count": "integer",
        "created_at": "datetime"
      },
      "triggers_webhook": true
    },
    {
      "event_id": "order.confirmed",
      "description": "Order reviewed and confirmed by internal team",
      "payload": {
        "order_id": "uuid",
        "order_number": "string",
        "confirmed_at": "datetime",
        "estimated_ship_date": "date",
        "confirmed_total": "decimal"
      },
      "triggers_webhook": true
    },
    {
      "event_id": "order.status_changed",
      "description": "Order status transitioned",
      "payload": {
        "order_id": "uuid",
        "order_number": "string",
        "previous_status": "string",
        "new_status": "string",
        "changed_at": "datetime"
      },
      "triggers_webhook": true
    },
    {
      "event_id": "order.shipped",
      "description": "Order or partial order shipped",
      "payload": {
        "order_id": "uuid",
        "order_number": "string",
        "shipment_id": "uuid",
        "tracking_number": "string",
        "carrier": "string",
        "tracking_url": "string",
        "shipped_at": "datetime",
        "line_items_shipped": ["order_line_id array"]
      },
      "triggers_webhook": true
    },
    {
      "event_id": "order.delivered",
      "description": "Shipment marked as delivered",
      "payload": {
        "order_id": "uuid",
        "order_number": "string",
        "shipment_id": "uuid",
        "delivered_at": "datetime",
        "signed_by": "string | null"
      },
      "triggers_webhook": true
    },
    {
      "event_id": "order.invoiced",
      "description": "Invoice generated for order",
      "payload": {
        "order_id": "uuid",
        "order_number": "string",
        "invoice_id": "uuid",
        "invoice_number": "string",
        "invoice_total": "decimal",
        "invoice_url": "string"
      },
      "triggers_webhook": true
    },
    {
      "event_id": "quote.created",
      "description": "Quote request submitted from portal/ecommerce",
      "payload": {
        "quote_id": "uuid",
        "quote_number": "string",
        "customer_id": "uuid",
        "source": "string",
        "line_count": "integer",
        "created_at": "datetime"
      },
      "triggers_webhook": true
    },
    {
      "event_id": "quote.responded",
      "description": "Quote priced and sent to customer",
      "payload": {
        "quote_id": "uuid",
        "quote_number": "string",
        "quoted_total": "decimal",
        "valid_until": "date",
        "quote_document_url": "string"
      },
      "triggers_webhook": true
    },
    {
      "event_id": "document.available",
      "description": "New document available for customer",
      "payload": {
        "document_id": "uuid",
        "document_type": "string",
        "order_id": "uuid | null",
        "order_number": "string | null",
        "shipment_id": "uuid | null",
        "download_url": "string",
        "created_at": "datetime"
      },
      "triggers_webhook": true
    },
    {
      "event_id": "inventory.availability_changed",
      "description": "Product availability changed significantly",
      "payload": {
        "product_id": "uuid",
        "product_code": "string",
        "previous_availability": "enum: in_stock | low_stock | out_of_stock",
        "new_availability": "enum: in_stock | low_stock | out_of_stock",
        "available_quantity": "decimal",
        "uom": "string"
      },
      "triggers_webhook": true,
      "debounce_minutes": 5
    },
    {
      "event_id": "price.changed",
      "description": "Product price updated",
      "payload": {
        "product_id": "uuid",
        "product_code": "string",
        "price_type": "string",
        "old_price": "decimal",
        "new_price": "decimal",
        "effective_date": "date"
      },
      "triggers_webhook": true
    }
  ]
}
```

### APIs Exposed for E-Commerce

```json
{
  "api_endpoints": [
    {
      "endpoint": "GET /api/v1/ecommerce/products",
      "description": "List products available for purchase",
      "authentication": "api_key",
      "rate_limit": "100/minute",
      "parameters": [
        { "name": "category_id", "type": "uuid", "required": false },
        { "name": "search", "type": "string", "required": false },
        { "name": "in_stock_only", "type": "boolean", "default": false },
        { "name": "page", "type": "integer", "default": 1 },
        { "name": "page_size", "type": "integer", "default": 50, "max": 200 }
      ],
      "response": {
        "products": ["product_id", "code", "name", "description", "category", "form", "grade", "dimensions", "pricing_uom", "image_url"],
        "pagination": ["total", "page", "page_size", "total_pages"]
      }
    },
    {
      "endpoint": "GET /api/v1/ecommerce/products/{product_id}",
      "description": "Get product details",
      "authentication": "api_key",
      "rate_limit": "200/minute",
      "response": {
        "product": ["all product fields"],
        "availability": ["in_stock", "quantity_available", "lead_time_days"],
        "pricing": ["list_price", "customer_price (if authenticated)", "quantity_breaks"],
        "processing_options": ["available processing types"],
        "related_products": ["product_id array"]
      }
    },
    {
      "endpoint": "GET /api/v1/ecommerce/products/{product_id}/availability",
      "description": "Check product availability",
      "authentication": "api_key",
      "rate_limit": "500/minute",
      "parameters": [
        { "name": "quantity", "type": "decimal", "required": true },
        { "name": "location_id", "type": "uuid", "required": false }
      ],
      "response": {
        "available": "boolean",
        "quantity_available": "decimal",
        "locations": ["location_id", "quantity_available"],
        "lead_time_days": "integer",
        "next_available_date": "date | null"
      }
    },
    {
      "endpoint": "POST /api/v1/ecommerce/cart/price",
      "description": "Get pricing for cart items",
      "authentication": "customer_token",
      "rate_limit": "100/minute",
      "request_body": {
        "items": [
          {
            "product_id": "uuid",
            "quantity": "decimal",
            "uom": "string",
            "processing": ["processing_type_id array"]
          }
        ],
        "shipping_address_id": "uuid | null"
      },
      "response": {
        "items": ["line pricing details"],
        "subtotal": "decimal",
        "processing_total": "decimal",
        "freight_estimate": "decimal",
        "tax_estimate": "decimal",
        "grand_total": "decimal",
        "valid_for_minutes": 30
      }
    },
    {
      "endpoint": "POST /api/v1/ecommerce/orders",
      "description": "Create order from e-commerce",
      "authentication": "customer_token",
      "rate_limit": "20/minute",
      "request_body": {
        "customer_id": "uuid",
        "po_number": "string | null",
        "shipping_address_id": "uuid",
        "requested_ship_date": "date | null",
        "special_instructions": "string | null",
        "line_items": [
          {
            "product_id": "uuid",
            "quantity": "decimal",
            "uom": "string",
            "processing": ["processing_type_id array"],
            "line_notes": "string | null"
          }
        ]
      },
      "response": {
        "order_id": "uuid",
        "order_number": "string",
        "status": "string",
        "estimated_total": "decimal",
        "estimated_ship_date": "date",
        "confirmation_url": "string"
      }
    },
    {
      "endpoint": "GET /api/v1/ecommerce/orders/{order_id}",
      "description": "Get order status and details",
      "authentication": "customer_token",
      "rate_limit": "100/minute",
      "response": {
        "order": ["full order details"],
        "line_items": ["full line details with status"],
        "shipments": ["shipment details with tracking"],
        "documents": ["available documents with download URLs"]
      }
    },
    {
      "endpoint": "GET /api/v1/ecommerce/orders",
      "description": "List customer orders",
      "authentication": "customer_token",
      "rate_limit": "50/minute",
      "parameters": [
        { "name": "status", "type": "string", "required": false },
        { "name": "from_date", "type": "date", "required": false },
        { "name": "to_date", "type": "date", "required": false },
        { "name": "page", "type": "integer", "default": 1 },
        { "name": "page_size", "type": "integer", "default": 20 }
      ],
      "response": {
        "orders": ["order summary array"],
        "pagination": ["total", "page", "page_size"]
      }
    },
    {
      "endpoint": "POST /api/v1/ecommerce/quotes",
      "description": "Submit quote request",
      "authentication": "customer_token",
      "rate_limit": "10/minute",
      "request_body": {
        "customer_id": "uuid",
        "needed_by_date": "date | null",
        "special_instructions": "string | null",
        "line_items": [
          {
            "product_id": "uuid | null",
            "product_description": "string",
            "quantity": "decimal",
            "uom": "string",
            "processing_requirements": "string | null"
          }
        ]
      },
      "response": {
        "quote_id": "uuid",
        "quote_number": "string",
        "status": "submitted",
        "expected_response_date": "date"
      }
    },
    {
      "endpoint": "GET /api/v1/ecommerce/customers/{customer_id}",
      "description": "Get customer account info",
      "authentication": "customer_token",
      "rate_limit": "50/minute",
      "response": {
        "customer": ["account details"],
        "addresses": ["shipping addresses"],
        "contacts": ["portal users"],
        "credit": ["credit_limit", "available_credit", "payment_terms"],
        "assigned_rep": ["csr contact info"]
      }
    },
    {
      "endpoint": "GET /api/v1/ecommerce/documents/{document_id}",
      "description": "Download document",
      "authentication": "customer_token",
      "rate_limit": "100/minute",
      "response": {
        "content_type": "application/pdf",
        "content": "binary"
      }
    }
  ]
}
```

### Webhook Configuration

```json
{
  "webhook_config": {
    "registration_endpoint": "POST /api/v1/webhooks",
    "authentication": "hmac_sha256",
    "retry_policy": {
      "max_retries": 5,
      "retry_intervals_seconds": [30, 120, 600, 3600, 14400]
    },
    "payload_format": "json",
    "headers": {
      "X-Webhook-Event": "event_id",
      "X-Webhook-Timestamp": "unix_timestamp",
      "X-Webhook-Signature": "hmac_signature",
      "X-Tenant-Id": "tenant_id"
    },
    "subscribable_events": [
      "order.created",
      "order.confirmed",
      "order.status_changed",
      "order.shipped",
      "order.delivered",
      "order.invoiced",
      "quote.created",
      "quote.responded",
      "document.available",
      "inventory.availability_changed",
      "price.changed"
    ],
    "management_endpoints": [
      "GET /api/v1/webhooks",
      "POST /api/v1/webhooks",
      "PUT /api/v1/webhooks/{id}",
      "DELETE /api/v1/webhooks/{id}",
      "POST /api/v1/webhooks/{id}/test"
    ]
  }
}
```

---

*Document generated for Build Phase: Customer Portal & E-Commerce Integration*
