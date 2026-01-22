/**
 * POS Workflow Type Definitions
 * 
 * TypeScript-style JSDoc type definitions for the POS workflow.
 * These can be used with @ts-check or converted to .d.ts files.
 */

// ============================================
// STATE MACHINE TYPES
// ============================================

/**
 * @typedef {'initial' | 'screen' | 'modal' | 'action' | 'checkpoint' | 'flag' | 'notification'} POSStateType
 */

/**
 * @typedef {Object} POSTransition
 * @property {string} to - Target state ID
 * @property {string} trigger - Trigger that causes this transition
 * @property {string} [guard] - Guard condition that must pass
 * @property {string} [effect] - Effect to execute during transition
 */

/**
 * @typedef {Object} POSStateDefinition
 * @property {POSStateType} type - Type of state
 * @property {string} description - Human-readable description
 * @property {POSTransition[]} transitions - Available transitions from this state
 */

/**
 * @typedef {Object} POSParallelState
 * @property {string} description - Description of the parallel process
 * @property {string[]} runsDuring - States during which this runs
 */

/**
 * @typedef {Object} POSTimeoutRule
 * @property {string} state - State this rule applies to ('*' for all)
 * @property {number} [idleTimeoutMinutes] - Idle timeout in minutes
 * @property {number} [timeoutSeconds] - Timeout in seconds
 * @property {string} action - Action to take on timeout
 */

/**
 * @typedef {Object} POSWorkflowDefinitionType
 * @property {string} id - Workflow identifier
 * @property {string} name - Workflow name
 * @property {string} version - Version string
 * @property {string[]} entryPoints - Valid entry points
 * @property {string} initialState - Initial state ID
 * @property {Object.<string, POSStateDefinition>} states - State definitions
 * @property {Object.<string, POSParallelState>} parallelStates - Parallel state definitions
 * @property {POSTimeoutRule[]} timeoutRules - Timeout rules
 */

// ============================================
// CONTEXT TYPES
// ============================================

/**
 * @typedef {Object} POSUser
 * @property {string} id - User ID
 * @property {string} email - User email
 * @property {string} name - Full name
 * @property {string} role - User role
 * @property {string} organizationId - Organization ID
 * @property {string} [organizationName] - Organization name
 * @property {string[]} [permissions] - User permissions
 */

/**
 * @typedef {Object} POSAddress
 * @property {string} [line1] - Address line 1
 * @property {string} [line2] - Address line 2
 * @property {string} [city] - City
 * @property {string} [state] - State/Province
 * @property {string} [postalCode] - Postal/ZIP code
 * @property {string} [country] - Country
 */

/**
 * @typedef {Object} POSCustomer
 * @property {string} id - Customer ID
 * @property {string} name - Customer name
 * @property {string} type - Organization type
 * @property {POSAddress} address - Address
 * @property {string} [phone] - Phone number
 * @property {string} [email] - Email
 * @property {boolean} isActive - Is active
 * @property {string} creditStatus - Credit status (ACTIVE, HOLD, COD)
 * @property {number} creditLimit - Credit limit
 * @property {number} creditAvailable - Available credit
 * @property {Object[]} [divisions] - Customer divisions
 * @property {string} [defaultPaymentTerms] - Default payment terms
 * @property {boolean} [taxExempt] - Tax exempt flag
 * @property {boolean} [isNewCustomer] - Is newly created
 */

/**
 * @typedef {Object} POSProcessingConfig
 * @property {string} operationType - Operation type (CTL, SLIT, SHEAR, BLANK)
 * @property {Object} specifications - Processing specifications
 * @property {number} pieces - Number of pieces
 * @property {number} [cutLength] - Cut length
 * @property {number[]} [slitWidths] - Slit widths
 * @property {Object} [blankDimensions] - Blank dimensions
 * @property {string} [processingNotes] - Processing notes
 * @property {boolean} isCounterCut - Is counter cut (immediate processing)
 * @property {number} [estimatedTime] - Estimated processing time
 * @property {number} processingCharge - Processing charge
 */

