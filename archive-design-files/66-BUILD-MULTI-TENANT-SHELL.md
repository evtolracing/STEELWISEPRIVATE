# 66 — Build Multi-Tenant Shell Structure

> **Purpose:** Tenant/division/location hierarchy, shell navigation, branding, and app visibility.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. tenant_model

```json
{
  "tenant": {
    "id": "uuid",
    "code": "string (3-8 chars, unique)",
    "name": "string",
    "legal_name": "string",
    "status": "enum: active | suspended | trial | churned",
    "tier": "enum: starter | professional | enterprise",
    "created_at": "datetime",
    "trial_ends_at": "datetime | null",
    "subscription": {
      "plan_id": "string",
      "billing_cycle": "enum: monthly | annual",
      "seats_purchased": "integer",
      "seats_used": "integer",
      "renewal_date": "date"
    },
    "branding": {
      "logo_url": "string | null",
      "logo_dark_url": "string | null",
      "favicon_url": "string | null",
      "primary_color": "hex string",
      "secondary_color": "hex string",
      "accent_color": "hex string",
      "custom_css": "string | null",
      "email_logo_url": "string | null",
      "report_logo_url": "string | null",
      "login_background_url": "string | null"
    },
    "enabled_modules": [
      "order_intake",
      "planning",
      "shop_floor",
      "shipping",
      "inventory",
      "billing",
      "analytics",
      "admin"
    ],
    "disabled_modules": [],
    "feature_flags": {
      "retail_pos_enabled": "boolean",
      "customer_portal_enabled": "boolean",
      "commodity_pricing_enabled": "boolean",
      "multi_division": "boolean",
      "advanced_analytics": "boolean",
      "api_access": "boolean",
      "sso_enabled": "boolean",
      "custom_forms": "boolean",
      "document_storage": "boolean",
      "mobile_app": "boolean"
    },
    "settings": {
      "default_timezone": "string (IANA)",
      "default_locale": "string",
      "date_format": "enum: MM/DD/YYYY | DD/MM/YYYY | YYYY-MM-DD",
      "currency": "string (ISO 4217)",
      "weight_uom": "enum: LB | KG",
      "length_uom": "enum: IN | MM",
      "fiscal_year_start_month": "integer (1-12)",
      "session_timeout_minutes": "integer",
      "password_policy": {
        "min_length": "integer",
        "require_uppercase": "boolean",
        "require_number": "boolean",
        "require_special": "boolean",
        "expiry_days": "integer | null"
      }
    },
    "contacts": {
      "primary_contact_user_id": "uuid",
      "billing_contact_email": "string",
      "support_contact_email": "string"
    },
    "limits": {
      "max_users": "integer",
      "max_divisions": "integer",
      "max_locations": "integer",
      "max_products": "integer",
      "storage_gb": "integer",
      "api_calls_per_day": "integer"
    }
  },
  "division": {
    "id": "uuid",
    "tenant_id": "uuid (FK)",
    "code": "string (2-6 chars, unique within tenant)",
    "name": "string",
    "status": "enum: active | inactive",
    "type": "enum: steel | plastics | aluminum | specialty | mixed",
    "created_at": "datetime",
    "settings": {
      "default_location_id": "uuid | null",
      "pricing_tier_default": "enum: tier1 | tier2 | tier3",
      "min_margin_pct": "decimal",
      "auto_release_threshold": "decimal",
      "order_number_prefix": "string (1-4 chars)",
      "job_number_prefix": "string (1-4 chars)"
    },
    "branding_override": {
      "logo_url": "string | null",
      "primary_color": "hex string | null",
      "header_color": "hex string | null"
    },
    "enabled_processing_types": ["uuid array"],
    "enabled_product_categories": ["uuid array"],
    "contacts": {
      "manager_user_id": "uuid",
      "operations_email": "string"
    }
  },
  "location": {
    "id": "uuid",
    "division_id": "uuid (FK)",
    "tenant_id": "uuid (FK, denormalized)",
    "code": "string (2-6 chars, unique within tenant)",
    "name": "string",
    "status": "enum: active | inactive | seasonal",
    "type": "enum: warehouse | service_center | retail | office | virtual",
    "created_at": "datetime",
    "address": {
      "street1": "string",
      "street2": "string | null",
      "city": "string",
      "state": "string",
      "postal_code": "string",
      "country": "string (ISO 3166-1)"
    },
    "contact": {
      "phone": "string",
      "fax": "string | null",
      "email": "string"
    },
    "settings": {
      "timezone": "string (IANA)",
      "operating_hours": {
        "monday": { "open": "HH:mm", "close": "HH:mm" },
        "tuesday": { "open": "HH:mm", "close": "HH:mm" },
        "wednesday": { "open": "HH:mm", "close": "HH:mm" },
        "thursday": { "open": "HH:mm", "close": "HH:mm" },
        "friday": { "open": "HH:mm", "close": "HH:mm" },
        "saturday": { "open": "HH:mm | null", "close": "HH:mm | null" },
        "sunday": { "open": "HH:mm | null", "close": "HH:mm | null" }
      },
      "retail_enabled": "boolean",
      "receiving_enabled": "boolean",
      "shipping_enabled": "boolean",
      "processing_enabled": "boolean"
    },
    "work_centers": ["uuid array"],
    "default_carrier_id": "uuid | null",
    "tax_jurisdiction": {
      "state_tax_rate": "decimal",
      "county_tax_rate": "decimal",
      "city_tax_rate": "decimal",
      "combined_rate": "decimal"
    },
    "manager_user_id": "uuid"
  },
  "hierarchy_rules": {
    "tenant_owns_divisions": true,
    "division_owns_locations": true,
    "user_can_span_divisions": true,
    "user_can_span_locations": true,
    "data_isolation": {
      "level": "tenant",
      "cross_division_visibility": "configurable",
      "cross_location_visibility": "configurable"
    },
    "cascade_on_delete": {
      "tenant": "soft_delete_all",
      "division": "soft_delete_locations",
      "location": "reassign_or_archive"
    }
  }
}
```

