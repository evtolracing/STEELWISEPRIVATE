# 42 — AI Order Intake & POS

> **Purpose:** POS and order intake workflow specifications for AI-build.  
> **Version:** 1.0  
> **Last Updated:** 2026-01-17

---

## 1. Workflow — State Transitions

```yaml
pos_workflow:
  name: POSOrderWorkflow
  version: "1.0"
  
  entry_points:
    - WALK_IN_CUSTOMER
    - PHONE_ORDER
    - QUICK_REORDER
    - QUOTE_CONVERSION
    - WILL_CALL_PICKUP

  states:
    - id: IDLE
      type: initial
      description: "POS terminal ready for new transaction"
      transitions:
        - to: CUSTOMER_LOOKUP
          trigger: start_order
        - to: QUICK_SALE
          trigger: start_quick_sale
        - to: WILL_CALL_QUEUE
          trigger: will_call_mode

    - id: CUSTOMER_LOOKUP
      type: screen
      description: "Search or create customer"
      transitions:
        - to: CUSTOMER_SELECTED
          trigger: customer_found
          guard: customer_active
        - to: NEW_CUSTOMER
          trigger: create_new
        - to: CREDIT_HOLD_BLOCK
          trigger: customer_found
          guard: customer_on_hold
        - to: IDLE
          trigger: cancel

    - id: NEW_CUSTOMER
      type: screen
      description: "Quick customer creation form"
      transitions:
        - to: CUSTOMER_SELECTED
          trigger: customer_created
        - to: CUSTOMER_LOOKUP
          trigger: back

    - id: CREDIT_HOLD_BLOCK
      type: modal
      description: "Customer on credit hold notification"
      transitions:
        - to: CUSTOMER_SELECTED
          trigger: override_approved
          guard: manager_override
        - to: CASH_ONLY_MODE
          trigger: accept_cash_only
        - to: CUSTOMER_LOOKUP
          trigger: select_different

    - id: CASH_ONLY_MODE
      type: flag
      description: "Order marked as cash/prepay only"
      transitions:
        - to: CUSTOMER_SELECTED
          trigger: continue
          effect: set_payment_required_upfront

    - id: CUSTOMER_SELECTED
      type: checkpoint
      description: "Customer confirmed for order"
      transitions:
        - to: DIVISION_SELECT
          trigger: continue
          guard: multi_division_customer
        - to: LINE_ENTRY
          trigger: continue
          guard: single_division

    - id: DIVISION_SELECT
      type: screen
      description: "Select billing/shipping division"
      transitions:
        - to: LINE_ENTRY
          trigger: division_selected
        - to: CUSTOMER_SELECTED
          trigger: back

    - id: LINE_ENTRY
      type: screen
      description: "Add items to order"
      transitions:
        - to: PRODUCT_SEARCH
          trigger: search_product
        - to: QUICK_ADD
          trigger: scan_barcode
        - to: CUT_CONFIGURATOR
          trigger: add_processing
        - to: QUOTE_LOOKUP
          trigger: from_quote
        - to: REORDER_HISTORY
          trigger: from_history
        - to: ORDER_REVIEW
          trigger: proceed_to_review
          guard: has_lines
        - to: IDLE
          trigger: cancel
          guard: confirm_cancel

    - id: PRODUCT_SEARCH
      type: modal
      description: "Search product catalog"
      transitions:
        - to: PRODUCT_DETAIL
          trigger: product_selected
        - to: LINE_ENTRY
          trigger: close

    - id: PRODUCT_DETAIL
      type: modal
      description: "View product details, check availability"
      transitions:
        - to: LINE_ENTRY
          trigger: add_to_order
          effect: create_line
        - to: CUT_CONFIGURATOR
          trigger: add_with_processing
        - to: PRODUCT_SEARCH
          trigger: back

    - id: QUICK_ADD
      type: action
      description: "Barcode scan adds item directly"
      transitions:
        - to: LINE_ENTRY
          trigger: item_added
        - to: PRODUCT_SEARCH
          trigger: item_not_found

    - id: CUT_CONFIGURATOR
      type: screen
      description: "Configure cutting/processing"
      transitions:
        - to: LINE_ENTRY
          trigger: config_saved
          effect: create_processed_line
        - to: PRODUCT_DETAIL
          trigger: back
        - to: LINE_ENTRY
          trigger: cancel

    - id: QUOTE_LOOKUP
      type: modal
      description: "Find and convert existing quote"
      transitions:
        - to: LINE_ENTRY
          trigger: quote_loaded
          effect: populate_lines
        - to: LINE_ENTRY
          trigger: close

    - id: REORDER_HISTORY
      type: modal
      description: "View customer order history for reorder"
      transitions:
        - to: LINE_ENTRY
          trigger: items_added
          effect: copy_lines
        - to: LINE_ENTRY
          trigger: close

    - id: ORDER_REVIEW
      type: screen
      description: "Review order before submission"
      transitions:
        - to: PRICING_ADJUSTMENT
          trigger: adjust_pricing
          guard: has_pricing_permission
        - to: SHIP_DATE_SELECT
          trigger: continue
        - to: LINE_ENTRY
          trigger: edit_lines

    - id: PRICING_ADJUSTMENT
      type: modal
      description: "Apply discounts, adjust prices"
      transitions:
        - to: APPROVAL_REQUIRED
          trigger: save
          guard: exceeds_authority
        - to: ORDER_REVIEW
          trigger: save
          guard: within_authority
        - to: ORDER_REVIEW
          trigger: cancel

    - id: APPROVAL_REQUIRED
      type: modal
      description: "Manager approval for pricing"
      transitions:
        - to: ORDER_REVIEW
          trigger: approved
          effect: lock_pricing
        - to: PRICING_ADJUSTMENT
          trigger: rejected

    - id: SHIP_DATE_SELECT
      type: screen
      description: "Select delivery method and date"
      transitions:
        - to: SHIPPING_CONFIG
          trigger: delivery_selected
        - to: WILL_CALL_CONFIG
          trigger: will_call_selected
        - to: ORDER_REVIEW
          trigger: back

    - id: SHIPPING_CONFIG
      type: screen
      description: "Configure shipping details"
      transitions:
        - to: PAYMENT_SELECT
          trigger: continue
        - to: SHIP_DATE_SELECT
          trigger: back

    - id: WILL_CALL_CONFIG
      type: screen
      description: "Configure will-call pickup"
      transitions:
        - to: PAYMENT_SELECT
          trigger: continue
        - to: SHIP_DATE_SELECT
          trigger: back

    - id: PAYMENT_SELECT
      type: screen
      description: "Select payment method"
      transitions:
        - to: PAYMENT_PROCESSING
          trigger: process_payment
          guard: payment_now
        - to: ORDER_CONFIRMATION
          trigger: submit_order
          guard: terms_payment
        - to: SHIPPING_CONFIG
          trigger: back

    - id: PAYMENT_PROCESSING
      type: screen
      description: "Process payment (card, cash, check)"
      transitions:
        - to: ORDER_CONFIRMATION
          trigger: payment_complete
        - to: PAYMENT_SELECT
          trigger: payment_failed
        - to: PAYMENT_SELECT
          trigger: cancel

    - id: ORDER_CONFIRMATION
      type: screen
      description: "Order submitted successfully"
      transitions:
        - to: PRINT_OPTIONS
          trigger: print
        - to: IDLE
          trigger: new_order
        - to: QUICK_CUT_QUEUE
          trigger: has_counter_cuts
          guard: processing_required

    - id: PRINT_OPTIONS
      type: modal
      description: "Print order confirmation, picking ticket"
      transitions:
        - to: ORDER_CONFIRMATION
          trigger: printed
        - to: ORDER_CONFIRMATION
          trigger: skip

    - id: QUICK_CUT_QUEUE
      type: notification
      description: "Notify shop floor of counter cut"
      transitions:
        - to: ORDER_CONFIRMATION
          trigger: acknowledged

    # Will-Call Flow
    - id: WILL_CALL_QUEUE
      type: screen
      description: "View orders ready for pickup"
      transitions:
        - to: WILL_CALL_VERIFY
          trigger: select_order
        - to: IDLE
          trigger: back

    - id: WILL_CALL_VERIFY
      type: screen
      description: "Verify customer identity for pickup"
      transitions:
        - to: WILL_CALL_LOAD
          trigger: verified
        - to: WILL_CALL_QUEUE
          trigger: back

    - id: WILL_CALL_LOAD
      type: screen
      description: "Confirm items loaded, capture signature"
      transitions:
        - to: WILL_CALL_COMPLETE
          trigger: complete
        - to: WILL_CALL_PARTIAL
          trigger: partial_pickup
        - to: WILL_CALL_VERIFY
          trigger: back

    - id: WILL_CALL_PARTIAL
      type: modal
      description: "Handle partial pickup"
      transitions:
        - to: WILL_CALL_COMPLETE
          trigger: confirmed
        - to: WILL_CALL_LOAD
          trigger: back

    - id: WILL_CALL_COMPLETE
      type: screen
      description: "Pickup complete, documents printed"
      transitions:
        - to: WILL_CALL_QUEUE
          trigger: next_pickup
        - to: IDLE
          trigger: done

    # Quick Sale (Simplified Flow)
    - id: QUICK_SALE
      type: screen
      description: "Simplified cash sale flow"
      transitions:
        - to: QUICK_SALE_SCAN
          trigger: scan_items
        - to: QUICK_SALE_PAYMENT
          trigger: checkout
          guard: has_items
        - to: IDLE
          trigger: cancel

    - id: QUICK_SALE_SCAN
      type: action
      description: "Rapid barcode scanning"
      transitions:
        - to: QUICK_SALE
          trigger: item_added

    - id: QUICK_SALE_PAYMENT
      type: screen
      description: "Quick payment processing"
      transitions:
        - to: QUICK_SALE_RECEIPT
          trigger: payment_complete
        - to: QUICK_SALE
          trigger: back

    - id: QUICK_SALE_RECEIPT
      type: screen
      description: "Print receipt, complete sale"
      transitions:
        - to: IDLE
          trigger: done

  parallel_states:
    - id: INVENTORY_CHECK
      description: "Background availability check"
      runs_during: [LINE_ENTRY, PRODUCT_DETAIL, CUT_CONFIGURATOR]
      
    - id: PRICE_CALCULATION
      description: "Real-time price updates"
      runs_during: [LINE_ENTRY, ORDER_REVIEW, PRICING_ADJUSTMENT]
      
    - id: CREDIT_CHECK
      description: "Credit limit monitoring"
      runs_during: [LINE_ENTRY, ORDER_REVIEW, PAYMENT_SELECT]

  timeout_rules:
    - state: "*"
      idle_timeout_minutes: 15
      action: prompt_continue
    - state: "*"
      idle_timeout_minutes: 30
      action: auto_suspend
    - state: PAYMENT_PROCESSING
      timeout_seconds: 120
      action: payment_timeout_error
```