/**
 * @typedef {Object} POSLineItem
 * @property {string} id - Line ID
 * @property {number} lineNumber - Line number
 * @property {string} [productId] - Product ID
 * @property {string} [productSku] - Product SKU
 * @property {string} productName - Product name
 * @property {string} description - Description
 * @property {string} [gradeId] - Grade ID
 * @property {string} [gradeCode] - Grade code
 * @property {number} [thickness] - Thickness
 * @property {number} [width] - Width
 * @property {number} [length] - Length
 * @property {number} quantity - Quantity
 * @property {string} unit - Unit (LB, TON, EACH)
 * @property {number} unitPrice - Unit price
 * @property {string} priceUnit - Price unit (CWT, LB, TON)
 * @property {number} extendedPrice - Extended price
 * @property {POSProcessingConfig} [processing] - Processing config
 * @property {number} [processingCharge] - Processing charge
 * @property {string} [notes] - Notes
 * @property {string} inventoryStatus - Inventory status
 * @property {number} [availableQty] - Available quantity
 * @property {string} [processingStatus] - Processing status
 * @property {string[]} [availableWorkCenters] - Available work centers
 * @property {string} [sourceQuoteId] - Source quote ID
 * @property {string} [sourceOrderId] - Source order ID
 * @property {Date} addedAt - When added
 */

/**
 * @typedef {Object} POSDiscount
 * @property {string} id - Discount ID
 * @property {string} type - Discount type (PERCENTAGE, FIXED, LINE)
 * @property {string} [code] - Discount code
 * @property {string} description - Description
 * @property {number} [percentage] - Discount percentage
 * @property {number} amount - Discount amount
 * @property {string} appliedBy - Applied by user ID
 * @property {Date} appliedAt - When applied
 */

/**
 * @typedef {Object} POSPricing
 * @property {number} subtotal - Subtotal
 * @property {number} [processingTotal] - Total processing charges
 * @property {number} [discountTotal] - Total discounts
 * @property {number} taxAmount - Tax amount
 * @property {number} freightAmount - Freight amount
 * @property {number} totalAmount - Total amount
 * @property {POSDiscount[]} discounts - Applied discounts
 * @property {boolean} locked - Pricing locked
 * @property {Date} [lockedAt] - When locked
 * @property {string} [approvedBy] - Approved by user ID
 * @property {string} [approvalNotes] - Approval notes
 */

/**
 * @typedef {Object} POSShipping
 * @property {'delivery' | 'will_call' | null} method - Shipping method
 * @property {POSAddress} [address] - Shipping address
 * @property {Date} [requestedDate] - Requested delivery date
 * @property {Date} [promisedDate] - Promised delivery date
 * @property {string} [carrier] - Carrier
 * @property {string} [freightTerms] - Freight terms
 */

/**
 * @typedef {Object} POSPayment
 * @property {string} [method] - Payment method
 * @property {boolean} cashOnly - Cash only flag
 * @property {boolean} paidUpfront - Paid upfront flag
 * @property {string} [transactionId] - Payment transaction ID
 * @property {number} [amountPaid] - Amount paid
 * @property {number} [changeGiven] - Change given
 */

/**
 * @typedef {Object} POSFlags
 * @property {boolean} creditHold - Customer on credit hold
 * @property {boolean} managerOverride - Manager override granted
 * @property {boolean} processingRequired - Order has processing
 * @property {boolean} [cancelConfirmed] - Cancel confirmed by user
 */

/**
 * @typedef {Object} POSContext
 * @property {string} sessionId - Session ID
 * @property {string} [entryPoint] - Entry point
 * @property {string} [terminalId] - Terminal ID
 * @property {POSUser} [currentUser] - Current user
 * @property {POSCustomer} [customer] - Selected customer
 * @property {Object} [division] - Selected division
 * @property {POSLineItem[]} lines - Line items
 * @property {POSPricing} pricing - Pricing
 * @property {POSShipping} shipping - Shipping
 * @property {POSPayment} payment - Payment
 * @property {POSFlags} flags - Flags
 * @property {string} [orderId] - Created order ID
 * @property {string} [orderNumber] - Created order number
 * @property {string} [sourceQuoteId] - Source quote ID
 * @property {string} [sourceQuoteNumber] - Source quote number
 * @property {string} [poReference] - PO reference
 * @property {string} [notes] - Order notes
 * @property {boolean} [suspended] - Session suspended
 * @property {Date} [suspendedAt] - When suspended
 * @property {Date} createdAt - When created
 * @property {Date} lastActivity - Last activity time
 */

