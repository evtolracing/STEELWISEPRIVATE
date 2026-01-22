/**
 * POS Screen Sequences & Definitions
 * 
 * Defines the screen-by-screen guided flows for POS order intake.
 * Based on 42-AI-ORDER-INTAKE-POS.md Section 3.
 */

// ============================================
// SCREEN TYPE DEFINITIONS
// ============================================

export const ScreenType = {
  MAIN: 'main',
  MODAL: 'modal',
  DRAWER: 'drawer',
  OVERLAY: 'overlay'
};

export const ScreenStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  ERROR: 'error'
};

// ============================================
// COMPONENT LIBRARY
// ============================================

/**
 * Reusable component definitions for POS screens
 */
export const POSComponents = {
  // Customer Components
  SearchBar: { id: 'SearchBar', type: 'input', label: 'Search', icon: 'search' },
  CustomerList: { id: 'CustomerList', type: 'list', selectable: true },
  NewCustomerButton: { id: 'NewCustomerButton', type: 'button', variant: 'secondary', label: 'New Customer' },
  RecentCustomers: { id: 'RecentCustomers', type: 'list', limit: 5, label: 'Recent Customers' },
  CustomerSummary: { id: 'CustomerSummary', type: 'card', fields: ['name', 'account', 'credit'] },
  
  // Division Components
  DivisionList: { id: 'DivisionList', type: 'list', selectable: true },
  DivisionDetails: { id: 'DivisionDetails', type: 'card' },
  ShipToSelector: { id: 'ShipToSelector', type: 'select' },
  
  // Line Entry Components
  LineItemGrid: { id: 'LineItemGrid', type: 'grid', editable: true, sortable: true },
  ProductSearchButton: { id: 'ProductSearchButton', type: 'button', icon: 'search', label: 'Search Products' },
  ScanInput: { id: 'ScanInput', type: 'input', icon: 'barcode', placeholder: 'Scan or enter SKU' },
  QuoteImportButton: { id: 'QuoteImportButton', type: 'button', icon: 'file-import', label: 'From Quote' },
  HistoryButton: { id: 'HistoryButton', type: 'button', icon: 'history', label: 'Reorder' },
  OrderTotals: { id: 'OrderTotals', type: 'summary', fields: ['subtotal', 'tax', 'freight', 'total'] },
  AvailabilityIndicators: { id: 'AvailabilityIndicators', type: 'indicators' },
  
  // Product Search Components
  SearchFilters: { id: 'SearchFilters', type: 'filters', fields: ['grade', 'form', 'thickness', 'width'] },
  ProductGrid: { id: 'ProductGrid', type: 'grid', selectable: true },
  ProductDetails: { id: 'ProductDetails', type: 'panel' },
  AvailabilityCheck: { id: 'AvailabilityCheck', type: 'indicator' },
  
  // Cut Configurator Components
  MaterialSelector: { id: 'MaterialSelector', type: 'select', label: 'Source Material' },
  CutPatternBuilder: { id: 'CutPatternBuilder', type: 'custom', component: 'CutPatternBuilder' },
  DimensionInputs: { id: 'DimensionInputs', type: 'form', fields: ['length', 'width', 'pieces'] },
  WasteCalculator: { id: 'WasteCalculator', type: 'display', realtime: true },
  PricePreview: { id: 'PricePreview', type: 'summary' },
  
  // Order Review Components
  LineItemSummary: { id: 'LineItemSummary', type: 'table', readonly: true },
  PricingSummary: { id: 'PricingSummary', type: 'summary' },
  DiscountDisplay: { id: 'DiscountDisplay', type: 'list' },
  TaxCalculation: { id: 'TaxCalculation', type: 'display' },
  OrderTotal: { id: 'OrderTotal', type: 'display', highlight: true },
  AdjustPricingButton: { id: 'AdjustPricingButton', type: 'button', label: 'Adjust Pricing' },
  EditLinesButton: { id: 'EditLinesButton', type: 'button', label: 'Edit Lines' },
  
  // Pricing Adjustment Components
  LineDiscounts: { id: 'LineDiscounts', type: 'form' },
  OrderDiscount: { id: 'OrderDiscount', type: 'form' },
  PriceOverrides: { id: 'PriceOverrides', type: 'form' },
  MarginDisplay: { id: 'MarginDisplay', type: 'indicator', warning: true },
  ApprovalRequired: { id: 'ApprovalRequired', type: 'alert' },
  
  // Ship Date Components
  DeliveryMethodToggle: { id: 'DeliveryMethodToggle', type: 'toggle', options: ['DELIVERY', 'WILL_CALL'] },
  DatePicker: { id: 'DatePicker', type: 'datepicker' },
  TimeSlotPicker: { id: 'TimeSlotPicker', type: 'select' },
  AvailabilityCalendar: { id: 'AvailabilityCalendar', type: 'calendar' },
  LeadTimeDisplay: { id: 'LeadTimeDisplay', type: 'display' },
  ExpressOptions: { id: 'ExpressOptions', type: 'checkbox' },
  
  // Shipping Config Components
  ShipToAddress: { id: 'ShipToAddress', type: 'address-form' },
  CarrierSelector: { id: 'CarrierSelector', type: 'select' },
  FreightTerms: { id: 'FreightTerms', type: 'radio', options: ['PREPAID', 'COLLECT', 'THIRD_PARTY'] },
  SpecialInstructions: { id: 'SpecialInstructions', type: 'textarea' },
  DeliveryNotes: { id: 'DeliveryNotes', type: 'textarea' },
  FreightQuote: { id: 'FreightQuote', type: 'display' },
  
  // Will-Call Config Components
  PickupLocation: { id: 'PickupLocation', type: 'select' },
  PickupDate: { id: 'PickupDate', type: 'datepicker' },
  PickupTime: { id: 'PickupTime', type: 'timepicker' },
  AuthorizedPickupPersons: { id: 'AuthorizedPickupPersons', type: 'list', editable: true },
  VehicleInfo: { id: 'VehicleInfo', type: 'form', fields: ['type', 'plate', 'driver'] },
  LoadingInstructions: { id: 'LoadingInstructions', type: 'textarea' },
  
  // Payment Components
  PaymentMethodTabs: { id: 'PaymentMethodTabs', type: 'tabs', options: ['TERMS', 'CARD', 'CASH', 'CHECK'] },
  TermsDisplay: { id: 'TermsDisplay', type: 'display' },
  CreditAvailable: { id: 'CreditAvailable', type: 'display' },
  AmountDue: { id: 'AmountDue', type: 'display', highlight: true },
  DepositRequired: { id: 'DepositRequired', type: 'input', type: 'currency' },
  PayNowOption: { id: 'PayNowOption', type: 'checkbox' },
  SplitPaymentOption: { id: 'SplitPaymentOption', type: 'button' },
  
  // Payment Processing Components
  PaymentAmountDisplay: { id: 'PaymentAmountDisplay', type: 'display', large: true },
  CardTerminal: { id: 'CardTerminal', type: 'custom', component: 'CardTerminal' },
  CashDrawer: { id: 'CashDrawer', type: 'custom', component: 'CashDrawer' },
  CheckCapture: { id: 'CheckCapture', type: 'custom', component: 'CheckCapture' },
  ChangeCalculator: { id: 'ChangeCalculator', type: 'display' },
  ReceiptOptions: { id: 'ReceiptOptions', type: 'checkbox-group' },
  
  // Confirmation Components
  OrderNumber: { id: 'OrderNumber', type: 'display', large: true, copyable: true },
  ConfirmationSummary: { id: 'ConfirmationSummary', type: 'summary' },
  EstimatedDelivery: { id: 'EstimatedDelivery', type: 'display' },
  PrintOptions: { id: 'PrintOptions', type: 'button-group' },
  EmailOption: { id: 'EmailOption', type: 'input', inputType: 'email' },
  NewOrderButton: { id: 'NewOrderButton', type: 'button', variant: 'primary', label: 'New Order' },
  QuickCutNotification: { id: 'QuickCutNotification', type: 'alert', variant: 'warning' },
  
  // Will-Call Pickup Components
  OrderList: { id: 'OrderList', type: 'list', selectable: true },
  StatusFilter: { id: 'StatusFilter', type: 'select' },
  SelectButton: { id: 'SelectButton', type: 'button', label: 'Select' },
  OrderDetails: { id: 'OrderDetails', type: 'card' },
  CustomerPhoto: { id: 'CustomerPhoto', type: 'image' },
  IDVerification: { id: 'IDVerification', type: 'form', fields: ['id_type', 'id_number'] },
  AuthorizedPersonCheck: { id: 'AuthorizedPersonCheck', type: 'checkbox' },
  ProceedButton: { id: 'ProceedButton', type: 'button', variant: 'primary' },
  ItemChecklist: { id: 'ItemChecklist', type: 'checklist' },
  LoadingConfirmation: { id: 'LoadingConfirmation', type: 'checkbox' },
  SignatureCapture: { id: 'SignatureCapture', type: 'custom', component: 'SignaturePad' },
  VehiclePhoto: { id: 'VehiclePhoto', type: 'custom', component: 'Camera' },
  CompleteButton: { id: 'CompleteButton', type: 'button', variant: 'success' },
  CompletionSummary: { id: 'CompletionSummary', type: 'summary' },
  DocumentsPrinted: { id: 'DocumentsPrinted', type: 'checklist' },
  NextPickupButton: { id: 'NextPickupButton', type: 'button' },
  DoneButton: { id: 'DoneButton', type: 'button', variant: 'primary' },
  
  // Quick Sale Components
  ItemList: { id: 'ItemList', type: 'list', editable: true },
  RunningTotal: { id: 'RunningTotal', type: 'display', realtime: true },
  CheckoutButton: { id: 'CheckoutButton', type: 'button', variant: 'primary', label: 'Checkout' },
  PaymentButtons: { id: 'PaymentButtons', type: 'button-group' },
  CashInput: { id: 'CashInput', type: 'input', inputType: 'currency' },
  ReceiptPreview: { id: 'ReceiptPreview', type: 'preview' },
  PrintButton: { id: 'PrintButton', type: 'button', icon: 'print' },
  EmailButton: { id: 'EmailButton', type: 'button', icon: 'email' }
};

