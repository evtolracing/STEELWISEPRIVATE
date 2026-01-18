/**
 * POS Order Intake Workflow State Machine
 * 
 * Implements the complete POS workflow from 42-AI-ORDER-INTAKE-POS.md
 * Version: 1.0
 * 
 * Entry Points:
 * - WALK_IN_CUSTOMER
 * - PHONE_ORDER
 * - QUICK_REORDER
 * - QUOTE_CONVERSION
 * - WILL_CALL_PICKUP
 */

// ============================================
// STATE DEFINITIONS
// ============================================

export const POSStateType = {
  INITIAL: 'initial',
  SCREEN: 'screen',
  MODAL: 'modal',
  ACTION: 'action',
  CHECKPOINT: 'checkpoint',
  FLAG: 'flag',
  NOTIFICATION: 'notification'
};

export const POSStates = {
  // Initial State
  IDLE: 'IDLE',
  
  // Customer Flow
  CUSTOMER_LOOKUP: 'CUSTOMER_LOOKUP',
  NEW_CUSTOMER: 'NEW_CUSTOMER',
  CREDIT_HOLD_BLOCK: 'CREDIT_HOLD_BLOCK',
  CASH_ONLY_MODE: 'CASH_ONLY_MODE',
  CUSTOMER_SELECTED: 'CUSTOMER_SELECTED',
  DIVISION_SELECT: 'DIVISION_SELECT',
  
  // Line Entry Flow
  LINE_ENTRY: 'LINE_ENTRY',
  PRODUCT_SEARCH: 'PRODUCT_SEARCH',
  PRODUCT_DETAIL: 'PRODUCT_DETAIL',
  QUICK_ADD: 'QUICK_ADD',
  CUT_CONFIGURATOR: 'CUT_CONFIGURATOR',
  QUOTE_LOOKUP: 'QUOTE_LOOKUP',
  REORDER_HISTORY: 'REORDER_HISTORY',
  
  // Order Review Flow
  ORDER_REVIEW: 'ORDER_REVIEW',
  PRICING_ADJUSTMENT: 'PRICING_ADJUSTMENT',
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  
  // Shipping Flow
  SHIP_DATE_SELECT: 'SHIP_DATE_SELECT',
  SHIPPING_CONFIG: 'SHIPPING_CONFIG',
  WILL_CALL_CONFIG: 'WILL_CALL_CONFIG',
  
  // Payment Flow
  PAYMENT_SELECT: 'PAYMENT_SELECT',
  PAYMENT_PROCESSING: 'PAYMENT_PROCESSING',
  
  // Confirmation
  ORDER_CONFIRMATION: 'ORDER_CONFIRMATION',
  PRINT_OPTIONS: 'PRINT_OPTIONS',
  QUICK_CUT_QUEUE: 'QUICK_CUT_QUEUE',
  
  // Will-Call Flow
  WILL_CALL_QUEUE: 'WILL_CALL_QUEUE',
  WILL_CALL_VERIFY: 'WILL_CALL_VERIFY',
  WILL_CALL_LOAD: 'WILL_CALL_LOAD',
  WILL_CALL_PARTIAL: 'WILL_CALL_PARTIAL',
  WILL_CALL_COMPLETE: 'WILL_CALL_COMPLETE',
  
  // Quick Sale Flow
  QUICK_SALE: 'QUICK_SALE',
  QUICK_SALE_SCAN: 'QUICK_SALE_SCAN',
  QUICK_SALE_PAYMENT: 'QUICK_SALE_PAYMENT',
  QUICK_SALE_RECEIPT: 'QUICK_SALE_RECEIPT'
};

// ============================================
// TRIGGER DEFINITIONS
// ============================================

