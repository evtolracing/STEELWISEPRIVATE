/**
 * POS Comprehensive Validation Service
 * 
 * Implements validation rules from design document 42-AI-ORDER-INTAKE-POS.md
 * Provides field-level, entity-level, and workflow-level validation.
 */

// ============================================
// VALIDATION RESULT TYPES
// ============================================

export const ValidationSeverity = {
  ERROR: 'error',      // Blocks progression
  WARNING: 'warning',  // Allows progression with confirmation
  INFO: 'info'         // Informational only
};

export const ValidationCategory = {
  REQUIRED: 'required',
  FORMAT: 'format',
  RANGE: 'range',
  BUSINESS: 'business',
  CREDIT: 'credit',
  INVENTORY: 'inventory',
  PRICING: 'pricing',
  COMPLIANCE: 'compliance'
};

// ============================================
// FIELD VALIDATORS
// ============================================

const FieldValidators = {
  // String validators
  required: (value, fieldName) => {
    const valid = value !== null && value !== undefined && value !== '';
    return {
      valid,
      message: valid ? null : `${fieldName} is required`,
      code: 'REQUIRED'
    };
  },

  minLength: (min) => (value, fieldName) => {
    if (!value) return { valid: true, message: null };
    const valid = String(value).length >= min;
    return {
      valid,
      message: valid ? null : `${fieldName} must be at least ${min} characters`,
      code: 'MIN_LENGTH'
    };
  },

  maxLength: (max) => (value, fieldName) => {
    if (!value) return { valid: true, message: null };
    const valid = String(value).length <= max;
    return {
      valid,
      message: valid ? null : `${fieldName} must not exceed ${max} characters`,
      code: 'MAX_LENGTH'
    };
  },

  pattern: (regex, description) => (value, fieldName) => {
    if (!value) return { valid: true, message: null };
    const valid = regex.test(String(value));
    return {
      valid,
      message: valid ? null : `${fieldName} ${description}`,
      code: 'PATTERN'
    };
  },

  email: (value, fieldName) => {
    if (!value) return { valid: true, message: null };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid = emailRegex.test(value);
    return {
      valid,
      message: valid ? null : `${fieldName} must be a valid email address`,
      code: 'EMAIL_FORMAT'
    };
  },

  phone: (value, fieldName) => {
    if (!value) return { valid: true, message: null };
    // Accepts various phone formats
    const phoneRegex = /^[\d\s\-\(\)\+\.]{10,20}$/;
    const valid = phoneRegex.test(value.replace(/\s/g, ''));
    return {
      valid,
      message: valid ? null : `${fieldName} must be a valid phone number`,
      code: 'PHONE_FORMAT'
    };
  },

  // Numeric validators
  positive: (value, fieldName) => {
    if (value === null || value === undefined) return { valid: true, message: null };
    const valid = Number(value) > 0;
    return {
      valid,
      message: valid ? null : `${fieldName} must be greater than zero`,
      code: 'POSITIVE'
    };
  },

  nonNegative: (value, fieldName) => {
    if (value === null || value === undefined) return { valid: true, message: null };
    const valid = Number(value) >= 0;
    return {
      valid,
      message: valid ? null : `${fieldName} must not be negative`,
      code: 'NON_NEGATIVE'
    };
  },

  min: (minValue) => (value, fieldName) => {
    if (value === null || value === undefined) return { valid: true, message: null };
    const valid = Number(value) >= minValue;
    return {
      valid,
      message: valid ? null : `${fieldName} must be at least ${minValue}`,
      code: 'MIN_VALUE'
    };
  },

  max: (maxValue) => (value, fieldName) => {
    if (value === null || value === undefined) return { valid: true, message: null };
    const valid = Number(value) <= maxValue;
    return {
      valid,
      message: valid ? null : `${fieldName} must not exceed ${maxValue}`,
      code: 'MAX_VALUE'
    };
  },

  range: (minValue, maxValue) => (value, fieldName) => {
    if (value === null || value === undefined) return { valid: true, message: null };
    const num = Number(value);
    const valid = num >= minValue && num <= maxValue;
    return {
      valid,
      message: valid ? null : `${fieldName} must be between ${minValue} and ${maxValue}`,
      code: 'RANGE'
    };
  },

  percentage: (value, fieldName) => {
    if (value === null || value === undefined) return { valid: true, message: null };
    const num = Number(value);
    const valid = num >= 0 && num <= 100;
    return {
      valid,
      message: valid ? null : `${fieldName} must be between 0 and 100`,
      code: 'PERCENTAGE'
    };
  },

  // Date validators
  futureDate: (value, fieldName) => {
    if (!value) return { valid: true, message: null };
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const valid = date >= today;
    return {
      valid,
      message: valid ? null : `${fieldName} must be today or in the future`,
      code: 'FUTURE_DATE'
    };
  },

  pastDate: (value, fieldName) => {
    if (!value) return { valid: true, message: null };
    const date = new Date(value);
    const valid = date <= new Date();
    return {
      valid,
      message: valid ? null : `${fieldName} must be in the past`,
      code: 'PAST_DATE'
    };
  },

  dateRange: (minDate, maxDate) => (value, fieldName) => {
    if (!value) return { valid: true, message: null };
    const date = new Date(value);
    const min = minDate ? new Date(minDate) : null;
    const max = maxDate ? new Date(maxDate) : null;
    let valid = true;
    if (min && date < min) valid = false;
    if (max && date > max) valid = false;
    return {
      valid,
      message: valid ? null : `${fieldName} is outside the allowed date range`,
      code: 'DATE_RANGE'
    };
  },

  // Format validators
  uuid: (value, fieldName) => {
    if (!value) return { valid: true, message: null };
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const valid = uuidRegex.test(value);
    return {
      valid,
      message: valid ? null : `${fieldName} must be a valid UUID`,
      code: 'UUID_FORMAT'
    };
  },

  stateCode: (value, fieldName) => {
    if (!value) return { valid: true, message: null };
    const valid = /^[A-Z]{2}$/.test(value);
    return {
      valid,
      message: valid ? null : `${fieldName} must be a valid 2-letter state code`,
      code: 'STATE_CODE'
    };
  },

  postalCode: (value, fieldName) => {
    if (!value) return { valid: true, message: null };
    // US ZIP or ZIP+4
    const valid = /^\d{5}(-\d{4})?$/.test(value);
    return {
      valid,
      message: valid ? null : `${fieldName} must be a valid postal code`,
      code: 'POSTAL_CODE'
    };
  },

  // Enum validator
  oneOf: (allowedValues) => (value, fieldName) => {
    if (!value) return { valid: true, message: null };
    const valid = allowedValues.includes(value);
    return {
      valid,
      message: valid ? null : `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      code: 'ENUM'
    };
  },

  // Array validators
  arrayMinLength: (min) => (value, fieldName) => {
    if (!value) return { valid: true, message: null };
    const valid = Array.isArray(value) && value.length >= min;
    return {
      valid,
      message: valid ? null : `${fieldName} must have at least ${min} item(s)`,
      code: 'ARRAY_MIN_LENGTH'
    };
  },

  arrayMaxLength: (max) => (value, fieldName) => {
    if (!value) return { valid: true, message: null };
    const valid = Array.isArray(value) && value.length <= max;
    return {
      valid,
      message: valid ? null : `${fieldName} must not exceed ${max} item(s)`,
      code: 'ARRAY_MAX_LENGTH'
    };
  }
};

// ============================================
// ENTITY VALIDATION SCHEMAS
// ============================================

const CustomerValidationSchema = {
  id: [FieldValidators.required],
  name: [FieldValidators.required, FieldValidators.maxLength(200)],
  email: [FieldValidators.email],
  phone: [FieldValidators.phone],
  taxExemptNumber: [FieldValidators.maxLength(50)],
  creditLimit: [FieldValidators.nonNegative],
  paymentTerms: [FieldValidators.oneOf(['NET_30', 'NET_15', 'NET_10', 'DUE_ON_RECEIPT', 'COD', 'PREPAID', 'CREDIT_CARD'])]
};

const AddressValidationSchema = {
  name: [FieldValidators.required, FieldValidators.maxLength(100)],
  addressLine1: [FieldValidators.required, FieldValidators.maxLength(200)],
  addressLine2: [FieldValidators.maxLength(200)],
  city: [FieldValidators.required, FieldValidators.maxLength(100)],
  state: [FieldValidators.required, FieldValidators.stateCode],
  postalCode: [FieldValidators.required, FieldValidators.postalCode],
  country: [FieldValidators.maxLength(2)],
  contactPhone: [FieldValidators.phone],
  deliveryInstructions: [FieldValidators.maxLength(500)]
};

const LineItemValidationSchema = {
  productId: [FieldValidators.required],
  quantity: [FieldValidators.required, FieldValidators.positive],
  quantityUom: [FieldValidators.required, FieldValidators.oneOf(['EA', 'LBS', 'CWT', 'TON', 'FT', 'IN', 'SQ_FT', 'LN_FT'])],
  unitPrice: [FieldValidators.required, FieldValidators.nonNegative],
  description: [FieldValidators.maxLength(200)],
  processingType: [FieldValidators.oneOf(['CUT_TO_LENGTH', 'SHEAR', 'SLIT', 'SAW', 'PLASMA', 'LASER', 'BEND', 'DRILL', 'NONE'])],
  discountPct: [FieldValidators.percentage],
  notes: [FieldValidators.maxLength(500)]
};

const PaymentValidationSchema = {
  method: [FieldValidators.required, FieldValidators.oneOf(['TERMS', 'CASH', 'CHECK', 'CREDIT_CARD', 'WIRE', 'ACH'])],
  depositAmount: [FieldValidators.nonNegative],
  cardLastFour: [FieldValidators.pattern(/^\d{4}$/, 'must be 4 digits')],
  checkNumber: [FieldValidators.maxLength(20)],
  amountTendered: [FieldValidators.nonNegative]
};

const DeliveryValidationSchema = {
  method: [FieldValidators.required, FieldValidators.oneOf(['DELIVERY', 'WILL_CALL', 'SHIP_CARRIER', 'CUSTOMER_PICKUP'])],
  requestedDate: [FieldValidators.required, FieldValidators.futureDate],
  requestedTime: [FieldValidators.pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'must be in HH:MM format')],
  freightTerms: [FieldValidators.oneOf(['PREPAID', 'COLLECT', 'THIRD_PARTY', 'FOB_ORIGIN', 'FOB_DEST'])],
  specialInstructions: [FieldValidators.maxLength(500)]
};

const QuickSaleItemSchema = {
  productId: [FieldValidators.required],
  quantity: [FieldValidators.required, FieldValidators.positive],
  unitPrice: [FieldValidators.required, FieldValidators.nonNegative]
};

const WillCallVerificationSchema = {
  pickupPersonName: [FieldValidators.required, FieldValidators.maxLength(100)],
  idType: [FieldValidators.required, FieldValidators.oneOf(['DRIVERS_LICENSE', 'STATE_ID', 'PASSPORT', 'COMPANY_ID', 'EMPLOYEE_BADGE'])],
  idNumberLast4: [FieldValidators.minLength(4), FieldValidators.maxLength(4)]
};

// ============================================
// BUSINESS RULE VALIDATORS
// ============================================

const BusinessRules = {
  // Customer rules
  customerIsActive: {
    id: 'customer_is_active',
    category: ValidationCategory.BUSINESS,
    severity: ValidationSeverity.ERROR,
    message: 'Customer account is not active',
    validate: (ctx) => ctx.customer?.isActive !== false && ctx.customer?.status !== 'INACTIVE'
  },

  customerNotOnHold: {
    id: 'customer_not_on_hold',
    category: ValidationCategory.CREDIT,
    severity: ValidationSeverity.ERROR,
    message: 'Customer account is on credit hold',
    validate: (ctx) => ctx.customer?.creditStatus !== 'HOLD'
  },

  customerHasCreditLimit: {
    id: 'customer_has_credit_limit',
    category: ValidationCategory.CREDIT,
    severity: ValidationSeverity.WARNING,
    message: 'Customer has no credit limit set',
    validate: (ctx) => {
      if (ctx.payment?.method === 'CASH' || ctx.payment?.method === 'CREDIT_CARD') return true;
      return (ctx.customer?.creditLimit || 0) > 0;
    }
  },

  // Credit rules
  orderWithinCreditLimit: {
    id: 'order_within_credit_limit',
    category: ValidationCategory.CREDIT,
    severity: ValidationSeverity.ERROR,
    message: 'Order exceeds available credit',
    validate: (ctx) => {
      if (ctx.payment?.method === 'CASH' || ctx.payment?.method === 'CREDIT_CARD') return true;
      if (ctx.payment?.paidUpfront) return true;
      const available = ctx.customer?.creditAvailable || 0;
      const orderTotal = ctx.pricing?.totalAmount || 0;
      return available >= orderTotal;
    }
  },

  depositRequiredForNewCustomer: {
    id: 'deposit_required_new_customer',
    category: ValidationCategory.BUSINESS,
    severity: ValidationSeverity.WARNING,
    message: 'Deposit may be required for new customers',
    validate: (ctx) => {
      if (!ctx.customer?.isNew) return true;
      return ctx.payment?.depositPaid || ctx.payment?.method === 'CASH';
    }
  },

  // Line item rules
  hasAtLeastOneLine: {
    id: 'has_at_least_one_line',
    category: ValidationCategory.REQUIRED,
    severity: ValidationSeverity.ERROR,
    message: 'At least one line item is required',
    validate: (ctx) => ctx.lines && ctx.lines.length > 0
  },

  allLinesHaveValidQuantity: {
    id: 'all_lines_valid_quantity',
    category: ValidationCategory.BUSINESS,
    severity: ValidationSeverity.ERROR,
    message: 'All line items must have valid quantities',
    validate: (ctx) => ctx.lines?.every(l => l.quantity > 0) ?? false
  },

  allLinesHaveValidPricing: {
    id: 'all_lines_valid_pricing',
    category: ValidationCategory.PRICING,
    severity: ValidationSeverity.ERROR,
    message: 'All line items must have valid pricing',
    validate: (ctx) => ctx.lines?.every(l => l.unitPrice >= 0 && l.extendedPrice >= 0) ?? false
  },

  allLinesHaveInventory: {
    id: 'all_lines_have_inventory',
    category: ValidationCategory.INVENTORY,
    severity: ValidationSeverity.WARNING,
    message: 'Some items may not be available in requested quantities',
    validate: (ctx) => ctx.lines?.every(l => l.allocationStatus !== 'BACKORDERED') ?? true
  },

  noZeroQuantityLines: {
    id: 'no_zero_quantity_lines',
    category: ValidationCategory.BUSINESS,
    severity: ValidationSeverity.ERROR,
    message: 'Lines with zero quantity are not allowed',
    validate: (ctx) => ctx.lines?.every(l => l.quantity > 0) ?? true
  },

  // Pricing rules
  pricingCalculated: {
    id: 'pricing_calculated',
    category: ValidationCategory.PRICING,
    severity: ValidationSeverity.ERROR,
    message: 'Pricing must be calculated before proceeding',
    validate: (ctx) => ctx.pricing?.subtotal >= 0 && ctx.pricing?.totalAmount >= 0
  },

  marginWithinThreshold: {
    id: 'margin_within_threshold',
    category: ValidationCategory.PRICING,
    severity: ValidationSeverity.WARNING,
    message: 'Order margin is below minimum threshold',
    validate: (ctx) => {
      const minMargin = ctx.config?.minMarginPct || 15;
      return (ctx.pricing?.marginPct || 100) >= minMargin;
    }
  },

  discountWithinLimit: {
    id: 'discount_within_limit',
    category: ValidationCategory.PRICING,
    severity: ValidationSeverity.WARNING,
    message: 'Discount exceeds authorized limit',
    validate: (ctx) => {
      const maxDiscount = ctx.user?.maxDiscountPct || 10;
      return (ctx.pricing?.discountPct || 0) <= maxDiscount;
    }
  },

  priceOverrideApproved: {
    id: 'price_override_approved',
    category: ValidationCategory.PRICING,
    severity: ValidationSeverity.ERROR,
    message: 'Price override requires approval',
    validate: (ctx) => {
      const hasOverrides = ctx.lines?.some(l => l.priceSource === 'MANUAL');
      if (!hasOverrides) return true;
      return ctx.approvals?.priceOverride?.approved === true;
    }
  },

  // Delivery rules
  deliveryDateValid: {
    id: 'delivery_date_valid',
    category: ValidationCategory.BUSINESS,
    severity: ValidationSeverity.ERROR,
    message: 'Delivery date must be today or in the future',
    validate: (ctx) => {
      if (!ctx.delivery?.requestedDate) return false;
      const date = new Date(ctx.delivery.requestedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }
  },

  deliveryDateAchievable: {
    id: 'delivery_date_achievable',
    category: ValidationCategory.BUSINESS,
    severity: ValidationSeverity.WARNING,
    message: 'Requested delivery date may not be achievable',
    validate: (ctx) => {
      // Would check against processing times and capacity
      const hasProcessing = ctx.lines?.some(l => l.processingRequired);
      if (!hasProcessing) return true;
      // Estimate minimum lead time
      const minLeadDays = 2;
      const requestedDate = new Date(ctx.delivery?.requestedDate);
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + minLeadDays);
      return requestedDate >= minDate;
    }
  },

  shipToAddressComplete: {
    id: 'ship_to_address_complete',
    category: ValidationCategory.REQUIRED,
    severity: ValidationSeverity.ERROR,
    message: 'Shipping address is incomplete',
    validate: (ctx) => {
      if (ctx.delivery?.method !== 'DELIVERY') return true;
      const addr = ctx.shipTo;
      return addr?.addressLine1 && addr?.city && addr?.state && addr?.postalCode;
    }
  },

  carrierSelected: {
    id: 'carrier_selected',
    category: ValidationCategory.REQUIRED,
    severity: ValidationSeverity.ERROR,
    message: 'Carrier must be selected for delivery orders',
    validate: (ctx) => {
      if (ctx.delivery?.method !== 'DELIVERY') return true;
      return !!ctx.delivery?.carrierId;
    }
  },

  // Will-call rules
  pickupLocationValid: {
    id: 'pickup_location_valid',
    category: ValidationCategory.REQUIRED,
    severity: ValidationSeverity.ERROR,
    message: 'Pickup location must be selected',
    validate: (ctx) => {
      if (ctx.delivery?.method !== 'WILL_CALL') return true;
      return !!ctx.willCall?.pickupLocation;
    }
  },

  authorizedPickupPersons: {
    id: 'authorized_pickup_persons',
    category: ValidationCategory.BUSINESS,
    severity: ValidationSeverity.WARNING,
    message: 'No authorized pickup persons specified',
    validate: (ctx) => {
      if (ctx.delivery?.method !== 'WILL_CALL') return true;
      return ctx.willCall?.authorizedPersons?.length > 0;
    }
  },

  // Payment rules
  paymentMethodSelected: {
    id: 'payment_method_selected',
    category: ValidationCategory.REQUIRED,
    severity: ValidationSeverity.ERROR,
    message: 'Payment method must be selected',
    validate: (ctx) => !!ctx.payment?.method
  },

  paymentComplete: {
    id: 'payment_complete',
    category: ValidationCategory.BUSINESS,
    severity: ValidationSeverity.ERROR,
    message: 'Payment processing is incomplete',
    validate: (ctx) => {
      if (!ctx.payment?.paidUpfront) return true;
      if (ctx.payment?.method === 'TERMS') return true;
      return !!ctx.payment?.transactionId || ctx.payment?.status === 'COMPLETED';
    }
  },

  sufficientCashTendered: {
    id: 'sufficient_cash_tendered',
    category: ValidationCategory.BUSINESS,
    severity: ValidationSeverity.ERROR,
    message: 'Insufficient payment amount',
    validate: (ctx) => {
      if (ctx.payment?.method !== 'CASH') return true;
      return (ctx.payment?.amountTendered || 0) >= (ctx.pricing?.totalAmount || 0);
    }
  },

  checkNumberProvided: {
    id: 'check_number_provided',
    category: ValidationCategory.REQUIRED,
    severity: ValidationSeverity.ERROR,
    message: 'Check number is required',
    validate: (ctx) => {
      if (ctx.payment?.method !== 'CHECK') return true;
      return !!ctx.payment?.checkNumber;
    }
  },

  // Tax rules
  taxExemptCertificateValid: {
    id: 'tax_exempt_certificate_valid',
    category: ValidationCategory.COMPLIANCE,
    severity: ValidationSeverity.WARNING,
    message: 'Tax exempt certificate may be expired',
    validate: (ctx) => {
      if (!ctx.customer?.taxExempt) return true;
      if (!ctx.customer?.taxExemptExpiry) return true;
      return new Date(ctx.customer.taxExemptExpiry) > new Date();
    }
  },

  // Processing rules
  processingConfigComplete: {
    id: 'processing_config_complete',
    category: ValidationCategory.BUSINESS,
    severity: ValidationSeverity.ERROR,
    message: 'Processing configuration is incomplete',
    validate: (ctx) => {
      const linesWithProcessing = ctx.lines?.filter(l => l.processingRequired) || [];
      return linesWithProcessing.every(l => l.processingType && l.processingType !== 'NONE');
    }
  },

  cutDimensionsValid: {
    id: 'cut_dimensions_valid',
    category: ValidationCategory.BUSINESS,
    severity: ValidationSeverity.ERROR,
    message: 'Cut dimensions must be specified',
    validate: (ctx) => {
      const linesWithCuts = ctx.lines?.filter(l => 
        l.processingType && ['CUT_TO_LENGTH', 'SAW', 'SHEAR'].includes(l.processingType)
      ) || [];
      return linesWithCuts.every(l => l.cutPattern?.cutLengths?.length > 0);
    }
  },

  // Quick sale rules
  quickSaleHasItems: {
    id: 'quick_sale_has_items',
    category: ValidationCategory.REQUIRED,
    severity: ValidationSeverity.ERROR,
    message: 'At least one item is required',
    validate: (ctx) => ctx.items && ctx.items.length > 0
  },

  quickSaleItemsValid: {
    id: 'quick_sale_items_valid',
    category: ValidationCategory.BUSINESS,
    severity: ValidationSeverity.ERROR,
    message: 'All items must have valid quantities and prices',
    validate: (ctx) => ctx.items?.every(i => i.quantity > 0 && i.unitPrice >= 0) ?? true
  },

  // Will-call pickup rules
  pickupVerificationComplete: {
    id: 'pickup_verification_complete',
    category: ValidationCategory.COMPLIANCE,
    severity: ValidationSeverity.ERROR,
    message: 'Pickup person verification is required',
    validate: (ctx) => {
      return ctx.verification?.pickupPersonName && 
             ctx.verification?.idType && 
             ctx.verification?.authorizationConfirmed;
    }
  },

  signatureRequired: {
    id: 'signature_required',
    category: ValidationCategory.COMPLIANCE,
    severity: ValidationSeverity.ERROR,
    message: 'Customer signature is required',
    validate: (ctx) => !!ctx.signature?.signatureData
  },

  allItemsLoaded: {
    id: 'all_items_loaded',
    category: ValidationCategory.BUSINESS,
    severity: ValidationSeverity.WARNING,
    message: 'Not all items have been loaded',
    validate: (ctx) => {
      return ctx.itemsReleased?.every(i => i.verified) ?? true;
    }
  }
};

// ============================================
// SCREEN VALIDATION RULESETS
// ============================================

const ScreenValidationRules = {
  CUSTOMER_LOOKUP: {
    required: ['customerIsActive'],
    warnings: ['customerNotOnHold', 'customerHasCreditLimit']
  },
  DIVISION_SELECT: {
    required: [],
    warnings: []
  },
  LINE_ENTRY: {
    required: ['hasAtLeastOneLine', 'allLinesHaveValidQuantity', 'allLinesHaveValidPricing'],
    warnings: ['allLinesHaveInventory', 'marginWithinThreshold']
  },
  ORDER_REVIEW: {
    required: ['pricingCalculated', 'orderWithinCreditLimit'],
    warnings: ['discountWithinLimit', 'priceOverrideApproved']
  },
  SHIP_DATE_SELECT: {
    required: ['deliveryDateValid'],
    warnings: ['deliveryDateAchievable']
  },
  SHIPPING_CONFIG: {
    required: ['shipToAddressComplete', 'carrierSelected'],
    warnings: []
  },
  WILL_CALL_CONFIG: {
    required: ['pickupLocationValid'],
    warnings: ['authorizedPickupPersons']
  },
  PAYMENT_SELECT: {
    required: ['paymentMethodSelected'],
    warnings: ['orderWithinCreditLimit']
  },
  PAYMENT_PROCESSING: {
    required: ['paymentComplete'],
    warnings: []
  },
  QUICK_SALE: {
    required: ['quickSaleHasItems', 'quickSaleItemsValid'],
    warnings: []
  },
  QUICK_SALE_PAYMENT: {
    required: ['paymentMethodSelected', 'sufficientCashTendered', 'checkNumberProvided'],
    warnings: []
  },
  WILL_CALL_VERIFY: {
    required: ['pickupVerificationComplete'],
    warnings: []
  },
  WILL_CALL_LOAD: {
    required: ['signatureRequired'],
    warnings: ['allItemsLoaded']
  }
};

// ============================================
// VALIDATION SERVICE CLASS
// ============================================

class POSValidationService {
  constructor() {
    this.fieldValidators = FieldValidators;
    this.businessRules = BusinessRules;
    this.screenRules = ScreenValidationRules;
    this.schemas = {
      customer: CustomerValidationSchema,
      address: AddressValidationSchema,
      lineItem: LineItemValidationSchema,
      payment: PaymentValidationSchema,
      delivery: DeliveryValidationSchema,
      quickSaleItem: QuickSaleItemSchema,
      willCallVerification: WillCallVerificationSchema
    };
  }

  /**
   * Validate a single field
   */
  validateField(value, fieldName, validators) {
    const results = [];
    
    for (const validator of validators) {
      const result = validator(value, fieldName);
      if (!result.valid) {
        results.push({
          field: fieldName,
          valid: false,
          message: result.message,
          code: result.code
        });
      }
    }
    
    return {
      valid: results.length === 0,
      errors: results
    };
  }

  /**
   * Validate an entity against a schema
   */
  validateEntity(entity, schemaName) {
    const schema = this.schemas[schemaName];
    if (!schema) {
      return { valid: true, errors: [], warnings: [] };
    }

    const errors = [];
    const warnings = [];

    for (const [fieldName, validators] of Object.entries(schema)) {
      const value = entity?.[fieldName];
      const result = this.validateField(value, fieldName, validators);
      if (!result.valid) {
        errors.push(...result.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate business rules for a context
   */
  validateBusinessRules(context, ruleIds = null) {
    const errors = [];
    const warnings = [];
    const info = [];

    const rulesToCheck = ruleIds 
      ? ruleIds.map(id => this.businessRules[id]).filter(Boolean)
      : Object.values(this.businessRules);

    for (const rule of rulesToCheck) {
      try {
        const passed = rule.validate(context);
        if (!passed) {
          const result = {
            ruleId: rule.id,
            message: rule.message,
            category: rule.category,
            severity: rule.severity
          };

          switch (rule.severity) {
            case ValidationSeverity.ERROR:
              errors.push(result);
              break;
            case ValidationSeverity.WARNING:
              warnings.push(result);
              break;
            case ValidationSeverity.INFO:
              info.push(result);
              break;
          }
        }
      } catch (err) {
        console.error(`Error validating rule ${rule.id}:`, err);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info
    };
  }

  /**
   * Validate a screen's data
   */
  validateScreen(screenId, context) {
    const screenRules = this.screenRules[screenId];
    if (!screenRules) {
      return { valid: true, errors: [], warnings: [] };
    }

    const allRuleIds = [...(screenRules.required || []), ...(screenRules.warnings || [])];
    return this.validateBusinessRules(context, allRuleIds);
  }

  /**
   * Validate entire order
   */
  validateOrder(order) {
    const errors = [];
    const warnings = [];

    // Validate customer
    if (order.customer) {
      const customerResult = this.validateEntity(order.customer, 'customer');
      errors.push(...customerResult.errors);
    }

    // Validate addresses
    if (order.billTo) {
      const billToResult = this.validateEntity(order.billTo, 'address');
      errors.push(...billToResult.errors.map(e => ({ ...e, context: 'billTo' })));
    }

    if (order.shipTo) {
      const shipToResult = this.validateEntity(order.shipTo, 'address');
      errors.push(...shipToResult.errors.map(e => ({ ...e, context: 'shipTo' })));
    }

    // Validate line items
    if (order.lines) {
      order.lines.forEach((line, index) => {
        const lineResult = this.validateEntity(line, 'lineItem');
        errors.push(...lineResult.errors.map(e => ({ ...e, context: `line[${index}]` })));
      });
    }

    // Validate payment
    if (order.payment) {
      const paymentResult = this.validateEntity(order.payment, 'payment');
      errors.push(...paymentResult.errors);
    }

    // Validate delivery
    if (order.delivery) {
      const deliveryResult = this.validateEntity(order.delivery, 'delivery');
      errors.push(...deliveryResult.errors);
    }

    // Run business rules
    const businessResult = this.validateBusinessRules({
      ...order,
      lines: order.lines,
      pricing: order.pricingSummary,
      payment: order.payment,
      delivery: order.deliveryDetails,
      shipTo: order.shipTo,
      willCall: order.willCallDetails
    });

    return {
      valid: errors.length === 0 && businessResult.valid,
      errors: [...errors, ...businessResult.errors],
      warnings: [...warnings, ...businessResult.warnings],
      canSubmit: errors.length === 0 && businessResult.errors.length === 0
    };
  }

  /**
   * Validate quick sale
   */
  validateQuickSale(sale) {
    const errors = [];
    const warnings = [];

    // Validate items
    if (!sale.items || sale.items.length === 0) {
      errors.push({
        field: 'items',
        message: 'At least one item is required',
        code: 'REQUIRED'
      });
    } else {
      sale.items.forEach((item, index) => {
        const itemResult = this.validateEntity(item, 'quickSaleItem');
        errors.push(...itemResult.errors.map(e => ({ ...e, context: `item[${index}]` })));
      });
    }

    // Validate totals
    if (sale.total <= 0 && sale.items?.length > 0) {
      errors.push({
        field: 'total',
        message: 'Order total must be greater than zero',
        code: 'POSITIVE'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      canCheckout: errors.length === 0
    };
  }

  /**
   * Validate will-call pickup
   */
  validateWillCallPickup(pickup) {
    const errors = [];
    const warnings = [];

    // Validate verification
    if (pickup.verification) {
      const verifyResult = this.validateEntity(pickup.verification, 'willCallVerification');
      errors.push(...verifyResult.errors);
    }

    // Check signature
    if (!pickup.signature?.signatureData) {
      errors.push({
        field: 'signature',
        message: 'Customer signature is required',
        code: 'REQUIRED'
      });
    }

    // Check items loaded
    if (pickup.itemsReleased) {
      const unverified = pickup.itemsReleased.filter(i => !i.verified);
      if (unverified.length > 0) {
        warnings.push({
          field: 'itemsReleased',
          message: `${unverified.length} item(s) not yet verified`,
          code: 'INCOMPLETE'
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      canComplete: errors.length === 0
    };
  }

  /**
   * Get all validation rules
   */
  getAllRules() {
    return {
      businessRules: Object.keys(this.businessRules),
      screenRules: this.screenRules,
      schemas: Object.keys(this.schemas)
    };
  }

  /**
   * Create a custom validator
   */
  createValidator(config) {
    return {
      id: config.id,
      category: config.category || ValidationCategory.BUSINESS,
      severity: config.severity || ValidationSeverity.ERROR,
      message: config.message,
      validate: config.validate
    };
  }

  /**
   * Add a custom business rule
   */
  addBusinessRule(rule) {
    this.businessRules[rule.id] = rule;
  }

  /**
   * Add screen validation rules
   */
  addScreenRules(screenId, rules) {
    this.screenRules[screenId] = {
      required: [...(this.screenRules[screenId]?.required || []), ...(rules.required || [])],
      warnings: [...(this.screenRules[screenId]?.warnings || []), ...(rules.warnings || [])]
    };
  }
}

// Export singleton instance
export const posValidationService = new POSValidationService();

// Export for use in other modules
export {
  POSValidationService,
  FieldValidators,
  BusinessRules,
  ScreenValidationRules,
  CustomerValidationSchema,
  AddressValidationSchema,
  LineItemValidationSchema,
  PaymentValidationSchema,
  DeliveryValidationSchema,
  QuickSaleItemSchema,
  WillCallVerificationSchema
};

export default posValidationService;