// ============================================
// VALIDATION RULES
// ============================================

export const ValidationRules = {
  customer_exists: {
    id: 'customer_exists',
    message: 'Customer must be selected',
    validate: (ctx) => ctx.customer?.id != null
  },
  customer_active: {
    id: 'customer_active',
    message: 'Customer account is not active',
    validate: (ctx) => ctx.customer?.isActive === true
  },
  division_active: {
    id: 'division_active',
    message: 'Division is not active',
    validate: (ctx) => !ctx.division || ctx.division.isActive !== false
  },
  has_at_least_one_line: {
    id: 'has_at_least_one_line',
    message: 'At least one line item is required',
    validate: (ctx) => ctx.lines && ctx.lines.length > 0
  },
  all_lines_valid: {
    id: 'all_lines_valid',
    message: 'All line items must be valid',
    validate: (ctx) => ctx.lines?.every(l => l.quantity > 0 && l.unitPrice >= 0) ?? false
  },
  pricing_complete: {
    id: 'pricing_complete',
    message: 'Pricing calculation is incomplete',
    validate: (ctx) => ctx.pricing?.totalAmount > 0
  },
  credit_available: {
    id: 'credit_available',
    message: 'Insufficient credit available',
    validate: (ctx) => {
      if (ctx.payment?.cashOnly) return true;
      return (ctx.customer?.creditAvailable || 0) >= (ctx.pricing?.totalAmount || 0);
    }
  },
  date_is_valid: {
    id: 'date_is_valid',
    message: 'Invalid delivery date',
    validate: (ctx) => {
      if (!ctx.shipping?.requestedDate) return false;
      return new Date(ctx.shipping.requestedDate) >= new Date();
    }
  },
  date_is_achievable: {
    id: 'date_is_achievable',
    message: 'Delivery date cannot be achieved',
    validate: (ctx) => true // Would check against capacity/processing time
  },
  address_complete: {
    id: 'address_complete',
    message: 'Shipping address is incomplete',
    validate: (ctx) => {
      const addr = ctx.shipping?.address;
      return addr?.line1 && addr?.city && addr?.state && addr?.postalCode;
    }
  },
  carrier_valid: {
    id: 'carrier_valid',
    message: 'Carrier selection is required',
    validate: (ctx) => ctx.shipping?.method !== 'delivery' || ctx.shipping?.carrier
  },
  payment_method_valid: {
    id: 'payment_method_valid',
    message: 'Payment method is required',
    validate: (ctx) => ctx.payment?.method != null
  },
  credit_check_passed: {
    id: 'credit_check_passed',
    message: 'Credit check failed',
    validate: (ctx) => {
      if (ctx.payment?.cashOnly || ['CASH', 'CARD', 'CHECK'].includes(ctx.payment?.method)) {
        return true;
      }
      return ctx.customer?.creditStatus !== 'HOLD';
    }
  },
  payment_complete: {
    id: 'payment_complete',
    message: 'Payment is incomplete',
    validate: (ctx) => {
      if (!ctx.payment?.paidUpfront) return true;
      return ctx.payment?.transactionId != null;
    }
  },
  pickup_location_valid: {
    id: 'pickup_location_valid',
    message: 'Pickup location is required',
    validate: (ctx) => ctx.shipping?.method !== 'will_call' || ctx.shipping?.pickupLocation
  },
  pickup_time_available: {
    id: 'pickup_time_available',
    message: 'Pickup time is not available',
    validate: (ctx) => true // Would check against actual availability
  }
};