export const POSTriggers = {
  // General
  CANCEL: 'cancel',
  BACK: 'back',
  CONTINUE: 'continue',
  DONE: 'done',
  
  // Customer Flow
  START_ORDER: 'start_order',
  START_QUICK_SALE: 'start_quick_sale',
  WILL_CALL_MODE: 'will_call_mode',
  CUSTOMER_FOUND: 'customer_found',
  CREATE_NEW: 'create_new',
  CUSTOMER_CREATED: 'customer_created',
  OVERRIDE_APPROVED: 'override_approved',
  ACCEPT_CASH_ONLY: 'accept_cash_only',
  SELECT_DIFFERENT: 'select_different',
  DIVISION_SELECTED: 'division_selected',
  
  // Line Entry
  SEARCH_PRODUCT: 'search_product',
  SCAN_BARCODE: 'scan_barcode',
  ADD_PROCESSING: 'add_processing',
  FROM_QUOTE: 'from_quote',
  FROM_HISTORY: 'from_history',
  PROCEED_TO_REVIEW: 'proceed_to_review',
  PRODUCT_SELECTED: 'product_selected',
  ADD_TO_ORDER: 'add_to_order',
  ADD_WITH_PROCESSING: 'add_with_processing',
  CLOSE: 'close',
  ITEM_ADDED: 'item_added',
  ITEM_NOT_FOUND: 'item_not_found',
  CONFIG_SAVED: 'config_saved',
  QUOTE_LOADED: 'quote_loaded',
  ITEMS_ADDED: 'items_added',
  COPY_LINES: 'copy_lines',
  
  // Order Review
  ADJUST_PRICING: 'adjust_pricing',
  EDIT_LINES: 'edit_lines',
  SAVE: 'save',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  
  // Shipping
  DELIVERY_SELECTED: 'delivery_selected',
  WILL_CALL_SELECTED: 'will_call_selected',
  
  // Payment
  PROCESS_PAYMENT: 'process_payment',
  SUBMIT_ORDER: 'submit_order',
  PAYMENT_COMPLETE: 'payment_complete',
  PAYMENT_FAILED: 'payment_failed',
  
  // Confirmation
  PRINT: 'print',
  NEW_ORDER: 'new_order',
  HAS_COUNTER_CUTS: 'has_counter_cuts',
  PRINTED: 'printed',
  SKIP: 'skip',
  ACKNOWLEDGED: 'acknowledged',
  
  // Will-Call
  SELECT_ORDER: 'select_order',
  VERIFIED: 'verified',
  COMPLETE: 'complete',
  PARTIAL_PICKUP: 'partial_pickup',
  CONFIRMED: 'confirmed',
  NEXT_PICKUP: 'next_pickup',
  
  // Quick Sale
  SCAN_ITEMS: 'scan_items',
  CHECKOUT: 'checkout'
};

// ============================================
// GUARD DEFINITIONS
// ============================================

export const POSGuards = {
  CUSTOMER_ACTIVE: 'customer_active',
  CUSTOMER_ON_HOLD: 'customer_on_hold',
  MANAGER_OVERRIDE: 'manager_override',
  MULTI_DIVISION_CUSTOMER: 'multi_division_customer',
  SINGLE_DIVISION: 'single_division',
  HAS_LINES: 'has_lines',
  CONFIRM_CANCEL: 'confirm_cancel',
  HAS_PRICING_PERMISSION: 'has_pricing_permission',
  EXCEEDS_AUTHORITY: 'exceeds_authority',
  WITHIN_AUTHORITY: 'within_authority',
  PAYMENT_NOW: 'payment_now',
  TERMS_PAYMENT: 'terms_payment',
  PROCESSING_REQUIRED: 'processing_required',
  HAS_ITEMS: 'has_items'
};

// ============================================
// EFFECT DEFINITIONS
// ============================================

export const POSEffects = {
  SET_PAYMENT_REQUIRED_UPFRONT: 'set_payment_required_upfront',
  CREATE_LINE: 'create_line',
  CREATE_PROCESSED_LINE: 'create_processed_line',
  POPULATE_LINES: 'populate_lines',
  COPY_LINES: 'copy_lines',
  LOCK_PRICING: 'lock_pricing'
};

// ============================================
// STATE MACHINE DEFINITION
// ============================================

