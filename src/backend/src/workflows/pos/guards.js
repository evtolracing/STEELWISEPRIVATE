/**
 * POS Workflow Guards
 * 
 * Guard functions that determine whether a transition can occur.
 * Each guard returns true if the transition is allowed, false otherwise.
 */

import { POSGuards } from './POSWorkflowStateMachine.js';

// ============================================
// GUARD EVALUATOR REGISTRY
// ============================================

const guardFunctions = {
  /**
   * Check if customer is active (not on hold, not inactive)
   */
  [POSGuards.CUSTOMER_ACTIVE]: (context) => {
    const customer = context.customer;
    if (!customer) return false;
    return customer.isActive && customer.creditStatus !== 'HOLD';
  },
  
  /**
   * Check if customer is on credit hold
   */
  [POSGuards.CUSTOMER_ON_HOLD]: (context) => {
    const customer = context.customer;
    if (!customer) return false;
    return customer.creditStatus === 'HOLD' || customer.creditHold === true;
  },
  
  /**
   * Check if manager override has been granted
   */
  [POSGuards.MANAGER_OVERRIDE]: (context) => {
    return context.flags?.managerOverride === true;
  },
  
  /**
   * Check if customer has multiple divisions
   */
  [POSGuards.MULTI_DIVISION_CUSTOMER]: (context) => {
    const customer = context.customer;
    if (!customer) return false;
    return customer.divisions && customer.divisions.length > 1;
  },
  
  /**
   * Check if customer has single division (or no divisions)
   */
  [POSGuards.SINGLE_DIVISION]: (context) => {
    const customer = context.customer;
    if (!customer) return true; // No customer, allow pass-through
    return !customer.divisions || customer.divisions.length <= 1;
  },
  
  /**
   * Check if order has at least one line item
   */
  [POSGuards.HAS_LINES]: (context) => {
    return context.lines && context.lines.length > 0;
  },
  
  /**
   * Confirm cancel requires user confirmation (handled by UI)
   * This guard always returns true - actual confirmation is UI responsibility
   */
  [POSGuards.CONFIRM_CANCEL]: (context) => {
    return context.cancelConfirmed === true;
  },
  
  /**
   * Check if user has pricing adjustment permissions
   */
  [POSGuards.HAS_PRICING_PERMISSION]: (context) => {
    const user = context.currentUser;
    if (!user) return false;
    
    const allowedRoles = ['ADMIN', 'SALES', 'MANAGER'];
    return allowedRoles.includes(user.role) || user.permissions?.includes('pricing.adjust');
  },
  
  /**
   * Check if price adjustments exceed user's authority
   */
  [POSGuards.EXCEEDS_AUTHORITY]: (context) => {
    const user = context.currentUser;
    const pricing = context.pricing;
    
    if (!user || !pricing) return false;
    
    // Calculate total discount percentage
    const discountPct = pricing.subtotal > 0 
      ? ((pricing.discounts?.reduce((sum, d) => sum + d.amount, 0) || 0) / pricing.subtotal) * 100 
      : 0;
    
    // Authority limits by role
    const authorityLimits = {
      ADMIN: 100,
      MANAGER: 25,
      SALES: 10,
      DEFAULT: 5
    };
    
    const limit = authorityLimits[user.role] || authorityLimits.DEFAULT;
    return discountPct > limit;
  },
  
  /**
   * Check if price adjustments are within user's authority
   */
  [POSGuards.WITHIN_AUTHORITY]: (context) => {
    // Inverse of EXCEEDS_AUTHORITY
    return !guardFunctions[POSGuards.EXCEEDS_AUTHORITY](context);
  },
  
  /**
   * Check if payment is required now (not on terms)
   */
  [POSGuards.PAYMENT_NOW]: (context) => {
    return context.payment?.method !== 'TERMS' && context.payment?.method !== 'NET30';
  },
  
  /**
   * Check if payment is on terms (NET30, etc.)
   */
  [POSGuards.TERMS_PAYMENT]: (context) => {
    const termsPayments = ['TERMS', 'NET30', 'NET60', 'NET90'];
    return termsPayments.includes(context.payment?.method);
  },
  
  /**
   * Check if order has processing/cutting required
   */
  [POSGuards.PROCESSING_REQUIRED]: (context) => {
    if (!context.lines) return false;
    return context.lines.some(line => 
      line.processing || line.cutConfiguration || line.operationType
    );
  },
  
  /**
   * Check if order has items (for quick sale)
   */
  [POSGuards.HAS_ITEMS]: (context) => {
    return context.lines && context.lines.length > 0;
  }
};

// ============================================
// GUARD EVALUATOR
// ============================================

/**
 * Evaluate a guard condition
 * @param {string} guardId - The guard identifier
 * @param {object} context - The workflow context
 * @returns {boolean} - Whether the guard passes
 */
export function evaluateGuard(guardId, context) {
  const guardFn = guardFunctions[guardId];
  
  if (!guardFn) {
    console.warn(`Unknown guard: ${guardId}`);
    return false;
  }
  
  try {
    return guardFn(context);
  } catch (error) {
    console.error(`Error evaluating guard ${guardId}:`, error);
    return false;
  }
}

/**
 * Evaluate multiple guards (all must pass)
 * @param {string[]} guardIds - Array of guard identifiers
 * @param {object} context - The workflow context
 * @returns {boolean} - Whether all guards pass
 */
export function evaluateGuards(guardIds, context) {
  return guardIds.every(guardId => evaluateGuard(guardId, context));
}

/**
 * Get all guard results for debugging/display
 * @param {object} context - The workflow context
 * @returns {object} - Map of guard ID to result
 */
export function getAllGuardResults(context) {
  const results = {};
  
  for (const guardId of Object.keys(guardFunctions)) {
    try {
      results[guardId] = guardFunctions[guardId](context);
    } catch (error) {
      results[guardId] = { error: error.message };
    }
  }
  
  return results;
}

export default evaluateGuard;