// ============================================
// SCREEN DEFINITIONS - STANDARD ORDER FLOW
// ============================================

export const StandardOrderScreens = [
  {
    seq: 1,
    screenId: 'CUSTOMER_LOOKUP',
    name: 'Customer Lookup',
    stateId: 'CUSTOMER_LOOKUP', // Maps to workflow state
    required: true,
    skipConditions: ['customer_preselected', 'walk_in_cash_sale'],
    components: ['SearchBar', 'CustomerList', 'NewCustomerButton', 'RecentCustomers'],
    dataCapture: ['customer_id'],
    validation: ['customer_exists', 'customer_active'],
    avgTimeSeconds: 15,
    layout: 'split', // 'single', 'split', 'grid'
    helpText: 'Search for an existing customer or create a new one',
    shortcuts: [
      { key: 'F2', action: 'create_new', label: 'New Customer' },
      { key: 'Enter', action: 'select', label: 'Select' }
    ]
  },
  {
    seq: 2,
    screenId: 'DIVISION_SELECT',
    name: 'Division Selection',
    stateId: 'DIVISION_SELECT',
    required: false,
    showConditions: ['customer.divisions.length > 1'],
    components: ['DivisionList', 'DivisionDetails', 'ShipToSelector'],
    dataCapture: ['division_id', 'ship_to_id'],
    validation: ['division_active'],
    avgTimeSeconds: 8,
    layout: 'split',
    helpText: 'Select the billing and shipping division'
  },
  {
    seq: 3,
    screenId: 'LINE_ENTRY',
    name: 'Line Entry',
    stateId: 'LINE_ENTRY',
    required: true,
    skipConditions: [],
    components: [
      'LineItemGrid',
      'ProductSearchButton',
      'ScanInput',
      'QuoteImportButton',
      'HistoryButton',
      'OrderTotals',
      'AvailabilityIndicators'
    ],
    dataCapture: ['line_items[]'],
    validation: ['has_at_least_one_line', 'all_lines_valid'],
    avgTimeSeconds: 120,
    layout: 'full',
    helpText: 'Add products to the order',
    shortcuts: [
      { key: 'F3', action: 'product_search', label: 'Search Products' },
      { key: 'F4', action: 'quote_lookup', label: 'From Quote' },
      { key: 'F5', action: 'history', label: 'Reorder' },
      { key: 'F12', action: 'proceed', label: 'Review Order' }
    ],
    subScreens: [
      {
        screenId: 'PRODUCT_SEARCH',
        name: 'Product Search',
        type: 'modal',
        stateId: 'PRODUCT_SEARCH',
        width: 'large',
        components: ['SearchFilters', 'ProductGrid', 'ProductDetails', 'AvailabilityCheck']
      },
      {
        screenId: 'CUT_CONFIGURATOR',
        name: 'Cut Configurator',
        type: 'modal',
        stateId: 'CUT_CONFIGURATOR',
        width: 'large',
        components: ['MaterialSelector', 'CutPatternBuilder', 'DimensionInputs', 'WasteCalculator', 'PricePreview']
      },
      {
        screenId: 'QUOTE_LOOKUP',
        name: 'Quote Lookup',
        type: 'modal',
        stateId: 'QUOTE_LOOKUP',
        width: 'medium',
        components: ['SearchBar', 'OrderList', 'OrderDetails', 'SelectButton']
      },
      {
        screenId: 'REORDER_HISTORY',
        name: 'Reorder History',
        type: 'modal',
        stateId: 'REORDER_HISTORY',
        width: 'medium',
        components: ['OrderList', 'OrderDetails', 'SelectButton']
      }
    ]
  },
  {
    seq: 4,
    screenId: 'ORDER_REVIEW',
    name: 'Order Review',
    stateId: 'ORDER_REVIEW',
    required: true,
    skipConditions: [],
    components: [
      'CustomerSummary',
      'LineItemSummary',
      'PricingSummary',
      'DiscountDisplay',
      'TaxCalculation',
      'OrderTotal',
      'AdjustPricingButton',
      'EditLinesButton'
    ],
    dataCapture: ['pricing_confirmed'],
    validation: ['pricing_complete', 'credit_available'],
    avgTimeSeconds: 20,
    layout: 'split',
    helpText: 'Review the order details before proceeding',
    shortcuts: [
      { key: 'F6', action: 'adjust_pricing', label: 'Adjust Pricing' },
      { key: 'F7', action: 'edit_lines', label: 'Edit Lines' }
    ],
    subScreens: [
      {
        screenId: 'PRICING_ADJUSTMENT',
        name: 'Pricing Adjustment',
        type: 'modal',
        stateId: 'PRICING_ADJUSTMENT',
        width: 'medium',
        components: ['LineDiscounts', 'OrderDiscount', 'PriceOverrides', 'MarginDisplay', 'ApprovalRequired']
      }
    ]
  },
  {
    seq: 5,
    screenId: 'SHIP_DATE_SELECT',
    name: 'Delivery Options',
    stateId: 'SHIP_DATE_SELECT',
    required: true,
    skipConditions: [],
    components: [
      'DeliveryMethodToggle',
      'DatePicker',
      'TimeSlotPicker',
      'AvailabilityCalendar',
      'LeadTimeDisplay',
      'ExpressOptions'
    ],
    dataCapture: ['delivery_method', 'requested_date', 'requested_time'],
    validation: ['date_is_valid', 'date_is_achievable'],
    avgTimeSeconds: 15,
    layout: 'split',
    helpText: 'Choose delivery or will-call pickup'
  },
  {
    seq: 6,
    screenId: 'SHIPPING_CONFIG',
    name: 'Shipping Details',
    stateId: 'SHIPPING_CONFIG',
    required: false,
    showConditions: ['delivery_method == "delivery"'],
    components: [
      'ShipToAddress',
      'CarrierSelector',
      'FreightTerms',
      'SpecialInstructions',
      'DeliveryNotes',
      'FreightQuote'
    ],
    dataCapture: ['ship_to_address', 'carrier_id', 'freight_terms', 'instructions'],
    validation: ['address_complete', 'carrier_valid'],
    avgTimeSeconds: 25,
    layout: 'form',
    helpText: 'Configure shipping details'
  },
  {
    seq: 6, // Same seq as SHIPPING_CONFIG (mutually exclusive)
    screenId: 'WILL_CALL_CONFIG',
    name: 'Will-Call Details',
    stateId: 'WILL_CALL_CONFIG',
    required: false,
    showConditions: ['delivery_method == "will_call"'],
    components: [
      'PickupLocation',
      'PickupDate',
      'PickupTime',
      'AuthorizedPickupPersons',
      'VehicleInfo',
      'LoadingInstructions'
    ],
    dataCapture: ['pickup_location', 'pickup_datetime', 'authorized_persons[]', 'vehicle_info'],
    validation: ['pickup_location_valid', 'pickup_time_available'],
    avgTimeSeconds: 20,
    layout: 'form',
    helpText: 'Configure will-call pickup details'
  },
  {
    seq: 7,
    screenId: 'PAYMENT_SELECT',
    name: 'Payment',
    stateId: 'PAYMENT_SELECT',
    required: true,
    skipConditions: [],
    components: [
      'PaymentMethodTabs',
      'TermsDisplay',
      'CreditAvailable',
      'AmountDue',
      'DepositRequired',
      'PayNowOption',
      'SplitPaymentOption'
    ],
    dataCapture: ['payment_method', 'payment_terms', 'deposit_amount'],
    validation: ['payment_method_valid', 'credit_check_passed'],
    avgTimeSeconds: 15,
    layout: 'split',
    helpText: 'Select payment method'
  },
  {
    seq: 8,
    screenId: 'PAYMENT_PROCESSING',
    name: 'Process Payment',
    stateId: 'PAYMENT_PROCESSING',
    required: false,
    showConditions: ['payment_now == true'],
    components: [
      'PaymentAmountDisplay',
      'CardTerminal',
      'CashDrawer',
      'CheckCapture',
      'ChangeCalculator',
      'ReceiptOptions'
    ],
    dataCapture: ['payment_reference', 'amount_tendered', 'change_given'],
    validation: ['payment_complete'],
    avgTimeSeconds: 45,
    layout: 'single',
    helpText: 'Process the payment'
  },
  {
    seq: 9,
    screenId: 'ORDER_CONFIRMATION',
    name: 'Order Complete',
    stateId: 'ORDER_CONFIRMATION',
    required: true,
    skipConditions: [],
    components: [
      'OrderNumber',
      'ConfirmationSummary',
      'EstimatedDelivery',
      'PrintOptions',
      'EmailOption',
      'NewOrderButton',
      'QuickCutNotification'
    ],
    dataCapture: ['print_selections', 'email_confirmation'],
    validation: [],
    avgTimeSeconds: 10,
    layout: 'single',
    helpText: 'Order has been placed successfully',
    isTerminal: true
  }
];