export const POSWorkflowDefinition = {
  id: 'pos_workflow',
  name: 'POSOrderWorkflow',
  version: '1.0',
  
  entryPoints: [
    'WALK_IN_CUSTOMER',
    'PHONE_ORDER',
    'QUICK_REORDER',
    'QUOTE_CONVERSION',
    'WILL_CALL_PICKUP'
  ],
  
  initialState: POSStates.IDLE,
  
  states: {
    // ==========================================
    // INITIAL STATE
    // ==========================================
    [POSStates.IDLE]: {
      type: POSStateType.INITIAL,
      description: 'POS terminal ready for new transaction',
      transitions: [
        { to: POSStates.CUSTOMER_LOOKUP, trigger: POSTriggers.START_ORDER },
        { to: POSStates.QUICK_SALE, trigger: POSTriggers.START_QUICK_SALE },
        { to: POSStates.WILL_CALL_QUEUE, trigger: POSTriggers.WILL_CALL_MODE }
      ]
    },
    
    // ==========================================
    // CUSTOMER FLOW
    // ==========================================
    [POSStates.CUSTOMER_LOOKUP]: {
      type: POSStateType.SCREEN,
      description: 'Search or create customer',
      transitions: [
        { 
          to: POSStates.CUSTOMER_SELECTED, 
          trigger: POSTriggers.CUSTOMER_FOUND,
          guard: POSGuards.CUSTOMER_ACTIVE 
        },
        { 
          to: POSStates.NEW_CUSTOMER, 
          trigger: POSTriggers.CREATE_NEW 
        },
        { 
          to: POSStates.CREDIT_HOLD_BLOCK, 
          trigger: POSTriggers.CUSTOMER_FOUND,
          guard: POSGuards.CUSTOMER_ON_HOLD 
        },
        { 
          to: POSStates.IDLE, 
          trigger: POSTriggers.CANCEL 
        }
      ]
    },
    
    [POSStates.NEW_CUSTOMER]: {
      type: POSStateType.SCREEN,
      description: 'Quick customer creation form',
      transitions: [
        { to: POSStates.CUSTOMER_SELECTED, trigger: POSTriggers.CUSTOMER_CREATED },
        { to: POSStates.CUSTOMER_LOOKUP, trigger: POSTriggers.BACK }
      ]
    },
    
    [POSStates.CREDIT_HOLD_BLOCK]: {
      type: POSStateType.MODAL,
      description: 'Customer on credit hold notification',
      transitions: [
        { 
          to: POSStates.CUSTOMER_SELECTED, 
          trigger: POSTriggers.OVERRIDE_APPROVED,
          guard: POSGuards.MANAGER_OVERRIDE 
        },
        { to: POSStates.CASH_ONLY_MODE, trigger: POSTriggers.ACCEPT_CASH_ONLY },
        { to: POSStates.CUSTOMER_LOOKUP, trigger: POSTriggers.SELECT_DIFFERENT }
      ]
    },
    
    [POSStates.CASH_ONLY_MODE]: {
      type: POSStateType.FLAG,
      description: 'Order marked as cash/prepay only',
      transitions: [
        { 
          to: POSStates.CUSTOMER_SELECTED, 
          trigger: POSTriggers.CONTINUE,
          effect: POSEffects.SET_PAYMENT_REQUIRED_UPFRONT 
        }
      ]
    },
    
    [POSStates.CUSTOMER_SELECTED]: {
      type: POSStateType.CHECKPOINT,
      description: 'Customer confirmed for order',
      transitions: [
        { 
          to: POSStates.DIVISION_SELECT, 
          trigger: POSTriggers.CONTINUE,
          guard: POSGuards.MULTI_DIVISION_CUSTOMER 
        },
        { 
          to: POSStates.LINE_ENTRY, 
          trigger: POSTriggers.CONTINUE,
          guard: POSGuards.SINGLE_DIVISION 
        }
      ]
    },
    
    [POSStates.DIVISION_SELECT]: {
      type: POSStateType.SCREEN,
      description: 'Select billing/shipping division',
      transitions: [
        { to: POSStates.LINE_ENTRY, trigger: POSTriggers.DIVISION_SELECTED },
        { to: POSStates.CUSTOMER_SELECTED, trigger: POSTriggers.BACK }
      ]
    },
    
    // ==========================================
    // LINE ENTRY FLOW
    // ==========================================
    [POSStates.LINE_ENTRY]: {
      type: POSStateType.SCREEN,
      description: 'Add items to order',
      transitions: [
        { to: POSStates.PRODUCT_SEARCH, trigger: POSTriggers.SEARCH_PRODUCT },
        { to: POSStates.QUICK_ADD, trigger: POSTriggers.SCAN_BARCODE },
        { to: POSStates.CUT_CONFIGURATOR, trigger: POSTriggers.ADD_PROCESSING },
        { to: POSStates.QUOTE_LOOKUP, trigger: POSTriggers.FROM_QUOTE },
        { to: POSStates.REORDER_HISTORY, trigger: POSTriggers.FROM_HISTORY },
        { 
          to: POSStates.ORDER_REVIEW, 
          trigger: POSTriggers.PROCEED_TO_REVIEW,
          guard: POSGuards.HAS_LINES 
        },
        { 
          to: POSStates.IDLE, 
          trigger: POSTriggers.CANCEL,
          guard: POSGuards.CONFIRM_CANCEL 
        }
      ]
    },
    
    [POSStates.PRODUCT_SEARCH]: {
      type: POSStateType.MODAL,
      description: 'Search product catalog',
      transitions: [
        { to: POSStates.PRODUCT_DETAIL, trigger: POSTriggers.PRODUCT_SELECTED },
        { to: POSStates.LINE_ENTRY, trigger: POSTriggers.CLOSE }
      ]
    },
    
    [POSStates.PRODUCT_DETAIL]: {
      type: POSStateType.MODAL,
      description: 'View product details, check availability',
      transitions: [
        { 
          to: POSStates.LINE_ENTRY, 
          trigger: POSTriggers.ADD_TO_ORDER,
          effect: POSEffects.CREATE_LINE 
        },
        { to: POSStates.CUT_CONFIGURATOR, trigger: POSTriggers.ADD_WITH_PROCESSING },
        { to: POSStates.PRODUCT_SEARCH, trigger: POSTriggers.BACK }
      ]
    },
    
    [POSStates.QUICK_ADD]: {
      type: POSStateType.ACTION,
      description: 'Barcode scan adds item directly',
      transitions: [
        { to: POSStates.LINE_ENTRY, trigger: POSTriggers.ITEM_ADDED },
        { to: POSStates.PRODUCT_SEARCH, trigger: POSTriggers.ITEM_NOT_FOUND }
      ]
    },
    
    [POSStates.CUT_CONFIGURATOR]: {
      type: POSStateType.SCREEN,
      description: 'Configure cutting/processing',
      transitions: [
        { 
          to: POSStates.LINE_ENTRY, 
          trigger: POSTriggers.CONFIG_SAVED,
          effect: POSEffects.CREATE_PROCESSED_LINE 
        },
        { to: POSStates.PRODUCT_DETAIL, trigger: POSTriggers.BACK },
        { to: POSStates.LINE_ENTRY, trigger: POSTriggers.CANCEL }
      ]
    },
    
    [POSStates.QUOTE_LOOKUP]: {
      type: POSStateType.MODAL,
      description: 'Find and convert existing quote',
      transitions: [
        { 
          to: POSStates.LINE_ENTRY, 
          trigger: POSTriggers.QUOTE_LOADED,
          effect: POSEffects.POPULATE_LINES 
        },
        { to: POSStates.LINE_ENTRY, trigger: POSTriggers.CLOSE }
      ]
    },
    
    [POSStates.REORDER_HISTORY]: {
      type: POSStateType.MODAL,
      description: 'View customer order history for reorder',
      transitions: [
        { 
          to: POSStates.LINE_ENTRY, 
          trigger: POSTriggers.ITEMS_ADDED,
          effect: POSEffects.COPY_LINES 
        },
        { to: POSStates.LINE_ENTRY, trigger: POSTriggers.CLOSE }
      ]
    },
    
    // ==========================================
    // ORDER REVIEW FLOW
    // ==========================================
    [POSStates.ORDER_REVIEW]: {
      type: POSStateType.SCREEN,
      description: 'Review order before submission',
      transitions: [
        { 
          to: POSStates.PRICING_ADJUSTMENT, 
          trigger: POSTriggers.ADJUST_PRICING,
          guard: POSGuards.HAS_PRICING_PERMISSION 
        },
        { to: POSStates.SHIP_DATE_SELECT, trigger: POSTriggers.CONTINUE },
        { to: POSStates.LINE_ENTRY, trigger: POSTriggers.EDIT_LINES }
      ]
    },
    
    [POSStates.PRICING_ADJUSTMENT]: {
      type: POSStateType.MODAL,
      description: 'Apply discounts, adjust prices',
      transitions: [
        { 
          to: POSStates.APPROVAL_REQUIRED, 
          trigger: POSTriggers.SAVE,
          guard: POSGuards.EXCEEDS_AUTHORITY 
        },
        { 
          to: POSStates.ORDER_REVIEW, 
          trigger: POSTriggers.SAVE,
          guard: POSGuards.WITHIN_AUTHORITY 
        },
        { to: POSStates.ORDER_REVIEW, trigger: POSTriggers.CANCEL }
      ]
    },
    
    [POSStates.APPROVAL_REQUIRED]: {
      type: POSStateType.MODAL,
      description: 'Manager approval for pricing',
      transitions: [
        { 
          to: POSStates.ORDER_REVIEW, 
          trigger: POSTriggers.APPROVED,
          effect: POSEffects.LOCK_PRICING 
        },
        { to: POSStates.PRICING_ADJUSTMENT, trigger: POSTriggers.REJECTED }
      ]
    },
    
    // ==========================================
    // SHIPPING FLOW
    // ==========================================
    [POSStates.SHIP_DATE_SELECT]: {
      type: POSStateType.SCREEN,
      description: 'Select delivery method and date',
      transitions: [
        { to: POSStates.SHIPPING_CONFIG, trigger: POSTriggers.DELIVERY_SELECTED },
        { to: POSStates.WILL_CALL_CONFIG, trigger: POSTriggers.WILL_CALL_SELECTED },
        { to: POSStates.ORDER_REVIEW, trigger: POSTriggers.BACK }
      ]
    },
    
    [POSStates.SHIPPING_CONFIG]: {
      type: POSStateType.SCREEN,
      description: 'Configure shipping details',
      transitions: [
        { to: POSStates.PAYMENT_SELECT, trigger: POSTriggers.CONTINUE },
        { to: POSStates.SHIP_DATE_SELECT, trigger: POSTriggers.BACK }
      ]
    },
    
    [POSStates.WILL_CALL_CONFIG]: {
      type: POSStateType.SCREEN,
      description: 'Configure will-call pickup',
      transitions: [
        { to: POSStates.PAYMENT_SELECT, trigger: POSTriggers.CONTINUE },
        { to: POSStates.SHIP_DATE_SELECT, trigger: POSTriggers.BACK }
      ]
    },
    
    // ==========================================
    // PAYMENT FLOW
    // ==========================================
    [POSStates.PAYMENT_SELECT]: {
      type: POSStateType.SCREEN,
      description: 'Select payment method',
      transitions: [
        { 
          to: POSStates.PAYMENT_PROCESSING, 
          trigger: POSTriggers.PROCESS_PAYMENT,
          guard: POSGuards.PAYMENT_NOW 
        },
        { 
          to: POSStates.ORDER_CONFIRMATION, 
          trigger: POSTriggers.SUBMIT_ORDER,
          guard: POSGuards.TERMS_PAYMENT 
        },
        { to: POSStates.SHIPPING_CONFIG, trigger: POSTriggers.BACK }
      ]
    },
    
    [POSStates.PAYMENT_PROCESSING]: {
      type: POSStateType.SCREEN,
      description: 'Process payment (card, cash, check)',
      transitions: [
        { to: POSStates.ORDER_CONFIRMATION, trigger: POSTriggers.PAYMENT_COMPLETE },
        { to: POSStates.PAYMENT_SELECT, trigger: POSTriggers.PAYMENT_FAILED },
        { to: POSStates.PAYMENT_SELECT, trigger: POSTriggers.CANCEL }
      ]
    },
    
    // ==========================================
    // CONFIRMATION FLOW
    // ==========================================
    [POSStates.ORDER_CONFIRMATION]: {
      type: POSStateType.SCREEN,
      description: 'Order submitted successfully',
      transitions: [
        { to: POSStates.PRINT_OPTIONS, trigger: POSTriggers.PRINT },
        { to: POSStates.IDLE, trigger: POSTriggers.NEW_ORDER },
        { 
          to: POSStates.QUICK_CUT_QUEUE, 
          trigger: POSTriggers.HAS_COUNTER_CUTS,
          guard: POSGuards.PROCESSING_REQUIRED 
        }
      ]
    },
    
    [POSStates.PRINT_OPTIONS]: {
      type: POSStateType.MODAL,
      description: 'Print order confirmation, picking ticket',
      transitions: [
        { to: POSStates.ORDER_CONFIRMATION, trigger: POSTriggers.PRINTED },
        { to: POSStates.ORDER_CONFIRMATION, trigger: POSTriggers.SKIP }
      ]
    },
    
    [POSStates.QUICK_CUT_QUEUE]: {
      type: POSStateType.NOTIFICATION,
      description: 'Notify shop floor of counter cut',
      transitions: [
        { to: POSStates.ORDER_CONFIRMATION, trigger: POSTriggers.ACKNOWLEDGED }
      ]
    },
    
    // ==========================================
    // WILL-CALL FLOW
    // ==========================================
    [POSStates.WILL_CALL_QUEUE]: {
      type: POSStateType.SCREEN,
      description: 'View orders ready for pickup',
      transitions: [
        { to: POSStates.WILL_CALL_VERIFY, trigger: POSTriggers.SELECT_ORDER },
        { to: POSStates.IDLE, trigger: POSTriggers.BACK }
      ]
    },
    
    [POSStates.WILL_CALL_VERIFY]: {
      type: POSStateType.SCREEN,
      description: 'Verify customer identity for pickup',
      transitions: [
        { to: POSStates.WILL_CALL_LOAD, trigger: POSTriggers.VERIFIED },
        { to: POSStates.WILL_CALL_QUEUE, trigger: POSTriggers.BACK }
      ]
    },
    
    [POSStates.WILL_CALL_LOAD]: {
      type: POSStateType.SCREEN,
      description: 'Confirm items loaded, capture signature',
      transitions: [
        { to: POSStates.WILL_CALL_COMPLETE, trigger: POSTriggers.COMPLETE },
        { to: POSStates.WILL_CALL_PARTIAL, trigger: POSTriggers.PARTIAL_PICKUP },
        { to: POSStates.WILL_CALL_VERIFY, trigger: POSTriggers.BACK }
      ]
    },
    
    [POSStates.WILL_CALL_PARTIAL]: {
      type: POSStateType.MODAL,
      description: 'Handle partial pickup',
      transitions: [
        { to: POSStates.WILL_CALL_COMPLETE, trigger: POSTriggers.CONFIRMED },
        { to: POSStates.WILL_CALL_LOAD, trigger: POSTriggers.BACK }
      ]
    },
    
    [POSStates.WILL_CALL_COMPLETE]: {
      type: POSStateType.SCREEN,
      description: 'Pickup complete, documents printed',
      transitions: [
        { to: POSStates.WILL_CALL_QUEUE, trigger: POSTriggers.NEXT_PICKUP },
        { to: POSStates.IDLE, trigger: POSTriggers.DONE }
      ]
    },
    
    // ==========================================
    // QUICK SALE FLOW
    // ==========================================
    [POSStates.QUICK_SALE]: {
      type: POSStateType.SCREEN,
      description: 'Simplified cash sale flow',
      transitions: [
        { to: POSStates.QUICK_SALE_SCAN, trigger: POSTriggers.SCAN_ITEMS },
        { 
          to: POSStates.QUICK_SALE_PAYMENT, 
          trigger: POSTriggers.CHECKOUT,
          guard: POSGuards.HAS_ITEMS 
        },
        { to: POSStates.IDLE, trigger: POSTriggers.CANCEL }
      ]
    },
    
    [POSStates.QUICK_SALE_SCAN]: {
      type: POSStateType.ACTION,
      description: 'Rapid barcode scanning',
      transitions: [
        { to: POSStates.QUICK_SALE, trigger: POSTriggers.ITEM_ADDED }
      ]
    },
    
    [POSStates.QUICK_SALE_PAYMENT]: {
      type: POSStateType.SCREEN,
      description: 'Quick payment processing',
      transitions: [
        { to: POSStates.QUICK_SALE_RECEIPT, trigger: POSTriggers.PAYMENT_COMPLETE },
        { to: POSStates.QUICK_SALE, trigger: POSTriggers.BACK }
      ]
    },
    
    [POSStates.QUICK_SALE_RECEIPT]: {
      type: POSStateType.SCREEN,
      description: 'Print receipt, complete sale',
      transitions: [
        { to: POSStates.IDLE, trigger: POSTriggers.DONE }
      ]
    }
  },
  
  // ==========================================
  // PARALLEL STATES (Background Processes)
  // ==========================================
  parallelStates: {
    INVENTORY_CHECK: {
      description: 'Background availability check',
      runsDuring: [POSStates.LINE_ENTRY, POSStates.PRODUCT_DETAIL, POSStates.CUT_CONFIGURATOR]
    },
    PRICE_CALCULATION: {
      description: 'Real-time price updates',
      runsDuring: [POSStates.LINE_ENTRY, POSStates.ORDER_REVIEW, POSStates.PRICING_ADJUSTMENT]
    },
    CREDIT_CHECK: {
      description: 'Credit limit monitoring',
      runsDuring: [POSStates.LINE_ENTRY, POSStates.ORDER_REVIEW, POSStates.PAYMENT_SELECT]
    }
  },
  
  // ==========================================
  // TIMEOUT RULES
  // ==========================================
  timeoutRules: [
    {
      state: '*',
      idleTimeoutMinutes: 15,
      action: 'prompt_continue'
    },
    {
      state: '*',
      idleTimeoutMinutes: 30,
      action: 'auto_suspend'
    },
    {
      state: POSStates.PAYMENT_PROCESSING,
      timeoutSeconds: 120,
      action: 'payment_timeout_error'
    }
  ]
};