---

## 2. Workflow — Block Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              POS ORDER INTAKE FLOW                               │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────┐
                                    │  IDLE   │
                                    └────┬────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              │                          │                          │
              ▼                          ▼                          ▼
     ┌────────────────┐         ┌────────────────┐         ┌────────────────┐
     │  START ORDER   │         │  QUICK SALE    │         │  WILL-CALL     │
     └───────┬────────┘         └───────┬────────┘         └───────┬────────┘
             │                          │                          │
             ▼                          ▼                          ▼
     ┌────────────────┐         ┌────────────────┐         ┌────────────────┐
     │CUSTOMER LOOKUP │         │  SCAN ITEMS    │         │ SELECT ORDER   │
     └───────┬────────┘         └───────┬────────┘         └───────┬────────┘
             │                          │                          │
    ┌────────┴────────┐                 │                          │
    │                 │                 │                          │
    ▼                 ▼                 │                          ▼
┌────────┐    ┌─────────────┐           │                 ┌────────────────┐
│NEW CUST│    │CREDIT HOLD? │           │                 │ VERIFY PICKUP  │
└───┬────┘    └──────┬──────┘           │                 └───────┬────────┘
    │                │                  │                          │
    └───────┬────────┘                  │                          ▼
            │                           │                 ┌────────────────┐
            ▼                           │                 │ LOAD & SIGN    │
    ┌────────────────┐                  │                 └───────┬────────┘
    │CUSTOMER SELECT │                  │                          │
    └───────┬────────┘                  │                          ▼
            │                           │                 ┌────────────────┐
            ▼                           │                 │   COMPLETE     │
    ┌────────────────┐                  │                 └────────────────┘
    │ DIVISION SEL   │◄─────────────────┘
    │  (if multi)    │
    └───────┬────────┘
            │
            ▼
    ┌────────────────┐     ┌────────────────┐     ┌────────────────┐
    │   LINE ENTRY   │◄───►│ PRODUCT SEARCH │◄───►│ CUT CONFIGURTR │
    └───────┬────────┘     └────────────────┘     └────────────────┘
            │
            │ ┌────────────────┐     ┌────────────────┐
            │ │ QUOTE LOOKUP   │     │ REORDER HIST   │
            │ └───────┬────────┘     └───────┬────────┘
            │         └────────┬─────────────┘
            │                  │
            ▼◄─────────────────┘
    ┌────────────────┐
    │ ORDER REVIEW   │◄────────────────────────────┐
    └───────┬────────┘                             │
            │                                      │
            ├──────────────────────┐               │
            │                      ▼               │
            │              ┌────────────────┐      │
            │              │PRICING ADJUST  │──────┤
            │              └───────┬────────┘      │
            │                      │               │
            │                      ▼               │
            │              ┌────────────────┐      │
            │              │ APPROVAL REQ   │──────┘
            │              └────────────────┘
            ▼
    ┌────────────────┐
    │ SHIP DATE SEL  │
    └───────┬────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
┌─────────┐   ┌─────────┐
│DELIVERY │   │WILL-CALL│
│ CONFIG  │   │ CONFIG  │
└────┬────┘   └────┬────┘
     │             │
     └──────┬──────┘
            │
            ▼
    ┌────────────────┐
    │ PAYMENT SELECT │
    └───────┬────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
┌─────────┐   ┌─────────┐
│PAY NOW  │   │ON TERMS │
└────┬────┘   └────┬────┘
     │             │
     ▼             │
┌─────────┐        │
│PAYMENT  │        │
│PROCESS  │        │
└────┬────┘        │
     │             │
     └──────┬──────┘
            │
            ▼
    ┌────────────────┐
    │ CONFIRMATION   │
    └───────┬────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
┌─────────┐   ┌─────────┐
│ PRINT   │   │QUICK CUT│
│ OPTIONS │   │ NOTIFY  │
└────┬────┘   └─────────┘
     │
     ▼