// ============================================
// TRANSITION RESULT TYPES
// ============================================

/**
 * @typedef {Object} POSTransitionResult
 * @property {boolean} success - Whether transition succeeded
 * @property {string} [error] - Error message if failed
 * @property {string} [previousState] - Previous state
 * @property {string} [currentState] - Current state
 * @property {POSStateDefinition} [stateDefinition] - Current state definition
 * @property {string[]} [activeParallelStates] - Active parallel states
 * @property {POSContext} [context] - Updated context
 * @property {POSTransition[]} [availableTransitions] - Available transitions
 */

/**
 * @typedef {Object} POSSessionInfo
 * @property {string} sessionId - Session ID
 * @property {string} currentState - Current state
 * @property {POSStateDefinition} stateDefinition - Current state definition
 * @property {POSTransition[]} availableTransitions - Available transitions
 * @property {string[]} activeParallelStates - Active parallel states
 * @property {POSContext} context - Session context
 * @property {Object} timeout - Timeout status
 * @property {Object[]} stateHistory - State history
 */

/**
 * @typedef {Object} POSAvailableAction
 * @property {string} trigger - Trigger name
 * @property {string} targetState - Target state
 * @property {string} [guard] - Guard condition
 * @property {boolean} guardPasses - Whether guard passes
 * @property {string} [effect] - Effect to execute
 */

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

/**
 * @typedef {Object} CreateSessionRequest
 * @property {string} userId - User ID
 * @property {string} [entryPoint] - Entry point
 * @property {string} [terminalId] - Terminal ID
 */

/**
 * @typedef {Object} TransitionRequest
 * @property {string} trigger - Trigger to execute
 * @property {Object} [payload] - Additional data
 */

/**
 * @typedef {Object} SelectCustomerRequest
 * @property {string} customerId - Customer ID
 */

/**
 * @typedef {Object} CreateCustomerRequest
 * @property {string} name - Customer name
 * @property {string} [type] - Organization type
 * @property {string} [address] - Address
 * @property {string} [city] - City
 * @property {string} [state] - State
 * @property {string} [postalCode] - Postal code
 * @property {string} [country] - Country
 * @property {string} [phone] - Phone
 * @property {string} [email] - Email
 */

/**
 * @typedef {Object} AddProductRequest
 * @property {string} [productId] - Product ID
 * @property {string} [productSku] - Product SKU
 * @property {string} [productName] - Product name
 * @property {string} [description] - Description
 * @property {string} [gradeId] - Grade ID
 * @property {number} [thickness] - Thickness
 * @property {number} [width] - Width
 * @property {number} [length] - Length
 * @property {number} quantity - Quantity
 * @property {string} [unit] - Unit
 * @property {number} [unitPrice] - Unit price
 * @property {string} [priceUnit] - Price unit
 * @property {string} [notes] - Notes
 */

/**
 * @typedef {Object} AddProcessedItemRequest
 * @property {AddProductRequest} product - Product data
 * @property {POSProcessingConfig} processing - Processing config
 */

/**
 * @typedef {Object} ApplyDiscountRequest
 * @property {string} [type] - Discount type
 * @property {string} [code] - Discount code
 * @property {string} [description] - Description
 * @property {number} [percentage] - Percentage
 * @property {number} [amount] - Fixed amount
 */

/**
 * @typedef {Object} OrderSubmitResult
 * @property {boolean} success - Whether submission succeeded
 * @property {string} [error] - Error message
 * @property {Object} order - Created order
 * @property {string} order.id - Order ID
 * @property {string} order.orderNumber - Order number
 * @property {string} order.customer - Customer name
 * @property {number} order.total - Total amount
 * @property {number} order.lineCount - Number of lines
 * @property {string} order.status - Order status
 * @property {POSTransitionResult} transition - Transition result
 */

export default {};