---

## 2. shell_navigation_model

```json
{
  "shell": {
    "id": "main_shell",
    "components": {
      "top_bar": {
        "height": 56,
        "position": "fixed",
        "elements": [
          {
            "id": "hamburger_menu",
            "type": "icon_button",
            "icon": "menu",
            "action": "toggle_sidebar",
            "position": "left",
            "visible_if": "screen.width < 1280"
          },
          {
            "id": "tenant_logo",
            "type": "image",
            "source": "tenant.branding.logo_url",
            "fallback": "steelwise_logo",
            "max_height": 40,
            "position": "left",
            "click_action": "navigate_home"
          },
          {
            "id": "division_selector",
            "type": "dropdown",
            "visible_if": "user.divisions.length > 1",
            "source": "user.accessible_divisions",
            "current_value": "session.current_division",
            "on_change": "switch_division",
            "position": "left",
            "style": "compact"
          },
          {
            "id": "location_selector",
            "type": "dropdown",
            "visible_if": "session.current_division.locations.length > 1",
            "source": "session.current_division.locations",
            "current_value": "session.current_location",
            "on_change": "switch_location",
            "position": "left",
            "style": "compact"
          },
          {
            "id": "global_search",
            "type": "search_input",
            "placeholder": "Search orders, customers, products...",
            "hotkey": "Ctrl+K",
            "position": "center",
            "width": 400,
            "visible_if": "screen.width >= 768"
          },
          {
            "id": "notifications_bell",
            "type": "icon_button",
            "icon": "notifications",
            "badge_source": "notifications.unread_count",
            "action": "open_notifications_panel",
            "position": "right"
          },
          {
            "id": "help_button",
            "type": "icon_button",
            "icon": "help_outline",
            "action": "open_help_panel",
            "position": "right"
          },
          {
            "id": "user_menu",
            "type": "avatar_menu",
            "source": "user",
            "position": "right",
            "menu_items": [
              { "id": "profile", "label": "My Profile", "icon": "person", "route": "/profile" },
              { "id": "preferences", "label": "Preferences", "icon": "settings", "route": "/preferences" },
              { "id": "switch_location", "label": "Switch Location", "icon": "swap_horiz", "action": "open_location_switcher", "visible_if": "user.locations.length > 1" },
              { "id": "divider" },
              { "id": "logout", "label": "Sign Out", "icon": "logout", "action": "logout" }
            ]
          }
        ]
      },
      "sidebar": {
        "width": {
          "expanded": 260,
          "collapsed": 64
        },
        "position": "left",
        "collapsible": true,
        "default_state": "expanded",
        "persist_state": true,
        "sections": [
          {
            "id": "main_nav",
            "type": "nav_list",
            "items_source": "navigation.main_items"
          },
          {
            "id": "app_tiles",
            "type": "app_grid",
            "visible_if": "sidebar.expanded",
            "items_source": "navigation.app_tiles"
          },
          {
            "id": "favorites",
            "type": "nav_list",
            "label": "Favorites",
            "items_source": "user.favorites",
            "collapsible": true,
            "visible_if": "user.favorites.length > 0"
          },
          {
            "id": "recent",
            "type": "nav_list",
            "label": "Recent",
            "items_source": "user.recent_items",
            "max_items": 5,
            "collapsible": true
          }
        ],
        "footer": {
          "elements": [
            {
              "id": "collapse_toggle",
              "type": "icon_button",
              "icon": "chevron_left",
              "icon_collapsed": "chevron_right",
              "action": "toggle_sidebar"
            },
            {
              "id": "version_info",
              "type": "text",
              "source": "app.version",
              "visible_if": "sidebar.expanded",
              "style": "muted"
            }
          ]
        }
      },
      "content_area": {
        "margin_left": "sidebar.width",
        "margin_top": "top_bar.height",
        "transition": "margin 0.2s ease"
      },
      "breadcrumb": {
        "visible": true,
        "position": "content_top",
        "source": "router.breadcrumbs",
        "home_icon": "home",
        "separator": "chevron_right"
      }
    }
  },
  "navigation": {
    "main_items": [
      {
        "id": "nav_home",
        "label": "Home",
        "icon": "home",
        "route": "/",
        "visible_to": "all"
      },
      {
        "id": "nav_orders",
        "label": "Orders",
        "icon": "receipt_long",
        "route": "/orders",
        "visible_to": ["CSR", "PLANNER", "BRANCH_MANAGER", "DIVISION_MANAGER", "FINANCE", "ADMIN"],
        "badge_source": "orders.pending_count",
        "children": [
          { "id": "nav_orders_new", "label": "New Order", "route": "/orders/new", "visible_to": ["CSR", "ADMIN"] },
          { "id": "nav_orders_list", "label": "All Orders", "route": "/orders" },
          { "id": "nav_quotes", "label": "Quotes", "route": "/quotes", "visible_to": ["CSR", "BRANCH_MANAGER", "ADMIN"] },
          { "id": "nav_order_board", "label": "Order Board", "route": "/orders/board", "visible_to": ["CSR", "PLANNER"] }
        ]
      },
      {
        "id": "nav_schedule",
        "label": "Schedule",
        "icon": "calendar_month",
        "route": "/schedule",
        "visible_to": ["PLANNER", "OPERATOR", "BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
        "children": [
          { "id": "nav_schedule_board", "label": "Schedule Board", "route": "/schedule" },
          { "id": "nav_work_centers", "label": "Work Centers", "route": "/schedule/work-centers" },
          { "id": "nav_capacity", "label": "Capacity View", "route": "/schedule/capacity", "visible_to": ["PLANNER", "BRANCH_MANAGER", "ADMIN"] }
        ]
      },
      {
        "id": "nav_shop_floor",
        "label": "Shop Floor",
        "icon": "precision_manufacturing",
        "route": "/shop-floor",
        "visible_to": ["OPERATOR", "PLANNER", "QA_MANAGER", "BRANCH_MANAGER", "ADMIN"]
      },
      {
        "id": "nav_inventory",
        "label": "Inventory",
        "icon": "inventory_2",
        "route": "/inventory",
        "visible_to": ["CSR", "PLANNER", "SHIPPING", "PURCHASING", "BRANCH_MANAGER", "DIVISION_MANAGER", "FINANCE", "ADMIN"],
        "children": [
          { "id": "nav_inv_search", "label": "Search Inventory", "route": "/inventory" },
          { "id": "nav_inv_receipts", "label": "Receipts", "route": "/inventory/receipts", "visible_to": ["SHIPPING", "PURCHASING", "ADMIN"] },
          { "id": "nav_inv_adjustments", "label": "Adjustments", "route": "/inventory/adjustments", "visible_to": ["BRANCH_MANAGER", "ADMIN"] },
          { "id": "nav_inv_transfers", "label": "Transfers", "route": "/inventory/transfers", "visible_to": ["SHIPPING", "BRANCH_MANAGER", "ADMIN"] }
        ]
      },
      {
        "id": "nav_shipping",
        "label": "Shipping",
        "icon": "local_shipping",
        "route": "/shipping",
        "visible_to": ["SHIPPING", "BRANCH_MANAGER", "ADMIN"],
        "badge_source": "shipping.ready_count",
        "children": [
          { "id": "nav_ship_desk", "label": "Shipping Desk", "route": "/shipping" },
          { "id": "nav_ship_receiving", "label": "Receiving", "route": "/shipping/receiving" },
          { "id": "nav_ship_will_call", "label": "Will Call", "route": "/shipping/will-call" }
        ]
      },
      {
        "id": "nav_customers",
        "label": "Customers",
        "icon": "people",
        "route": "/customers",
        "visible_to": ["CSR", "BRANCH_MANAGER", "DIVISION_MANAGER", "FINANCE", "ADMIN"],
        "children": [
          { "id": "nav_cust_list", "label": "All Customers", "route": "/customers" },
          { "id": "nav_cust_new", "label": "New Customer", "route": "/customers/new", "visible_to": ["CSR", "BRANCH_MANAGER", "ADMIN"] },
          { "id": "nav_cust_contracts", "label": "Contracts", "route": "/customers/contracts", "visible_to": ["BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"] }
        ]
      },
      {
        "id": "nav_products",
        "label": "Products",
        "icon": "category",
        "route": "/products",
        "visible_to": ["CSR", "PLANNER", "PURCHASING", "BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
        "children": [
          { "id": "nav_prod_catalog", "label": "Catalog", "route": "/products" },
          { "id": "nav_prod_pricing", "label": "Pricing", "route": "/products/pricing", "visible_to": ["BRANCH_MANAGER", "DIVISION_MANAGER", "FINANCE", "ADMIN"] },
          { "id": "nav_prod_grades", "label": "Grades", "route": "/products/grades" }
        ]
      },
      {
        "id": "nav_billing",
        "label": "Billing",
        "icon": "payments",
        "route": "/billing",
        "visible_to": ["FINANCE", "BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
        "children": [
          { "id": "nav_bill_invoices", "label": "Invoices", "route": "/billing/invoices" },
          { "id": "nav_bill_payments", "label": "Payments", "route": "/billing/payments" },
          { "id": "nav_bill_ar", "label": "AR Aging", "route": "/billing/ar-aging" }
        ]
      },
      {
        "id": "nav_analytics",
        "label": "Analytics",
        "icon": "analytics",
        "route": "/analytics",
        "visible_to": ["BRANCH_MANAGER", "DIVISION_MANAGER", "FINANCE", "QA_MANAGER", "ADMIN"],
        "children": [
          { "id": "nav_analytics_dashboard", "label": "Dashboard", "route": "/analytics" },
          { "id": "nav_analytics_reports", "label": "Reports", "route": "/analytics/reports" },
          { "id": "nav_analytics_export", "label": "Export", "route": "/analytics/export" }
        ]
      },
      {
        "id": "nav_retail",
        "label": "Retail POS",
        "icon": "point_of_sale",
        "route": "/pos",
        "visible_to": ["RETAIL_COUNTER", "BRANCH_MANAGER", "ADMIN"],
        "visible_if": "tenant.feature_flags.retail_pos_enabled"
      },
      {
        "id": "nav_admin",
        "label": "Admin",
        "icon": "admin_panel_settings",
        "route": "/admin",
        "visible_to": ["BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
        "children": [
          { "id": "nav_admin_users", "label": "Users", "route": "/admin/users" },
          { "id": "nav_admin_roles", "label": "Roles", "route": "/admin/roles", "visible_to": ["DIVISION_MANAGER", "ADMIN"] },
          { "id": "nav_admin_locations", "label": "Locations", "route": "/admin/locations", "visible_to": ["DIVISION_MANAGER", "ADMIN"] },
          { "id": "nav_admin_settings", "label": "Settings", "route": "/admin/settings", "visible_to": ["ADMIN"] },
          { "id": "nav_admin_integrations", "label": "Integrations", "route": "/admin/integrations", "visible_to": ["ADMIN"] },
          { "id": "nav_admin_audit", "label": "Audit Log", "route": "/admin/audit", "visible_to": ["DIVISION_MANAGER", "ADMIN"] }
        ]
      }
    ],
    "app_tiles": [
      {
        "id": "tile_order_intake",
        "label": "Order Intake",
        "icon": "add_shopping_cart",
        "route": "/orders/new",
        "color": "primary",
        "visible_to": ["CSR", "BRANCH_MANAGER", "ADMIN"],
        "module": "order_intake"
      },
      {
        "id": "tile_planning",
        "label": "Planning",
        "icon": "event_note",
        "route": "/schedule",
        "color": "secondary",
        "visible_to": ["PLANNER", "BRANCH_MANAGER", "ADMIN"],
        "module": "planning"
      },
      {
        "id": "tile_shop_floor",
        "label": "Shop Floor",
        "icon": "precision_manufacturing",
        "route": "/shop-floor",
        "color": "success",
        "visible_to": ["OPERATOR", "PLANNER", "QA_MANAGER", "BRANCH_MANAGER", "ADMIN"],
        "module": "shop_floor"
      },
      {
        "id": "tile_shipping",
        "label": "Shipping",
        "icon": "local_shipping",
        "route": "/shipping",
        "color": "info",
        "visible_to": ["SHIPPING", "BRANCH_MANAGER", "ADMIN"],
        "module": "shipping"
      },
      {
        "id": "tile_inventory",
        "label": "Inventory",
        "icon": "inventory_2",
        "route": "/inventory",
        "color": "warning",
        "visible_to": ["CSR", "PLANNER", "SHIPPING", "PURCHASING", "BRANCH_MANAGER", "ADMIN"],
        "module": "inventory"
      },
      {
        "id": "tile_billing",
        "label": "Billing",
        "icon": "payments",
        "route": "/billing",
        "color": "error",
        "visible_to": ["FINANCE", "BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
        "module": "billing"
      },
      {
        "id": "tile_retail_pos",
        "label": "Retail POS",
        "icon": "point_of_sale",
        "route": "/pos",
        "color": "primary",
        "visible_to": ["RETAIL_COUNTER", "BRANCH_MANAGER", "ADMIN"],
        "module": "retail_pos",
        "feature_flag": "retail_pos_enabled"
      },
      {
        "id": "tile_portal",
        "label": "Customer Portal",
        "icon": "storefront",
        "route": "/portal",
        "color": "secondary",
        "visible_to": ["CUSTOMER_PORTAL"],
        "module": "portal",
        "feature_flag": "customer_portal_enabled"
      },
      {
        "id": "tile_analytics",
        "label": "Analytics",
        "icon": "analytics",
        "route": "/analytics",
        "color": "info",
        "visible_to": ["BRANCH_MANAGER", "DIVISION_MANAGER", "FINANCE", "QA_MANAGER", "ADMIN"],
        "module": "analytics"
      },
      {
        "id": "tile_admin",
        "label": "Admin",
        "icon": "admin_panel_settings",
        "route": "/admin",
        "color": "default",
        "visible_to": ["BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
        "module": "admin"
      }
    ],
    "context_switching": {
      "division_switch": {
        "action": "switch_division",
        "behavior": {
          "preserve_route": true,
          "refresh_data": true,
          "clear_filters": true,
          "update_session": true
        },
        "animations": {
          "type": "fade",
          "duration_ms": 200
        }
      },
      "location_switch": {
        "action": "switch_location",
        "behavior": {
          "preserve_route": true,
          "refresh_data": true,
          "clear_filters": false,
          "update_session": true
        },
        "animations": {
          "type": "none"
        }
      }
    },
    "route_guards": [
      {
        "id": "auth_guard",
        "applies_to": "all_except_public",
        "check": "user.authenticated",
        "redirect_on_fail": "/login"
      },
      {
        "id": "tenant_guard",
        "applies_to": "all_authenticated",
        "check": "tenant.status === 'active' || tenant.status === 'trial'",
        "redirect_on_fail": "/suspended"
      },
      {
        "id": "module_guard",
        "applies_to": "module_routes",
        "check": "tenant.enabled_modules.includes(route.module)",
        "redirect_on_fail": "/",
        "show_message": "This module is not enabled for your organization."
      },
      {
        "id": "role_guard",
        "applies_to": "protected_routes",
        "check": "route.visible_to.includes(user.role) || route.visible_to === 'all'",
        "redirect_on_fail": "/unauthorized"
      },
      {
        "id": "location_guard",
        "applies_to": "location_scoped_routes",
        "check": "user.locations.includes(session.current_location)",
        "redirect_on_fail": "/select-location"
      }
    ]
  },
  "responsive_behavior": {
    "breakpoints": {
      "xs": 0,
      "sm": 600,
      "md": 960,
      "lg": 1280,
      "xl": 1920
    },
    "sidebar": {
      "xs": { "mode": "overlay", "default_state": "closed" },
      "sm": { "mode": "overlay", "default_state": "closed" },
      "md": { "mode": "collapsed", "default_state": "collapsed" },
      "lg": { "mode": "persistent", "default_state": "expanded" },
      "xl": { "mode": "persistent", "default_state": "expanded" }
    },
    "top_bar": {
      "xs": { "search": "hidden", "location_selector": "menu" },
      "sm": { "search": "icon_only", "location_selector": "menu" },
      "md": { "search": "compact", "location_selector": "visible" },
      "lg": { "search": "full", "location_selector": "visible" },
      "xl": { "search": "full", "location_selector": "visible" }
    }
  }
}
```