┌─────────┐
│  IDLE   │
└─────────┘
```

---

## 3. Screen Sequence — Ordered Array

```json
{
  "screen_sequences": {
    "standard_order": [
      {
        "seq": 1,
        "screen_id": "CUSTOMER_LOOKUP",
        "name": "Customer Lookup",
        "required": true,
        "skip_conditions": ["customer_preselected", "walk_in_cash_sale"],
        "components": ["SearchBar", "CustomerList", "NewCustomerButton", "RecentCustomers"],
        "data_captured": ["customer_id"],
        "validation": ["customer_exists", "customer_active"],
        "avg_time_seconds": 15
      },
      {
        "seq": 2,
        "screen_id": "DIVISION_SELECT",
        "name": "Division Selection",
        "required": false,
        "show_conditions": ["customer.divisions.length > 1"],
        "components": ["DivisionList", "DivisionDetails", "ShipToSelector"],
        "data_captured": ["division_id", "ship_to_id"],
        "validation": ["division_active"],
        "avg_time_seconds": 8
      },
      {
        "seq": 3,
        "screen_id": "LINE_ENTRY",
        "name": "Line Entry",
        "required": true,
        "skip_conditions": [],
        "components": [
          "LineItemGrid",
          "ProductSearchButton",
          "ScanInput",
          "QuoteImportButton",
          "HistoryButton",
          "OrderTotals",
          "AvailabilityIndicators"
        ],
        "data_captured": ["line_items[]"],
        "validation": ["has_at_least_one_line", "all_lines_valid"],
        "avg_time_seconds": 120,
        "sub_screens": [
          {
            "screen_id": "PRODUCT_SEARCH",
            "name": "Product Search",
            "type": "modal",
            "components": ["SearchFilters", "ProductGrid", "ProductDetails", "AvailabilityCheck"]
          },
          {
            "screen_id": "CUT_CONFIGURATOR",
            "name": "Cut Configurator",
            "type": "modal",
            "components": ["MaterialSelector", "CutPatternBuilder", "DimensionInputs", "WasteCalculator", "PricePreview"]
          },
          {
            "screen_id": "QUOTE_LOOKUP",
            "name": "Quote Lookup",
            "type": "modal",
            "components": ["QuoteSearch", "QuoteList", "QuoteDetails", "ImportButton"]
          }
        ]
      },
      {
        "seq": 4,
        "screen_id": "ORDER_REVIEW",
        "name": "Order Review",
        "required": true,
        "skip_conditions": [],
        "components": [
          "CustomerSummary",
          "LineItemSummary",
          "PricingSummary",
          "DiscountDisplay",
          "TaxCalculation",
          "OrderTotal",
          "AdjustPricingButton",
          "EditLinesButton"
        ],
        "data_captured": ["pricing_confirmed"],
        "validation": ["pricing_complete", "credit_available"],
        "avg_time_seconds": 20,
        "sub_screens": [
          {
            "screen_id": "PRICING_ADJUSTMENT",
            "name": "Pricing Adjustment",
            "type": "modal",
            "components": ["LineDiscounts", "OrderDiscount", "PriceOverrides", "MarginDisplay", "ApprovalRequired"]
          }
        ]
      },
      {
        "seq": 5,
        "screen_id": "SHIP_DATE_SELECT",
        "name": "Ship Date Selection",
        "required": true,
        "skip_conditions": [],
        "components": [
          "DeliveryMethodToggle",
          "DatePicker",
          "TimeSlotPicker",
          "AvailabilityCalendar",
          "LeadTimeDisplay",
          "ExpressOptions"
        ],
        "data_captured": ["delivery_method", "requested_date", "requested_time"],
        "validation": ["date_is_valid", "date_is_achievable"],
        "avg_time_seconds": 15
      },
      {
        "seq": 6,
        "screen_id": "SHIPPING_CONFIG",
        "name": "Shipping Configuration",
        "required": false,
        "show_conditions": ["delivery_method == 'DELIVERY'"],
        "components": [
          "ShipToAddress",
          "CarrierSelector",
          "FreightTerms",
          "SpecialInstructions",
          "DeliveryNotes",
          "FreightQuote"
        ],
        "data_captured": ["ship_to_address", "carrier_id", "freight_terms", "instructions"],
        "validation": ["address_complete", "carrier_valid"],
        "avg_time_seconds": 25
      },
      {
        "seq": 6,
        "screen_id": "WILL_CALL_CONFIG",
        "name": "Will-Call Configuration",
        "required": false,
        "show_conditions": ["delivery_method == 'WILL_CALL'"],
        "components": [
          "PickupLocation",
          "PickupDate",
          "PickupTime",
          "AuthorizedPickupPersons",
          "VehicleInfo",
          "LoadingInstructions"
        ],
        "data_captured": ["pickup_location", "pickup_datetime", "authorized_persons[]", "vehicle_info"],
        "validation": ["pickup_location_valid", "pickup_time_available"],
        "avg_time_seconds": 20
      },
      {
        "seq": 7,
        "screen_id": "PAYMENT_SELECT",
        "name": "Payment Selection",
        "required": true,
        "skip_conditions": [],
        "components": [
          "PaymentMethodTabs",
          "TermsDisplay",
          "CreditAvailable",
          "AmountDue",
          "DepositRequired",
          "PayNowOption",
          "SplitPaymentOption"
        ],
        "data_captured": ["payment_method", "payment_terms", "deposit_amount"],
        "validation": ["payment_method_valid", "credit_check_passed"],
        "avg_time_seconds": 15
      },
      {
        "seq": 8,
        "screen_id": "PAYMENT_PROCESSING",
        "name": "Payment Processing",
        "required": false,
        "show_conditions": ["payment_now == true"],
        "components": [
          "PaymentAmountDisplay",
          "CardTerminal",
          "CashDrawer",
          "CheckCapture",
          "ChangeCalculator",
          "ReceiptOptions"
        ],
        "data_captured": ["payment_reference", "amount_tendered", "change_given"],
        "validation": ["payment_complete"],
        "avg_time_seconds": 45
      },
      {
        "seq": 9,
        "screen_id": "ORDER_CONFIRMATION",
        "name": "Order Confirmation",
        "required": true,
        "skip_conditions": [],
        "components": [
          "OrderNumber",
          "ConfirmationSummary",
          "EstimatedDelivery",
          "PrintOptions",
          "EmailOption",
          "NewOrderButton",
          "QuickCutNotification"
        ],
        "data_captured": ["print_selections", "email_confirmation"],
        "validation": [],
        "avg_time_seconds": 10
      }
    ],

    "quick_sale": [
      {
        "seq": 1,
        "screen_id": "QUICK_SALE_MAIN",
        "name": "Quick Sale",
        "required": true,
        "components": ["ScanInput", "ItemList", "RunningTotal", "CheckoutButton"],
        "data_captured": ["items[]"],
        "avg_time_seconds": 30
      },
      {
        "seq": 2,
        "screen_id": "QUICK_SALE_PAYMENT",
        "name": "Quick Payment",
        "required": true,
        "components": ["AmountDue", "PaymentButtons", "CardTerminal", "CashInput"],
        "data_captured": ["payment_method", "amount_tendered"],
        "avg_time_seconds": 20
      },
      {
        "seq": 3,
        "screen_id": "QUICK_SALE_RECEIPT",
        "name": "Receipt",
        "required": true,
        "components": ["ReceiptPreview", "PrintButton", "EmailButton", "DoneButton"],
        "data_captured": [],
        "avg_time_seconds": 5
      }
    ],

    "will_call_pickup": [
      {
        "seq": 1,
        "screen_id": "WILL_CALL_QUEUE",
        "name": "Pickup Queue",
        "required": true,
        "components": ["OrderList", "SearchFilter", "StatusFilter", "SelectButton"],
        "data_captured": ["selected_order_id"],
        "avg_time_seconds": 10
      },
      {
        "seq": 2,
        "screen_id": "WILL_CALL_VERIFY",
        "name": "Verify Pickup",
        "required": true,
        "components": ["OrderDetails", "CustomerPhoto", "IDVerification", "AuthorizedPersonCheck", "ProceedButton"],
        "data_captured": ["verified_by", "id_type", "id_number"],
        "avg_time_seconds": 30
      },
      {
        "seq": 3,
        "screen_id": "WILL_CALL_LOAD",
        "name": "Load Confirmation",
        "required": true,
        "components": ["ItemChecklist", "LoadingConfirmation", "SignatureCapture", "VehiclePhoto", "CompleteButton"],
        "data_captured": ["items_verified[]", "signature", "vehicle_photo", "loader_id"],
        "avg_time_seconds": 60
      },
      {
        "seq": 4,
        "screen_id": "WILL_CALL_COMPLETE",
        "name": "Pickup Complete",
        "required": true,
        "components": ["CompletionSummary", "DocumentsPrinted", "NextPickupButton", "DoneButton"],
        "data_captured": [],
        "avg_time_seconds": 10
      }
    ],

    "quote_to_order": [
      {
        "seq": 1,
        "screen_id": "QUOTE_SEARCH",
        "name": "Quote Search",
        "components": ["QuoteNumberInput", "CustomerFilter", "DateFilter", "QuoteList"],
        "data_captured": ["quote_id"],
        "avg_time_seconds": 15
      },
      {
        "seq": 2,
        "screen_id": "QUOTE_REVIEW",
        "name": "Quote Review",
        "components": ["QuoteDetails", "LineItems", "PricingExpiration", "EditButton", "ConvertButton"],
        "data_captured": ["conversion_confirmed"],
        "avg_time_seconds": 20
      },
      {
        "seq": 3,
        "screen_id": "CONVERTED_LINE_ENTRY",
        "name": "Verify Lines",
        "components": ["ImportedLines", "QuantityAdjust", "AvailabilityCheck", "PriceRefresh"],
        "data_captured": ["adjusted_lines[]"],
        "avg_time_seconds": 30
      }
    ]
  }
}
```

---

## 4. Data Capture — JSON Schema

```json
{
  "data_capture": {
    "pos_order": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "required": ["customer_id", "lines", "delivery_method", "payment_terms"],
      "properties": {
        "order_id": {
          "type": "string",
          "format": "uuid",
          "description": "System-generated order ID"
        },
        "order_number": {
          "type": "string",
          "pattern": "^SO-[0-9]{6,}$",
          "description": "Human-readable order number"
        },
        "order_type": {
          "type": "string",
          "enum": ["STANDARD", "QUICK_SALE", "WILL_CALL_CONVERT", "QUOTE_CONVERT", "REORDER"],
          "description": "Order origination type"
        },
        "pos_terminal_id": {
          "type": "string",
          "description": "Terminal where order was created"
        },
        "created_by": {
          "type": "string",
          "format": "uuid",
          "description": "User ID of order creator"
        },
        "created_at": {
          "type": "string",
          "format": "date-time"
        },

        "customer_id": {
          "type": "string",
          "format": "uuid",
          "description": "Customer account ID"
        },
        "customer_number": {
          "type": "string",
          "description": "Customer account number"
        },
        "customer_name": {
          "type": "string",
          "maxLength": 100
        },
        "customer_po": {
          "type": "string",
          "maxLength": 50,
          "description": "Customer's purchase order number"
        },
        "division_id": {
          "type": "string",
          "format": "uuid",
          "description": "Customer division/branch for billing"
        },

        "bill_to": {
          "type": "object",
          "properties": {
            "address_id": { "type": "string", "format": "uuid" },
            "name": { "type": "string" },
            "address_line_1": { "type": "string" },
            "address_line_2": { "type": "string" },
            "city": { "type": "string" },
            "state": { "type": "string", "pattern": "^[A-Z]{2}$" },
            "postal_code": { "type": "string" },
            "country": { "type": "string", "default": "US" }
          },
          "required": ["name", "address_line_1", "city", "state", "postal_code"]
        },

        "ship_to": {
          "type": "object",
          "properties": {
            "address_id": { "type": "string", "format": "uuid" },
            "name": { "type": "string" },
            "address_line_1": { "type": "string" },
            "address_line_2": { "type": "string" },
            "city": { "type": "string" },
            "state": { "type": "string", "pattern": "^[A-Z]{2}$" },
            "postal_code": { "type": "string" },
            "country": { "type": "string", "default": "US" },
            "contact_name": { "type": "string" },
            "contact_phone": { "type": "string" },
            "delivery_instructions": { "type": "string", "maxLength": 500 }
          },
          "required": ["name", "address_line_1", "city", "state", "postal_code"]
        },

        "lines": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "required": ["product_id", "quantity", "unit_price"],
            "properties": {
              "line_number": { "type": "integer", "minimum": 1 },
              "product_id": { "type": "string", "format": "uuid" },
              "product_code": { "type": "string" },
              "description": { "type": "string", "maxLength": 200 },
              
              "quantity": { "type": "number", "minimum": 0.001 },
              "quantity_uom": { 
                "type": "string", 
                "enum": ["EA", "LBS", "CWT", "TON", "FT", "IN", "SQ_FT", "LN_FT"] 
              },
              "pieces": { "type": "integer", "minimum": 0 },
              "weight_lbs": { "type": "number", "minimum": 0 },
              
              "dimensions": {
                "type": "object",
                "properties": {
                  "length": { "type": "number" },
                  "length_uom": { "type": "string", "enum": ["IN", "FT"] },
                  "width": { "type": "number" },
                  "width_uom": { "type": "string", "enum": ["IN", "FT"] },
                  "thickness": { "type": "number" },
                  "thickness_uom": { "type": "string", "enum": ["IN", "GA"] },
                  "od": { "type": "number" },
                  "id": { "type": "number" },
                  "wall": { "type": "number" }
                }
              },

              "processing": {
                "type": "object",
                "properties": {
                  "processing_required": { "type": "boolean" },
                  "processing_type": { 
                    "type": "string",
                    "enum": ["CUT_TO_LENGTH", "SHEAR", "SLIT", "SAW", "PLASMA", "LASER", "BEND", "DRILL", "NONE"]
                  },
                  "cut_pattern": {
                    "type": "object",
                    "properties": {
                      "pieces_per_length": { "type": "integer" },
                      "cut_lengths": { "type": "array", "items": { "type": "number" } },
                      "kerf_allowance": { "type": "number" },
                      "drop_disposition": { "type": "string", "enum": ["SCRAP", "RETURN", "REMNANT"] }
                    }
                  },
                  "special_instructions": { "type": "string", "maxLength": 500 },
                  "counter_cut": { "type": "boolean", "description": "Customer waiting for cut" }
                }
              },

              "pricing": {
                "type": "object",
                "required": ["unit_price", "extended_price"],
                "properties": {
                  "price_source": { 
                    "type": "string", 
                    "enum": ["LIST", "CONTRACT", "QUOTE", "MANUAL", "PROMO"] 
                  },
                  "list_price": { "type": "number", "minimum": 0 },
                  "unit_price": { "type": "number", "minimum": 0 },
                  "price_uom": { "type": "string" },
                  "discount_pct": { "type": "number", "minimum": 0, "maximum": 100 },
                  "discount_amount": { "type": "number", "minimum": 0 },
                  "extended_price": { "type": "number", "minimum": 0 },
                  "processing_charge": { "type": "number", "minimum": 0 },
                  "line_total": { "type": "number", "minimum": 0 },
                  "margin_pct": { "type": "number" },
                  "cost": { "type": "number", "minimum": 0 },
                  "override_reason": { "type": "string" },
                  "approved_by": { "type": "string", "format": "uuid" }
                }
              },

              "allocation": {
                "type": "object",
                "properties": {
                  "allocation_status": { 
                    "type": "string", 
                    "enum": ["NOT_ALLOCATED", "PARTIAL", "ALLOCATED", "BACKORDERED"] 
                  },
                  "allocated_from": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "inventory_id": { "type": "string", "format": "uuid" },
                        "location": { "type": "string" },
                        "quantity": { "type": "number" },
                        "heat_number": { "type": "string" }
                      }
                    }
                  },
                  "backorder_quantity": { "type": "number" },
                  "expected_date": { "type": "string", "format": "date" }
                }
              },

              "source_quote_id": { "type": "string", "format": "uuid" },
              "source_quote_line": { "type": "integer" },
              "notes": { "type": "string", "maxLength": 500 }
            }
          }
        },

        "delivery_method": {
          "type": "string",
          "enum": ["DELIVERY", "WILL_CALL", "SHIP_CARRIER", "CUSTOMER_PICKUP"]
        },

        "delivery_details": {
          "type": "object",
          "properties": {
            "requested_date": { "type": "string", "format": "date" },
            "requested_time": { "type": "string", "pattern": "^([01]?[0-9]|2[0-3]):[0-5][0-9]$" },
            "promise_date": { "type": "string", "format": "date" },
            "promise_time": { "type": "string" },
            "ship_complete": { "type": "boolean", "default": true },
            "carrier_id": { "type": "string", "format": "uuid" },
            "carrier_name": { "type": "string" },
            "service_level": { "type": "string" },
            "freight_terms": { 
              "type": "string", 
              "enum": ["PREPAID", "COLLECT", "THIRD_PARTY", "FOB_ORIGIN", "FOB_DEST"] 
            },
            "freight_account": { "type": "string" },
            "estimated_freight": { "type": "number" },
            "delivery_instructions": { "type": "string", "maxLength": 500 }
          }
        },

        "will_call_details": {
          "type": "object",
          "properties": {
            "pickup_location": { "type": "string" },
            "pickup_date": { "type": "string", "format": "date" },
            "pickup_time_window": { "type": "string" },
            "authorized_persons": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": { "type": "string" },
                  "phone": { "type": "string" },
                  "id_type": { "type": "string" }
                }
              }
            },
            "vehicle_type": { "type": "string" },
            "loading_requirements": { "type": "string" }
          }
        },

        "pricing_summary": {
          "type": "object",
          "properties": {
            "subtotal": { "type": "number", "minimum": 0 },
            "processing_total": { "type": "number", "minimum": 0 },
            "discount_total": { "type": "number", "minimum": 0 },
            "freight_charge": { "type": "number", "minimum": 0 },
            "tax_amount": { "type": "number", "minimum": 0 },
            "tax_rate": { "type": "number" },
            "tax_exempt": { "type": "boolean" },
            "tax_exempt_number": { "type": "string" },
            "order_total": { "type": "number", "minimum": 0 }
          }
        },

        "payment_terms": {
          "type": "string",
          "enum": ["NET_30", "NET_15", "NET_10", "DUE_ON_RECEIPT", "COD", "PREPAID", "CREDIT_CARD"]
        },

        "payment_details": {
          "type": "object",
          "properties": {
            "payment_method": { 
              "type": "string", 
              "enum": ["TERMS", "CASH", "CHECK", "CREDIT_CARD", "WIRE", "ACH"] 
            },
            "deposit_required": { "type": "boolean" },
            "deposit_amount": { "type": "number" },
            "deposit_paid": { "type": "boolean" },
            "deposit_reference": { "type": "string" },
            "card_last_four": { "type": "string", "pattern": "^[0-9]{4}$" },
            "card_type": { "type": "string" },
            "authorization_code": { "type": "string" },
            "check_number": { "type": "string" },
            "amount_tendered": { "type": "number" },
            "change_given": { "type": "number" }
          }
        },

        "credit_status": {
          "type": "object",
          "properties": {
            "credit_check_passed": { "type": "boolean" },
            "credit_limit": { "type": "number" },
            "available_credit": { "type": "number" },
            "order_uses_credit": { "type": "number" },
            "credit_hold_override": { "type": "boolean" },
            "override_by": { "type": "string", "format": "uuid" },
            "override_reason": { "type": "string" }
          }
        },

        "special_instructions": { "type": "string", "maxLength": 1000 },
        "internal_notes": { "type": "string", "maxLength": 1000 },
        
        "source_quote_id": { "type": "string", "format": "uuid" },
        "source_order_id": { "type": "string", "format": "uuid", "description": "For reorders" },
        
        "priority": {
          "type": "string",
          "enum": ["STANDARD", "RUSH", "HOT"],
          "default": "STANDARD"
        },

        "status": {
          "type": "string",
          "enum": ["DRAFT", "PENDING_APPROVAL", "CONFIRMED", "PROCESSING", "COMPLETE", "CANCELLED"]
        },

        "attachments": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "file_id": { "type": "string", "format": "uuid" },
              "file_name": { "type": "string" },
              "file_type": { "type": "string" },
              "description": { "type": "string" }
            }
          }
        }
      }
    },

    "quick_sale": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "required": ["items", "payment"],
      "properties": {
        "sale_id": { "type": "string", "format": "uuid" },
        "terminal_id": { "type": "string" },
        "cashier_id": { "type": "string", "format": "uuid" },
        "timestamp": { "type": "string", "format": "date-time" },
        "customer_type": { "type": "string", "enum": ["WALK_IN", "CASH_ACCOUNT", "KNOWN"] },
        "customer_id": { "type": "string", "format": "uuid" },
        "items": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "barcode": { "type": "string" },
              "product_id": { "type": "string", "format": "uuid" },
              "description": { "type": "string" },
              "quantity": { "type": "number" },
              "unit_price": { "type": "number" },
              "extended": { "type": "number" }
            }
          }
        },
        "subtotal": { "type": "number" },
        "tax": { "type": "number" },
        "total": { "type": "number" },
        "payment": {
          "type": "object",
          "properties": {
            "method": { "type": "string", "enum": ["CASH", "CARD", "CHECK"] },
            "amount_tendered": { "type": "number" },
            "change": { "type": "number" },
            "reference": { "type": "string" }
          }
        }
      }
    },

    "will_call_pickup": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "required": ["order_id", "pickup_verification", "items_released"],
      "properties": {
        "pickup_id": { "type": "string", "format": "uuid" },
        "order_id": { "type": "string", "format": "uuid" },
        "order_number": { "type": "string" },
        "customer_id": { "type": "string", "format": "uuid" },
        "pickup_timestamp": { "type": "string", "format": "date-time" },
        "pickup_verification": {
          "type": "object",
          "properties": {
            "verified_by_employee": { "type": "string", "format": "uuid" },
            "pickup_person_name": { "type": "string" },
            "id_type": { "type": "string", "enum": ["DRIVERS_LICENSE", "STATE_ID", "PASSPORT", "COMPANY_ID"] },
            "id_number_last_4": { "type": "string" },
            "authorization_confirmed": { "type": "boolean" },
            "photo_captured": { "type": "boolean" }
          }
        },
        "items_released": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "line_number": { "type": "integer" },
              "product_id": { "type": "string", "format": "uuid" },
              "quantity_released": { "type": "number" },
              "weight_released": { "type": "number" },
              "bundle_tags": { "type": "array", "items": { "type": "string" } },
              "verified": { "type": "boolean" }
            }
          }
        },
        "partial_pickup": { "type": "boolean" },
        "remaining_for_later": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "line_number": { "type": "integer" },
              "quantity_remaining": { "type": "number" }
            }
          }
        },
        "signature": {
          "type": "object",
          "properties": {
            "signature_data": { "type": "string", "description": "Base64 encoded signature" },
            "signer_name": { "type": "string" },
            "signed_at": { "type": "string", "format": "date-time" }
          }
        },
        "vehicle": {
          "type": "object",
          "properties": {
            "type": { "type": "string" },
            "license_plate": { "type": "string" },
            "photo_url": { "type": "string" }
          }
        },
        "loader_employee_id": { "type": "string", "format": "uuid" },
        "loading_dock": { "type": "string" },
        "documents_provided": {
          "type": "array",
          "items": { "type": "string", "enum": ["PACKING_LIST", "BOL", "MTR", "COC", "INVOICE"] }
        }
      }
    }
  }
}
```

---

## 5. Pricing Hooks — Integration Points

```json
{
  "pricing_hooks": {
    "price_lookup": {
      "id": "HOOK-PL-001",
      "name": "Product Price Lookup",
      "trigger": "product_added_to_line",
      "timing": "synchronous",
      "endpoint": "/api/pricing/lookup",
      "request": {
        "customer_id": "string",
        "product_id": "string",
        "quantity": "number",
        "quantity_uom": "string",
        "effective_date": "date",
        "processing_type": "string|null"
      },
      "response": {
        "price_source": "string",
        "list_price": "number",
        "customer_price": "number",
        "contract_id": "string|null",
        "contract_name": "string|null",
        "promo_id": "string|null",
        "promo_name": "string|null",
        "quantity_break_applied": "boolean",
        "tier_name": "string|null",
        "valid_until": "date",
        "min_margin_pct": "number",
        "cost": "number"
      },
      "fallback": "use_list_price",
      "cache_ttl_seconds": 300
    },

    "contract_price_check": {
      "id": "HOOK-PL-002",
      "name": "Contract Price Validation",
      "trigger": "customer_selected",
      "timing": "async_background",
      "endpoint": "/api/pricing/contracts",
      "request": {
        "customer_id": "string",
        "effective_date": "date"
      },
      "response": {
        "contracts": [
          {
            "contract_id": "string",
            "contract_name": "string",
            "valid_from": "date",
            "valid_to": "date",
            "product_groups": ["string"],
            "discount_type": "string",
            "discount_value": "number"
          }
        ]
      },
      "purpose": "Pre-load applicable contracts for pricing decisions"
    },

    "quantity_break_calculation": {
      "id": "HOOK-PL-003",
      "name": "Quantity Break Pricing",
      "trigger": "quantity_changed",
      "timing": "synchronous",
      "endpoint": "/api/pricing/quantity-breaks",
      "request": {
        "product_id": "string",
        "customer_id": "string",
        "quantity": "number",
        "quantity_uom": "string"
      },
      "response": {
        "breaks": [
          {
            "min_qty": "number",
            "max_qty": "number",
            "price": "number",
            "discount_pct": "number"
          }
        ],
        "applied_break": {
          "tier": "string",
          "price": "number",
          "savings": "number"
        },
        "next_break": {
          "qty_needed": "number",
          "additional_savings": "number"
        }
      }
    },

    "processing_charge_calculation": {
      "id": "HOOK-PL-004",
      "name": "Processing Charge Calculation",
      "trigger": "processing_configured",
      "timing": "synchronous",
      "endpoint": "/api/pricing/processing",
      "request": {
        "processing_type": "string",
        "material_type": "string",
        "thickness": "number",
        "width": "number",
        "cut_count": "number",
        "linear_inches": "number",
        "weight_lbs": "number",
        "customer_id": "string"
      },
      "response": {
        "base_charge": "number",
        "setup_charge": "number",
        "per_cut_charge": "number",
        "per_inch_charge": "number",
        "minimum_charge": "number",
        "calculated_charge": "number",
        "final_charge": "number",
        "customer_discount_applied": "number"
      },
      "pricing_rules": [
        { "rule": "MIN_CHARGE", "description": "Apply minimum processing charge if calculated < minimum" },
        { "rule": "SETUP_PER_GAUGE", "description": "Separate setup charge per gauge change" },
        { "rule": "RUSH_MULTIPLIER", "description": "Apply rush multiplier for counter cuts" }
      ]
    },

    "discount_validation": {
      "id": "HOOK-PL-005",
      "name": "Discount Validation",
      "trigger": "discount_applied",
      "timing": "synchronous",
      "endpoint": "/api/pricing/validate-discount",
      "request": {
        "user_id": "string",
        "line_id": "string",
        "original_price": "number",
        "requested_price": "number",
        "discount_type": "pct|amount",
        "discount_value": "number"
      },
      "response": {
        "approved": "boolean",
        "requires_approval": "boolean",
        "approval_level": "string|null",
        "margin_impact": "number",
        "new_margin_pct": "number",
        "below_floor": "boolean",
        "rejection_reason": "string|null"
      },
      "authority_levels": [
        { "role": "COUNTER_SALES", "max_discount_pct": 5, "max_line_discount": 100 },
        { "role": "INSIDE_SALES", "max_discount_pct": 10, "max_line_discount": 500 },
        { "role": "SALES_MANAGER", "max_discount_pct": 20, "max_line_discount": 2500 },
        { "role": "BRANCH_MANAGER", "max_discount_pct": 30, "max_line_discount": 10000 },
        { "role": "VP_SALES", "max_discount_pct": 50, "max_line_discount": null }
      ]
    },

    "order_discount_calculation": {
      "id": "HOOK-PL-006",
      "name": "Order-Level Discount",
      "trigger": "order_review_entered",
      "timing": "synchronous",
      "endpoint": "/api/pricing/order-discount",
      "request": {
        "customer_id": "string",
        "order_subtotal": "number",
        "order_weight": "number",
        "line_count": "number",
        "product_categories": ["string"]
      },
      "response": {
        "volume_discount_eligible": "boolean",
        "volume_discount_pct": "number",
        "promo_applicable": "boolean",
        "promo_discount": "number",
        "loyalty_discount": "number",
        "suggested_discount": "number",
        "max_allowable_discount": "number"
      }
    },

    "freight_quote": {
      "id": "HOOK-PL-007",
      "name": "Freight Quote",
      "trigger": "shipping_configured",
      "timing": "async_user_wait",
      "endpoint": "/api/pricing/freight",
      "request": {
        "origin_zip": "string",
        "destination": {
          "address": "string",
          "city": "string",
          "state": "string",
          "zip": "string"
        },
        "weight_lbs": "number",
        "pieces": "number",
        "dimensions": {
          "max_length": "number",
          "max_width": "number"
        },
        "carrier_preference": "string|null",
        "delivery_date": "date|null"
      },
      "response": {
        "quotes": [
          {
            "carrier_id": "string",
            "carrier_name": "string",
            "service": "string",
            "transit_days": "number",
            "delivery_date": "date",
            "cost": "number",
            "markup": "number",
            "customer_charge": "number"
          }
        ],
        "recommended": "string",
        "our_truck_available": "boolean",
        "our_truck_cost": "number"
      },
      "timeout_seconds": 30,
      "fallback": "use_rate_table"
    },

    "tax_calculation": {
      "id": "HOOK-PL-008",
      "name": "Tax Calculation",
      "trigger": "order_totaled",
      "timing": "synchronous",
      "endpoint": "/api/pricing/tax",
      "request": {
        "customer_id": "string",
        "ship_to_address": "object",
        "line_items": [
          {
            "product_id": "string",
            "tax_category": "string",
            "amount": "number"
          }
        ],
        "freight_amount": "number",
        "processing_amount": "number"
      },
      "response": {
        "tax_exempt": "boolean",
        "exempt_reason": "string|null",
        "exempt_certificate": "string|null",
        "line_taxes": [
          {
            "line_number": "number",
            "taxable_amount": "number",
            "tax_rate": "number",
            "tax_amount": "number",
            "jurisdiction": "string"
          }
        ],
        "freight_taxable": "boolean",
        "freight_tax": "number",
        "total_tax": "number"
      },
      "integration": "avalara|vertex|internal"
    },

    "margin_analysis": {
      "id": "HOOK-PL-009",
      "name": "Real-time Margin Analysis",
      "trigger": "line_price_changed|order_review",
      "timing": "synchronous",
      "endpoint": "/api/pricing/margin",
      "request": {
        "lines": [
          {
            "product_id": "string",
            "quantity": "number",
            "sell_price": "number",
            "processing_charge": "number"
          }
        ]
      },
      "response": {
        "line_margins": [
          {
            "line_number": "number",
            "cost": "number",
            "revenue": "number",
            "margin_amount": "number",
            "margin_pct": "number",
            "below_target": "boolean",
            "below_floor": "boolean"
          }
        ],
        "order_margin": {
          "total_cost": "number",
          "total_revenue": "number",
          "margin_amount": "number",
          "margin_pct": "number"
        },
        "warnings": ["string"]
      }
    },

    "price_override_approval": {
      "id": "HOOK-PL-010",
      "name": "Price Override Approval Request",
      "trigger": "override_requested",
      "timing": "async_approval",
      "endpoint": "/api/pricing/approval-request",
      "request": {
        "order_id": "string",
        "line_id": "string",
        "requestor_id": "string",
        "original_price": "number",
        "requested_price": "number",
        "justification": "string",
        "customer_id": "string"
      },
      "response": {
        "request_id": "string",
        "status": "PENDING|APPROVED|REJECTED",
        "approver_id": "string|null",
        "approved_price": "number|null",
        "notes": "string|null"
      },
      "notification": {
        "channel": ["in_app", "email", "sms"],
        "escalation_minutes": 15
      }
    },

    "commodity_price_update": {
      "id": "HOOK-PL-011",
      "name": "Commodity Price Check",
      "trigger": "session_start|price_refresh",
      "timing": "async_background",
      "endpoint": "/api/pricing/commodity-rates",
      "request": {
        "effective_date": "date"
      },
      "response": {
        "base_prices": [
          {
            "commodity": "string",
            "grade": "string",
            "form": "string",
            "price_per_cwt": "number",
            "effective_date": "date",
            "trend": "up|down|stable"
          }
        ],
        "last_updated": "datetime"
      },
      "cache_ttl_seconds": 3600,
      "alert_on_change_pct": 5
    }
  }
}
```

---

## 6. Division Logic — Decision Table

| Condition ID | Customer Type | Division Count | Ship-To Count | Order Source | Action | Division Selection | Ship-To Selection | Tax Jurisdiction |
|--------------|---------------|----------------|---------------|--------------|--------|-------------------|-------------------|------------------|
| DIV-001 | Single Location | 1 | 1 | POS | Auto-select | Use only division | Use only ship-to | Ship-to state |
| DIV-002 | Single Location | 1 | >1 | POS | Prompt ship-to | Use only division | User selects | Selected ship-to state |
| DIV-003 | Multi-Division | >1 | Any | POS | Prompt division | User selects | Filter by division | Selected ship-to state |
| DIV-004 | Multi-Division | >1 | >1 per div | POS | Prompt both | User selects | User selects (filtered) | Selected ship-to state |
| DIV-005 | National Account | >1 | >1 | POS | Prompt division | User selects | User selects | Selected ship-to state |
| DIV-006 | Job Account | 1 | Many (jobs) | POS | Prompt job | Use only division | Select by job name | Job site state |
| DIV-007 | Walk-In Cash | 0 | 0 | Quick Sale | Cash account | System cash acct | Counter pickup | Seller state |
| DIV-008 | Will-Call | Any | Any | Will-Call | From order | From original order | Pickup location | Pickup location state |
| DIV-009 | Quote Convert | Any | Any | Quote | From quote | From quote (editable) | From quote (editable) | As quoted |
| DIV-010 | Reorder | Any | Any | History | From original | From original (editable) | From original (editable) | Verify current |

### Division Selection Logic Pseudocode

```pseudocode
FUNCTION DetermineDivisionFlow(customer, order_source):
  
  IF order_source == "QUICK_SALE" AND customer IS NULL:
    RETURN {
      division: SYSTEM_CASH_ACCOUNT,
      ship_to: COUNTER_PICKUP,
      skip_selection: TRUE
    }
  
  IF order_source == "WILL_CALL":
    original_order = GetOriginalOrder(order_id)
    RETURN {
      division: original_order.division,
      ship_to: original_order.ship_to,
      skip_selection: TRUE,
      locked: TRUE
    }
  
  IF order_source == "QUOTE_CONVERT":
    quote = GetQuote(quote_id)
    RETURN {
      division: quote.division,
      ship_to: quote.ship_to,
      skip_selection: FALSE,
      editable: TRUE,
      defaults_from: "quote"
    }
  
  divisions = GetCustomerDivisions(customer.id)
  
  IF divisions.length == 0:
    RETURN {
      error: "NO_DIVISION",
      action: "CREATE_DIVISION"
    }
  
  IF divisions.length == 1:
    single_div = divisions[0]
    ship_tos = GetDivisionShipTos(single_div.id)
    
    IF ship_tos.length == 1:
      RETURN {
        division: single_div,
        ship_to: ship_tos[0],
        skip_selection: TRUE
      }
    ELSE:
      RETURN {
        division: single_div,
        ship_to: NULL,
        skip_selection: FALSE,
        prompt: "SHIP_TO_ONLY",
        ship_to_options: ship_tos
      }
  
  // Multiple divisions
  RETURN {
    division: NULL,
    ship_to: NULL,
    skip_selection: FALSE,
    prompt: "DIVISION_AND_SHIP_TO",
    division_options: divisions,
    default_division: GetDefaultDivision(customer.id),
    remember_selection: TRUE
  }