// ============================================
// STATE MACHINE CLASS
// ============================================

export class POSWorkflowStateMachine {
  constructor(sessionId, initialContext = {}) {
    this.sessionId = sessionId;
    this.definition = POSWorkflowDefinition;
    this.currentState = this.definition.initialState;
    this.stateHistory = [{ state: this.currentState, timestamp: new Date(), context: {} }];
    this.context = {
      sessionId,
      entryPoint: null,
      customer: null,
      division: null,
      lines: [],
      pricing: {
        subtotal: 0,
        taxAmount: 0,
        freightAmount: 0,
        totalAmount: 0,
        discounts: [],
        locked: false
      },
      shipping: {
        method: null, // 'delivery' | 'will_call'
        address: null,
        requestedDate: null,
        promisedDate: null
      },
      payment: {
        method: null,
        cashOnly: false,
        paidUpfront: false,
        transactionId: null
      },
      flags: {
        creditHold: false,
        managerOverride: false,
        processingRequired: false
      },
      createdAt: new Date(),
      lastActivity: new Date(),
      ...initialContext
    };
    this.activeParallelStates = new Set();
  }
  
  /**
   * Get current state definition
   */
  getStateDefinition(state = this.currentState) {
    return this.definition.states[state];
  }
  
  /**
   * Get available transitions from current state
   */
  getAvailableTransitions() {
    const stateDefinition = this.getStateDefinition();
    if (!stateDefinition) return [];
    return stateDefinition.transitions.map(t => ({
      trigger: t.trigger,
      to: t.to,
      guard: t.guard || null,
      effect: t.effect || null
    }));
  }
  