---

## 3. branding_model

```json
{
  "theme_system": {
    "mode": "light | dark | system",
    "persist_preference": "localStorage",
    "default_mode": "light"
  },
  "default_theme": {
    "id": "steelwise_default",
    "name": "SteelWise Default",
    "palette": {
      "primary": {
        "main": "#1976D2",
        "light": "#42A5F5",
        "dark": "#1565C0",
        "contrastText": "#FFFFFF"
      },
      "secondary": {
        "main": "#424242",
        "light": "#616161",
        "dark": "#212121",
        "contrastText": "#FFFFFF"
      },
      "success": {
        "main": "#4CAF50",
        "light": "#81C784",
        "dark": "#388E3C",
        "contrastText": "#FFFFFF"
      },
      "warning": {
        "main": "#FF9800",
        "light": "#FFB74D",
        "dark": "#F57C00",
        "contrastText": "#000000"
      },
      "error": {
        "main": "#F44336",
        "light": "#E57373",
        "dark": "#D32F2F",
        "contrastText": "#FFFFFF"
      },
      "info": {
        "main": "#2196F3",
        "light": "#64B5F6",
        "dark": "#1976D2",
        "contrastText": "#FFFFFF"
      },
      "background": {
        "default": "#FAFAFA",
        "paper": "#FFFFFF",
        "sidebar": "#FFFFFF",
        "topbar": "#FFFFFF"
      },
      "text": {
        "primary": "rgba(0, 0, 0, 0.87)",
        "secondary": "rgba(0, 0, 0, 0.60)",
        "disabled": "rgba(0, 0, 0, 0.38)"
      },
      "divider": "rgba(0, 0, 0, 0.12)"
    },
    "typography": {
      "fontFamily": "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
      "fontFamilyMono": "'JetBrains Mono', 'Fira Code', monospace",
      "fontSize": 14,
      "h1": { "fontSize": "2.5rem", "fontWeight": 500, "lineHeight": 1.2 },
      "h2": { "fontSize": "2rem", "fontWeight": 500, "lineHeight": 1.3 },
      "h3": { "fontSize": "1.75rem", "fontWeight": 500, "lineHeight": 1.4 },
      "h4": { "fontSize": "1.5rem", "fontWeight": 500, "lineHeight": 1.4 },
      "h5": { "fontSize": "1.25rem", "fontWeight": 500, "lineHeight": 1.5 },
      "h6": { "fontSize": "1rem", "fontWeight": 600, "lineHeight": 1.5 },
      "body1": { "fontSize": "1rem", "fontWeight": 400, "lineHeight": 1.5 },
      "body2": { "fontSize": "0.875rem", "fontWeight": 400, "lineHeight": 1.43 },
      "caption": { "fontSize": "0.75rem", "fontWeight": 400, "lineHeight": 1.66 }
    },
    "shape": {
      "borderRadius": 8
    },
    "shadows": {
      "card": "0 2px 8px rgba(0,0,0,0.08)",
      "dropdown": "0 4px 16px rgba(0,0,0,0.12)",
      "modal": "0 8px 32px rgba(0,0,0,0.16)"
    },
    "spacing": {
      "unit": 8
    }
  },
  "dark_theme_overrides": {
    "palette": {
      "background": {
        "default": "#121212",
        "paper": "#1E1E1E",
        "sidebar": "#1E1E1E",
        "topbar": "#1E1E1E"
      },
      "text": {
        "primary": "rgba(255, 255, 255, 0.87)",
        "secondary": "rgba(255, 255, 255, 0.60)",
        "disabled": "rgba(255, 255, 255, 0.38)"
      },
      "divider": "rgba(255, 255, 255, 0.12)"
    }
  },
  "tenant_branding_schema": {
    "logo": {
      "type": "image",
      "formats": ["svg", "png"],
      "max_size_kb": 500,
      "dimensions": {
        "max_width": 200,
        "max_height": 48
      },
      "variants": {
        "full": { "use_in": ["sidebar_expanded", "login", "reports"] },
        "icon": { "use_in": ["sidebar_collapsed", "favicon"] },
        "dark": { "use_in": ["dark_mode", "dark_backgrounds"] }
      }
    },
    "colors": {
      "primary": {
        "type": "hex",
        "description": "Main brand color",
        "applies_to": ["buttons", "links", "active_states", "sidebar_accent"]
      },
      "secondary": {
        "type": "hex",
        "description": "Secondary brand color",
        "applies_to": ["secondary_buttons", "chips", "tags"]
      },
      "accent": {
        "type": "hex",
        "description": "Accent/highlight color",
        "applies_to": ["highlights", "badges", "notifications"]
      },
      "header": {
        "type": "hex",
        "description": "Top bar background",
        "applies_to": ["topbar_background"],
        "optional": true
      },
      "sidebar": {
        "type": "hex",
        "description": "Sidebar background",
        "applies_to": ["sidebar_background"],
        "optional": true
      }
    },
    "custom_css": {
      "type": "text",
      "max_length": 10000,
      "description": "Additional CSS overrides",
      "sanitized": true,
      "scoped": true,
      "tier_required": "enterprise"
    }
  },
  "branding_inheritance": {
    "levels": ["platform", "tenant", "division"],
    "cascade_rule": "child_overrides_parent",
    "properties": {
      "logo": { "inherits": true, "division_can_override": true },
      "primary_color": { "inherits": true, "division_can_override": true },
      "secondary_color": { "inherits": true, "division_can_override": false },
      "custom_css": { "inherits": false, "division_can_override": false }
    }
  },
  "asset_urls": {
    "base": "https://assets.steelwise.io",
    "tenant_path": "/tenants/{tenant_code}",
    "default_path": "/defaults",
    "cdn_enabled": true,
    "cache_ttl_seconds": 86400
  },
  "login_page_customization": {
    "background": {
      "type": "enum: color | image | gradient",
      "color": "#1976D2",
      "image_url": "string | null",
      "gradient": "linear-gradient(135deg, #1976D2 0%, #1565C0 100%)"
    },
    "logo_position": "enum: center | top_left",
    "tagline": {
      "text": "string | null",
      "color": "#FFFFFF"
    },
    "footer": {
      "show_powered_by": true,
      "custom_text": "string | null"
    }
  },
  "email_branding": {
    "header_logo": "tenant.branding.email_logo_url | tenant.branding.logo_url",
    "primary_color": "tenant.branding.primary_color",
    "footer_text": "tenant.legal_name",
    "footer_address": "tenant.address"
  },
  "document_branding": {
    "report_logo": "tenant.branding.report_logo_url | tenant.branding.logo_url",
    "report_header_color": "tenant.branding.primary_color",
    "report_footer": {
      "show_company_info": true,
      "show_page_numbers": true,
      "custom_text": "string | null"
    },
    "invoice_template": {
      "logo_position": "enum: left | center | right",
      "color_scheme": "tenant.branding.primary_color"
    }
  }
}
```