// ============================================
// SCREEN DEFINITIONS - QUICK SALE FLOW
// ============================================

export const QuickSaleScreens = [
  {
    seq: 1,
    screenId: 'QUICK_SALE_MAIN',
    name: 'Quick Sale',
    stateId: 'QUICK_SALE',
    required: true,
    components: ['ScanInput', 'ItemList', 'RunningTotal', 'CheckoutButton'],
    dataCapture: ['items[]'],
    validation: ['has_at_least_one_line'],
    avgTimeSeconds: 30,
    layout: 'split',
    helpText: 'Scan items for quick checkout'
  },
  {
    seq: 2,
    screenId: 'QUICK_SALE_PAYMENT',
    name: 'Quick Payment',
    stateId: 'QUICK_SALE_PAYMENT',
    required: true,
    components: ['AmountDue', 'PaymentButtons', 'CardTerminal', 'CashInput'],
    dataCapture: ['payment_method', 'amount_tendered'],
    validation: ['payment_complete'],
    avgTimeSeconds: 20,
    layout: 'single',
    helpText: 'Complete the payment'
  },
  {
    seq: 3,
    screenId: 'QUICK_SALE_RECEIPT',
    name: 'Receipt',
    stateId: 'QUICK_SALE_RECEIPT',
    required: true,
    components: ['ReceiptPreview', 'PrintButton', 'EmailButton', 'DoneButton'],
    dataCapture: [],
    validation: [],
    avgTimeSeconds: 5,
    layout: 'single',
    helpText: 'Print or email receipt',
    isTerminal: true
  }
];