FUNCTION DetermineTaxJurisdiction(division, ship_to, delivery_method):
  
  IF delivery_method == "WILL_CALL":
    RETURN {
      jurisdiction: PICKUP_LOCATION.state,
      nexus: TRUE,
      tax_type: "origin_based"
    }
  
  IF delivery_method IN ["DELIVERY", "SHIP_CARRIER"]:
    RETURN {
      jurisdiction: ship_to.state,
      nexus: HasNexus(ship_to.state),
      tax_type: GetStateTaxType(ship_to.state)  // origin vs destination
    }
  
  // Default
  RETURN {
    jurisdiction: SELLER_LOCATION.state,
    nexus: TRUE,
    tax_type: "origin_based"
  }


FUNCTION FilterShipTosByDivision(division_id, ship_tos):
  filtered = []
  
  FOR EACH ship_to IN ship_tos:
    IF ship_to.division_id == division_id:
      filtered.APPEND(ship_to)
    ELSE IF ship_to.shared == TRUE:
      filtered.APPEND(ship_to)
    ELSE IF ship_to.all_divisions == TRUE:
      filtered.APPEND(ship_to)
  
  // Sort by usage frequency
  filtered = filtered.SORT_BY(usage_count, DESC)
  
  RETURN filtered
```

---

## 7. Validation Rules — List

```json
{
  "validation_rules": {
    "customer_validation": [
      {
        "rule_id": "CUST-001",
        "field": "customer_id",
        "rule": "required",
        "message": "Customer is required",
        "severity": "error",
        "applies_to": ["STANDARD_ORDER"]
      },
      {
        "rule_id": "CUST-002",
        "field": "customer.status",
        "rule": "equals",
        "value": "ACTIVE",
        "message": "Customer account is not active",
        "severity": "error",
        "override": "MANAGER"
      },
      {
        "rule_id": "CUST-003",
        "field": "customer.credit_hold",
        "rule": "equals",
        "value": false,
        "message": "Customer is on credit hold",
        "severity": "warning",
        "override": "CREDIT_MANAGER",
        "alternative_action": "CASH_ONLY"
      },
      {
        "rule_id": "CUST-004",
        "field": "customer.days_past_due",
        "rule": "less_than",
        "value": 60,
        "message": "Customer has invoices over 60 days past due",
        "severity": "warning",
        "override": "CREDIT_MANAGER"
      },
      {
        "rule_id": "CUST-005",
        "field": "customer_po",
        "rule": "required_if",
        "condition": "customer.po_required == true",
        "message": "Customer PO number is required for this customer",
        "severity": "error"
      },
      {
        "rule_id": "CUST-006",
        "field": "customer_po",
        "rule": "unique_per_customer",
        "message": "This PO number has been used before",
        "severity": "warning"
      }
    ],

    "line_item_validation": [
      {
        "rule_id": "LINE-001",
        "field": "lines",
        "rule": "min_count",
        "value": 1,
        "message": "At least one line item is required",
        "severity": "error"
      },
      {
        "rule_id": "LINE-002",
        "field": "line.product_id",
        "rule": "required",
        "message": "Product is required for each line",
        "severity": "error"
      },
      {
        "rule_id": "LINE-003",
        "field": "line.product.status",
        "rule": "equals",
        "value": "ACTIVE",
        "message": "Product {product_code} is not active",
        "severity": "error"
      },
      {
        "rule_id": "LINE-004",
        "field": "line.quantity",
        "rule": "greater_than",
        "value": 0,
        "message": "Quantity must be greater than zero",
        "severity": "error"
      },
      {
        "rule_id": "LINE-005",
        "field": "line.quantity",
        "rule": "less_than_equal",
        "value": "line.product.max_order_qty",
        "message": "Quantity exceeds maximum order quantity",
        "severity": "warning",
        "override": "SALES_MANAGER"
      },
      {
        "rule_id": "LINE-006",
        "field": "line.unit_price",
        "rule": "greater_than",
        "value": 0,
        "message": "Price must be greater than zero",
        "severity": "error"
      },
      {
        "rule_id": "LINE-007",
        "field": "line.margin_pct",
        "rule": "greater_than_equal",
        "value": "product.min_margin_pct",
        "message": "Price is below minimum margin ({min_margin}%)",
        "severity": "warning",
        "override": "SALES_MANAGER"
      },
      {
        "rule_id": "LINE-008",
        "field": "line.margin_pct",
        "rule": "greater_than_equal",
        "value": 0,
        "message": "Price is below cost",
        "severity": "error",
        "override": "BRANCH_MANAGER"
      }
    ],

    "inventory_validation": [
      {
        "rule_id": "INV-001",
        "field": "line.allocated_qty",
        "rule": "greater_than_equal",
        "value": "line.quantity",
        "message": "Insufficient inventory for {product_code}",
        "severity": "warning",
        "allow_backorder": true
      },
      {
        "rule_id": "INV-002",
        "field": "line.allocation_status",
        "rule": "not_equals",
        "value": "RESERVED_OTHER",
        "message": "Material is reserved for another order",
        "severity": "warning"
      },
      {
        "rule_id": "INV-003",
        "field": "line.heat_number",
        "rule": "required_if",
        "condition": "customer.requires_heat_number == true",
        "message": "Heat number required for this customer",
        "severity": "error"
      },
      {
        "rule_id": "INV-004",
        "field": "line.mtr_available",
        "rule": "equals",
        "value": true,
        "condition": "customer.requires_mtr == true",
        "message": "MTR not available for this material",
        "severity": "warning"
      }
    ],

    "processing_validation": [
      {
        "rule_id": "PROC-001",
        "field": "line.processing.cut_length",
        "rule": "less_than_equal",
        "value": "source_material.length",
        "message": "Cut length exceeds material length",
        "severity": "error"
      },
      {
        "rule_id": "PROC-002",
        "field": "line.processing.cut_length",
        "rule": "greater_than_equal",
        "value": "work_center.min_cut_length",
        "message": "Cut length below minimum ({min_length}\")",
        "severity": "error"
      },
      {
        "rule_id": "PROC-003",
        "field": "line.processing.cut_count",
        "rule": "feasibility_check",
        "message": "Requested cuts not feasible from available material",
        "severity": "error"
      },
      {
        "rule_id": "PROC-004",
        "field": "line.processing.thickness",
        "rule": "less_than_equal",
        "value": "work_center.max_thickness",
        "message": "Thickness exceeds equipment capacity",
        "severity": "error"
      },
      {
        "rule_id": "PROC-005",
        "field": "line.processing.counter_cut",
        "rule": "capacity_check",
        "message": "Quick cut station not available",
        "severity": "warning",
        "alternative": "Schedule for later"
      }
    ],

    "pricing_validation": [
      {
        "rule_id": "PRC-001",
        "field": "line.discount_pct",
        "rule": "less_than_equal",
        "value": "user.max_discount_authority",
        "message": "Discount exceeds your authority ({max_discount}%)",
        "severity": "error",
        "override": "HIGHER_AUTHORITY"
      },
      {
        "rule_id": "PRC-002",
        "field": "order.total_discount",
        "rule": "less_than_equal",
        "value": "user.max_order_discount",
        "message": "Total order discount exceeds your authority",
        "severity": "error",
        "override": "HIGHER_AUTHORITY"
      },
      {
        "rule_id": "PRC-003",
        "field": "line.price_override",
        "rule": "within_range",
        "value": ["-20%", "+50%"],
        "message": "Price adjustment outside acceptable range",
        "severity": "error",
        "override": "BRANCH_MANAGER"
      },
      {
        "rule_id": "PRC-004",
        "field": "quote.expiry_date",
        "rule": "greater_than_equal",
        "value": "TODAY",
        "message": "Quote has expired. Prices may have changed.",
        "severity": "warning",
        "action": "REPRICE"
      }
    ],

    "credit_validation": [
      {
        "rule_id": "CRD-001",
        "field": "order.total",
        "rule": "less_than_equal",
        "value": "customer.available_credit",
        "message": "Order exceeds available credit (Available: ${available})",
        "severity": "warning",
        "override": "CREDIT_MANAGER",
        "alternative_action": "DEPOSIT_REQUIRED"
      },
      {
        "rule_id": "CRD-002",
        "field": "customer.credit_limit",
        "rule": "greater_than",
        "value": 0,
        "message": "Customer has no credit limit established",
        "severity": "error",
        "alternative_action": "PREPAY_ONLY"
      },
      {
        "rule_id": "CRD-003",
        "field": "customer.ar_balance",
        "rule": "less_than",
        "value": "customer.credit_limit * 0.9",
        "message": "Customer approaching credit limit",
        "severity": "info"
      },
      {
        "rule_id": "CRD-004",
        "field": "order.deposit_amount",
        "rule": "greater_than_equal",
        "value": "order.required_deposit",
        "condition": "order.deposit_required == true",
        "message": "Deposit of ${required_deposit} required",
        "severity": "error"
      }
    ],

    "delivery_validation": [
      {
        "rule_id": "DEL-001",
        "field": "delivery.requested_date",
        "rule": "greater_than_equal",
        "value": "calculated_lead_time_date",
        "message": "Requested date is before achievable date ({earliest_date})",
        "severity": "warning",
        "override": "SALES_MANAGER",
        "action": "SET_RUSH_PRIORITY"
      },
      {
        "rule_id": "DEL-002",
        "field": "ship_to.address",
        "rule": "complete",
        "message": "Ship-to address is incomplete",
        "severity": "error"
      },
      {
        "rule_id": "DEL-003",
        "field": "ship_to.state",
        "rule": "serviceable",
        "message": "We do not deliver to this location",
        "severity": "error",
        "alternative": "SHIP_VIA_CARRIER"
      },
      {
        "rule_id": "DEL-004",
        "field": "delivery.carrier_id",
        "rule": "required_if",
        "condition": "delivery_method == 'SHIP_CARRIER'",
        "message": "Carrier selection is required",
        "severity": "error"
      },
      {
        "rule_id": "DEL-005",
        "field": "will_call.authorized_persons",
        "rule": "min_count",
        "value": 1,
        "condition": "delivery_method == 'WILL_CALL'",
        "message": "At least one authorized pickup person required",
        "severity": "error"
      }
    ],

    "payment_validation": [
      {
        "rule_id": "PAY-001",
        "field": "payment.method",
        "rule": "required",
        "message": "Payment method is required",
        "severity": "error"
      },
      {
        "rule_id": "PAY-002",
        "field": "payment.card_authorization",
        "rule": "valid",
        "condition": "payment.method == 'CREDIT_CARD'",
        "message": "Card authorization failed",
        "severity": "error"
      },
      {
        "rule_id": "PAY-003",
        "field": "payment.check_number",
        "rule": "required_if",
        "condition": "payment.method == 'CHECK'",
        "message": "Check number is required",
        "severity": "error"
      },
      {
        "rule_id": "PAY-004",
        "field": "payment.amount_tendered",
        "rule": "greater_than_equal",
        "value": "order.amount_due",
        "condition": "payment.method IN ['CASH', 'CHECK']",
        "message": "Insufficient payment amount",
        "severity": "error"
      },
      {
        "rule_id": "PAY-005",
        "field": "customer.payment_terms",
        "rule": "in_list",
        "value": ["NET_30", "NET_15", "NET_10"],
        "condition": "payment.method == 'TERMS'",
        "message": "Customer not approved for terms payment",
        "severity": "error",
        "alternative_action": "PREPAY"
      }
    ],

    "will_call_validation": [
      {
        "rule_id": "WC-001",
        "field": "pickup.person_name",
        "rule": "in_list",
        "value": "order.authorized_persons[].name",
        "message": "Person not authorized for pickup",
        "severity": "warning",
        "override": "MANAGER"
      },
      {
        "rule_id": "WC-002",
        "field": "pickup.id_verified",
        "rule": "equals",
        "value": true,
        "message": "ID verification required",
        "severity": "error"
      },
      {
        "rule_id": "WC-003",
        "field": "pickup.items_verified",
        "rule": "all_true",
        "message": "All items must be verified before release",
        "severity": "error"
      },
      {
        "rule_id": "WC-004",
        "field": "pickup.signature",
        "rule": "required",
        "message": "Signature is required for pickup",
        "severity": "error"
      },
      {
        "rule_id": "WC-005",
        "field": "order.payment_status",
        "rule": "equals",
        "value": "PAID",
        "condition": "order.payment_terms == 'PREPAID'",
        "message": "Payment must be received before release",
        "severity": "error"
      }
    ],

    "quick_sale_validation": [
      {
        "rule_id": "QS-001",
        "field": "items",
        "rule": "min_count",
        "value": 1,
        "message": "Add at least one item",
        "severity": "error"
      },
      {
        "rule_id": "QS-002",
        "field": "item.barcode",
        "rule": "exists_in_system",
        "message": "Unknown barcode",
        "severity": "error"
      },
      {
        "rule_id": "QS-003",
        "field": "item.inventory",
        "rule": "available",
        "message": "Item not in stock",
        "severity": "error"
      },
      {
        "rule_id": "QS-004",
        "field": "payment.amount",
        "rule": "greater_than_equal",
        "value": "sale.total",
        "message": "Payment must cover total amount",
        "severity": "error"
      }
    ],

    "order_level_validation": [
      {
        "rule_id": "ORD-001",
        "field": "order.total",
        "rule": "greater_than_equal",
        "value": "system.min_order_value",
        "message": "Order below minimum order value (${min_value})",
        "severity": "warning"
      },
      {
        "rule_id": "ORD-002",
        "field": "order.weight",
        "rule": "less_than_equal",
        "value": "delivery.max_weight",
        "message": "Order weight exceeds delivery capacity",
        "severity": "error",
        "action": "SPLIT_DELIVERY"
      },
      {
        "rule_id": "ORD-003",
        "field": "order.priority",
        "rule": "authorized",
        "value": ["RUSH", "HOT"],
        "message": "You are not authorized to set this priority",
        "severity": "error",
        "override": "MANAGER"
      },
      {
        "rule_id": "ORD-004",
        "field": "order.special_instructions",
        "rule": "max_length",
        "value": 1000,
        "message": "Instructions too long (max 1000 characters)",
        "severity": "error"
      }
    ]
  }
}
```

---

*Document generated for AI-build Phase 07: Order Intake & POS*