---

## 4. app_tile_matrix

### By Module Enablement

| App Tile | Module Required | Starter Tier | Professional Tier | Enterprise Tier |
|----------|-----------------|--------------|-------------------|-----------------|
| tile_order_intake | order_intake | visible | visible | visible |
| tile_planning | planning | visible | visible | visible |
| tile_shop_floor | shop_floor | visible | visible | visible |
| tile_shipping | shipping | visible | visible | visible |
| tile_inventory | inventory | visible | visible | visible |
| tile_billing | billing | visible | visible | visible |
| tile_retail_pos | retail_pos | hidden | visible | visible |
| tile_portal | portal | hidden | visible | visible |
| tile_analytics | analytics | disabled | visible | visible |
| tile_admin | admin | visible | visible | visible |

### By Role

| App Tile | CSR | PLANNER | OPERATOR | SHIPPING | RETAIL_COUNTER | CUSTOMER_PORTAL | BRANCH_MANAGER | DIVISION_MANAGER | FINANCE | QA_MANAGER | PURCHASING | ADMIN |
|----------|-----|---------|----------|----------|----------------|-----------------|----------------|------------------|---------|------------|------------|-------|
| tile_order_intake | visible | hidden | hidden | hidden | hidden | hidden | visible | hidden | hidden | hidden | hidden | visible |
| tile_planning | hidden | visible | hidden | hidden | hidden | hidden | visible | visible | hidden | hidden | hidden | visible |
| tile_shop_floor | hidden | visible | visible | hidden | hidden | hidden | visible | hidden | hidden | visible | hidden | visible |
| tile_shipping | hidden | hidden | hidden | visible | hidden | hidden | visible | hidden | hidden | hidden | hidden | visible |
| tile_inventory | visible | visible | hidden | visible | hidden | hidden | visible | visible | hidden | hidden | visible | visible |
| tile_billing | hidden | hidden | hidden | hidden | hidden | hidden | visible | visible | visible | hidden | hidden | visible |
| tile_retail_pos | hidden | hidden | hidden | hidden | visible | hidden | visible | hidden | hidden | hidden | hidden | visible |
| tile_portal | hidden | hidden | hidden | hidden | hidden | visible | hidden | hidden | hidden | hidden | hidden | hidden |
| tile_analytics | hidden | hidden | hidden | hidden | hidden | hidden | visible | visible | visible | visible | hidden | visible |
| tile_admin | hidden | hidden | hidden | hidden | hidden | hidden | visible | visible | hidden | hidden | hidden | visible |