// ============================================
// SCREEN DEFINITIONS - WILL-CALL PICKUP FLOW
// ============================================

export const WillCallPickupScreens = [
  {
    seq: 1,
    screenId: 'WILL_CALL_QUEUE',
    name: 'Pickup Queue',
    stateId: 'WILL_CALL_QUEUE',
    required: true,
    components: ['SearchBar', 'StatusFilter', 'OrderList', 'SelectButton'],
    dataCapture: ['selected_order_id'],
    validation: [],
    avgTimeSeconds: 10,
    layout: 'split',
    helpText: 'Select an order for pickup'
  },
  {
    seq: 2,
    screenId: 'WILL_CALL_VERIFY',
    name: 'Verify Pickup',
    stateId: 'WILL_CALL_VERIFY',
    required: true,
    components: ['OrderDetails', 'CustomerPhoto', 'IDVerification', 'AuthorizedPersonCheck', 'ProceedButton'],
    dataCapture: ['verified_by', 'id_type', 'id_number'],
    validation: [],
    avgTimeSeconds: 30,
    layout: 'split',
    helpText: 'Verify customer identity'
  },
  {
    seq: 3,
    screenId: 'WILL_CALL_LOAD',
    name: 'Load Confirmation',
    stateId: 'WILL_CALL_LOAD',
    required: true,
    components: ['ItemChecklist', 'LoadingConfirmation', 'SignatureCapture', 'VehiclePhoto', 'CompleteButton'],
    dataCapture: ['items_verified[]', 'signature', 'vehicle_photo', 'loader_id'],
    validation: [],
    avgTimeSeconds: 60,
    layout: 'split',
    helpText: 'Confirm items loaded and capture signature'
  },
  {
    seq: 4,
    screenId: 'WILL_CALL_COMPLETE',
    name: 'Pickup Complete',
    stateId: 'WILL_CALL_COMPLETE',
    required: true,
    components: ['CompletionSummary', 'DocumentsPrinted', 'NextPickupButton', 'DoneButton'],
    dataCapture: [],
    validation: [],
    avgTimeSeconds: 10,
    layout: 'single',
    helpText: 'Pickup completed successfully',
    isTerminal: true
  }
];