  /**
   * Check if a transition is valid
   */
  canTransition(trigger, guardEvaluator = null) {
    const stateDefinition = this.getStateDefinition();
    if (!stateDefinition) return false;
    
    const transition = stateDefinition.transitions.find(t => t.trigger === trigger);
    if (!transition) return false;
    
    // If there's a guard, evaluate it
    if (transition.guard && guardEvaluator) {
      return guardEvaluator(transition.guard, this.context);
    }
    
    // If there's a guard but no evaluator, we can't determine validity
    if (transition.guard) return null;
    
    return true;
  }
  
  /**
   * Execute a transition
   */
  transition(trigger, payload = {}, guardEvaluator = null, effectExecutor = null) {
    const stateDefinition = this.getStateDefinition();
    if (!stateDefinition) {
      return {
        success: false,
        error: `Invalid current state: ${this.currentState}`,
        currentState: this.currentState
      };
    }
    
    // Find matching transitions (may be multiple with different guards)
    const matchingTransitions = stateDefinition.transitions.filter(t => t.trigger === trigger);
    
    if (matchingTransitions.length === 0) {
      return {
        success: false,
        error: `No transition for trigger "${trigger}" from state "${this.currentState}"`,
        currentState: this.currentState,
        availableTransitions: this.getAvailableTransitions()
      };
    }
    
    // Find the first transition that passes guard (if any)
    let selectedTransition = null;
    for (const transition of matchingTransitions) {
      if (transition.guard) {
        if (guardEvaluator && guardEvaluator(transition.guard, this.context)) {
          selectedTransition = transition;
          break;
        }
      } else {
        selectedTransition = transition;
        break;
      }
    }
    
    if (!selectedTransition) {
      return {
        success: false,
        error: `No valid transition found for trigger "${trigger}" (guards not satisfied)`,
        currentState: this.currentState
      };
    }
    
    // Execute effect if present
    if (selectedTransition.effect && effectExecutor) {
      const effectResult = effectExecutor(selectedTransition.effect, this.context, payload);
      if (effectResult && effectResult.context) {
        this.context = { ...this.context, ...effectResult.context };
      }
    }
    
    // Apply payload to context
    if (payload && Object.keys(payload).length > 0) {
      this.context = { ...this.context, ...payload };
    }
    
    // Record previous state
    const previousState = this.currentState;
    
    // Execute transition
    this.currentState = selectedTransition.to;
    this.context.lastActivity = new Date();
    
    // Record history
    this.stateHistory.push({
      state: this.currentState,
      previousState,
      trigger,
      guard: selectedTransition.guard,
      effect: selectedTransition.effect,
      timestamp: new Date(),
      payload
    });
    
    // Update parallel states
    this.updateParallelStates();
    
    return {
      success: true,
      previousState,
      currentState: this.currentState,
      stateDefinition: this.getStateDefinition(),
      activeParallelStates: Array.from(this.activeParallelStates),
      context: this.context
    };
  }
  