### Combined Visibility Rules (JSON)

```json
{
  "visibility_rules": [
    {
      "tile_id": "tile_order_intake",
      "conditions": {
        "all": [
          { "tenant.enabled_modules": "includes:order_intake" },
          { "user.role": "in:CSR,BRANCH_MANAGER,ADMIN" }
        ]
      },
      "result": "visible"
    },
    {
      "tile_id": "tile_planning",
      "conditions": {
        "all": [
          { "tenant.enabled_modules": "includes:planning" },
          { "user.role": "in:PLANNER,BRANCH_MANAGER,DIVISION_MANAGER,ADMIN" }
        ]
      },
      "result": "visible"
    },
    {
      "tile_id": "tile_shop_floor",
      "conditions": {
        "all": [
          { "tenant.enabled_modules": "includes:shop_floor" },
          { "user.role": "in:OPERATOR,PLANNER,QA_MANAGER,BRANCH_MANAGER,ADMIN" }
        ]
      },
      "result": "visible"
    },
    {
      "tile_id": "tile_shipping",
      "conditions": {
        "all": [
          { "tenant.enabled_modules": "includes:shipping" },
          { "user.role": "in:SHIPPING,BRANCH_MANAGER,ADMIN" }
        ]
      },
      "result": "visible"
    },
    {
      "tile_id": "tile_inventory",
      "conditions": {
        "all": [
          { "tenant.enabled_modules": "includes:inventory" },
          { "user.role": "in:CSR,PLANNER,SHIPPING,PURCHASING,BRANCH_MANAGER,DIVISION_MANAGER,ADMIN" }
        ]
      },
      "result": "visible"
    },
    {
      "tile_id": "tile_billing",
      "conditions": {
        "all": [
          { "tenant.enabled_modules": "includes:billing" },
          { "user.role": "in:FINANCE,BRANCH_MANAGER,DIVISION_MANAGER,ADMIN" }
        ]
      },
      "result": "visible"
    },
    {
      "tile_id": "tile_retail_pos",
      "conditions": {
        "all": [
          { "tenant.enabled_modules": "includes:retail_pos" },
          { "tenant.feature_flags.retail_pos_enabled": true },
          { "location.settings.retail_enabled": true },
          { "user.role": "in:RETAIL_COUNTER,BRANCH_MANAGER,ADMIN" }
        ]
      },
      "result": "visible"
    },
    {
      "tile_id": "tile_portal",
      "conditions": {
        "all": [
          { "tenant.feature_flags.customer_portal_enabled": true },
          { "user.role": "eq:CUSTOMER_PORTAL" }
        ]
      },
      "result": "visible"
    },
    {
      "tile_id": "tile_analytics",
      "conditions": {
        "all": [
          { "tenant.enabled_modules": "includes:analytics" },
          { "user.role": "in:BRANCH_MANAGER,DIVISION_MANAGER,FINANCE,QA_MANAGER,ADMIN" }
        ]
      },
      "disabled_conditions": {
        "any": [
          { "tenant.tier": "eq:starter" }
        ]
      },
      "result": "visible",
      "disabled_result": "disabled",
      "disabled_tooltip": "Upgrade to Professional for Analytics"
    },
    {
      "tile_id": "tile_admin",
      "conditions": {
        "all": [
          { "tenant.enabled_modules": "includes:admin" },
          { "user.role": "in:BRANCH_MANAGER,DIVISION_MANAGER,ADMIN" }
        ]
      },
      "result": "visible"
    }
  ],
  "default_result": "hidden"
}
```