// ============================================
// SCREEN DEFINITIONS - QUOTE CONVERSION FLOW
// ============================================

export const QuoteConversionScreens = [
  {
    seq: 1,
    screenId: 'QUOTE_SEARCH',
    name: 'Quote Search',
    stateId: 'QUOTE_LOOKUP',
    required: true,
    components: ['SearchBar', 'StatusFilter', 'OrderList', 'OrderDetails'],
    dataCapture: ['quote_id'],
    validation: [],
    avgTimeSeconds: 15,
    layout: 'split',
    helpText: 'Search for a quote to convert'
  },
  {
    seq: 2,
    screenId: 'QUOTE_REVIEW',
    name: 'Quote Review',
    stateId: 'QUOTE_LOOKUP',
    required: true,
    components: ['OrderDetails', 'LineItemSummary', 'PricingSummary', 'SelectButton'],
    dataCapture: ['conversion_confirmed'],
    validation: [],
    avgTimeSeconds: 20,
    layout: 'split',
    helpText: 'Review quote details before converting'
  },
  {
    seq: 3,
    screenId: 'CONVERTED_LINE_ENTRY',
    name: 'Verify Lines',
    stateId: 'LINE_ENTRY',
    required: true,
    components: ['LineItemGrid', 'AvailabilityIndicators', 'OrderTotals'],
    dataCapture: ['adjusted_lines[]'],
    validation: ['has_at_least_one_line', 'all_lines_valid'],
    avgTimeSeconds: 30,
    layout: 'full',
    helpText: 'Verify and adjust imported lines'
  }
];

// ============================================
// FLOW REGISTRY
// ============================================

export const ScreenFlows = {
  standard_order: {
    id: 'standard_order',
    name: 'Standard Order',
    description: 'Full order entry with customer, lines, shipping, and payment',
    entryState: 'CUSTOMER_LOOKUP',
    screens: StandardOrderScreens,
    estimatedTime: 300 // 5 minutes
  },
  quick_sale: {
    id: 'quick_sale',
    name: 'Quick Sale',
    description: 'Simplified cash sale flow for walk-in customers',
    entryState: 'QUICK_SALE',
    screens: QuickSaleScreens,
    estimatedTime: 55
  },
  will_call_pickup: {
    id: 'will_call_pickup',
    name: 'Will-Call Pickup',
    description: 'Process customer pickups for will-call orders',
    entryState: 'WILL_CALL_QUEUE',
    screens: WillCallPickupScreens,
    estimatedTime: 110
  },
  quote_conversion: {
    id: 'quote_conversion',
    name: 'Quote Conversion',
    description: 'Convert an existing quote to a sales order',
    entryState: 'QUOTE_LOOKUP',
    screens: QuoteConversionScreens,
    estimatedTime: 65
  }
};

export default ScreenFlows;