  /**
   * Update which parallel states are active based on current state
   */
  updateParallelStates() {
    this.activeParallelStates.clear();
    
    for (const [parallelStateId, parallelState] of Object.entries(this.definition.parallelStates)) {
      if (parallelState.runsDuring.includes(this.currentState)) {
        this.activeParallelStates.add(parallelStateId);
      }
    }
  }
  
  /**
   * Get the applicable timeout rule for current state
   */
  getTimeoutRule() {
    const specificRule = this.definition.timeoutRules.find(r => r.state === this.currentState);
    if (specificRule) return specificRule;
    
    // Return wildcard rules
    return this.definition.timeoutRules.filter(r => r.state === '*');
  }
  
  /**
   * Check if session has timed out
   */
  checkTimeout() {
    const now = new Date();
    const idleMinutes = (now - new Date(this.context.lastActivity)) / 1000 / 60;
    
    const timeoutRules = this.getTimeoutRule();
    const rules = Array.isArray(timeoutRules) ? timeoutRules : [timeoutRules];
    
    for (const rule of rules) {
      if (rule.idleTimeoutMinutes && idleMinutes >= rule.idleTimeoutMinutes) {
        return { timedOut: true, action: rule.action, idleMinutes };
      }
      if (rule.timeoutSeconds && (idleMinutes * 60) >= rule.timeoutSeconds) {
        return { timedOut: true, action: rule.action, idleSeconds: idleMinutes * 60 };
      }
    }
    
    return { timedOut: false };
  }
  