---

## 5. Session Context Model

```json
{
  "session": {
    "user_id": "uuid",
    "tenant_id": "uuid",
    "tenant_code": "string",
    "current_division_id": "uuid",
    "current_location_id": "uuid",
    "role": "string",
    "permissions": ["string array"],
    "accessible_divisions": [
      { "id": "uuid", "code": "string", "name": "string" }
    ],
    "accessible_locations": [
      { "id": "uuid", "code": "string", "name": "string", "division_id": "uuid" }
    ],
    "preferences": {
      "theme_mode": "light | dark | system",
      "sidebar_collapsed": "boolean",
      "default_division_id": "uuid | null",
      "default_location_id": "uuid | null",
      "date_format": "string",
      "timezone": "string"
    },
    "token": {
      "access_token": "jwt",
      "refresh_token": "string",
      "expires_at": "datetime"
    },
    "started_at": "datetime",
    "last_activity": "datetime"
  },
  "context_resolution": {
    "tenant": {
      "source": "jwt.tenant_id",
      "cache_ttl_minutes": 60,
      "on_change": "full_reload"
    },
    "division": {
      "source": "session.current_division_id OR user.default_division_id OR user.divisions[0]",
      "cache_ttl_minutes": 5,
      "on_change": "refresh_data"
    },
    "location": {
      "source": "session.current_location_id OR user.default_location_id OR division.locations[0]",
      "cache_ttl_minutes": 1,
      "on_change": "refresh_data"
    }
  },
  "data_scoping": {
    "default_scope": "current_location",
    "scope_options": [
      { "id": "current_location", "label": "This Location", "visible_to": "all" },
      { "id": "current_division", "label": "All Locations in Division", "visible_to": ["DIVISION_MANAGER", "ADMIN"] },
      { "id": "all_divisions", "label": "All Divisions", "visible_to": ["ADMIN"] }
    ],
    "per_screen_override": true
  }
}
```