  /**
   * Get full session state for persistence
   */
  toJSON() {
    return {
      sessionId: this.sessionId,
      currentState: this.currentState,
      stateHistory: this.stateHistory,
      context: this.context,
      activeParallelStates: Array.from(this.activeParallelStates),
      createdAt: this.context.createdAt,
      lastActivity: this.context.lastActivity
    };
  }
  
  /**
   * Restore session from persisted state
   */
  static fromJSON(data) {
    const machine = new POSWorkflowStateMachine(data.sessionId);
    machine.currentState = data.currentState;
    machine.stateHistory = data.stateHistory || [];
    machine.context = data.context || {};
    machine.activeParallelStates = new Set(data.activeParallelStates || []);
    return machine;
  }
  
  /**
   * Reset to initial state
   */
  reset() {
    this.currentState = this.definition.initialState;
    this.stateHistory = [{ state: this.currentState, timestamp: new Date(), context: {} }];
    this.context = {
      sessionId: this.sessionId,
      entryPoint: null,
      customer: null,
      division: null,
      lines: [],
      pricing: {
        subtotal: 0,
        taxAmount: 0,
        freightAmount: 0,
        totalAmount: 0,
        discounts: [],
        locked: false
      },
      shipping: {
        method: null,
        address: null,
        requestedDate: null,
        promisedDate: null
      },
      payment: {
        method: null,
        cashOnly: false,
        paidUpfront: false,
        transactionId: null
      },
      flags: {
        creditHold: false,
        managerOverride: false,
        processingRequired: false
      },
      createdAt: new Date(),
      lastActivity: new Date()
    };
    this.activeParallelStates.clear();
    return this;
  }
}

export default POSWorkflowStateMachine;