---

## 6. Context Switcher UI

```json
{
  "division_switcher": {
    "id": "division_switcher",
    "type": "dropdown",
    "trigger": {
      "type": "button",
      "label": "session.current_division.name",
      "icon": "business",
      "style": "outlined"
    },
    "panel": {
      "width": 280,
      "max_height": 400,
      "search": {
        "enabled": true,
        "placeholder": "Search divisions...",
        "visible_if": "divisions.length > 5"
      },
      "items": {
        "source": "user.accessible_divisions",
        "item_template": {
          "primary_text": "division.name",
          "secondary_text": "division.type",
          "icon": "division.branding_override.logo_url | 'business'",
          "selected_indicator": "check"
        }
      },
      "footer": {
        "visible_to": ["ADMIN"],
        "action": { "label": "Manage Divisions", "route": "/admin/divisions" }
      }
    },
    "on_select": {
      "action": "switch_division",
      "update_url": true,
      "persist": true
    }
  },
  "location_switcher": {
    "id": "location_switcher",
    "type": "dropdown",
    "trigger": {
      "type": "chip",
      "label": "session.current_location.code",
      "tooltip": "session.current_location.name",
      "icon": "location_on"
    },
    "panel": {
      "width": 320,
      "max_height": 400,
      "group_by": "location.type",
      "search": {
        "enabled": true,
        "placeholder": "Search locations...",
        "visible_if": "locations.length > 5"
      },
      "items": {
        "source": "session.current_division.locations.filter(accessible)",
        "item_template": {
          "primary_text": "location.name",
          "secondary_text": "location.address.city, location.address.state",
          "chip": "location.code",
          "status_indicator": {
            "field": "location.status",
            "colors": { "active": "success", "inactive": "error", "seasonal": "warning" }
          }
        }
      },
      "footer": {
        "visible_to": ["BRANCH_MANAGER", "DIVISION_MANAGER", "ADMIN"],
        "action": { "label": "Manage Locations", "route": "/admin/locations" }
      }
    },
    "on_select": {
      "action": "switch_location",
      "update_url": false,
      "persist": true
    }
  },
  "quick_switcher": {
    "id": "quick_switcher",
    "type": "modal",
    "trigger": {
      "hotkey": "Ctrl+Shift+L"
    },
    "panel": {
      "width": 480,
      "sections": [
        {
          "id": "recent",
          "label": "Recent Locations",
          "source": "user.recent_locations",
          "max_items": 3
        },
        {
          "id": "by_division",
          "label": "All Locations",
          "source": "user.accessible_locations",
          "group_by": "division_name"
        }
      ],
      "keyboard_navigation": true,
      "search": {
        "enabled": true,
        "autofocus": true,
        "searches": ["location.name", "location.code", "division.name"]
      }
    }
  }
}
```

---

*Document generated for Build Phase: Multi-Tenant Shell Structure*
