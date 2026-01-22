/**
 * POS Workflow Effects
 * 
 * Effect functions that execute side effects during transitions.
 * Effects can modify context, trigger external actions, or perform async operations.
 */

import { POSEffects } from './POSWorkflowStateMachine.js';

// ============================================
// EFFECT EXECUTOR REGISTRY
// ============================================

const effectFunctions = {
  /**
   * Set payment required upfront flag (for credit hold customers)
   */
  [POSEffects.SET_PAYMENT_REQUIRED_UPFRONT]: (context, payload) => {
    return {
      context: {
        payment: {
          ...context.payment,
          cashOnly: true,
          paidUpfront: true
        },
        flags: {
          ...context.flags,
          creditHold: true
        }
      },
      async: null
    };
  },
  
  /**
   * Create a new line item
   */
  [POSEffects.CREATE_LINE]: (context, payload) => {
    const newLine = {
      id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lineNumber: (context.lines?.length || 0) + 1,
      productId: payload.productId || null,
      productSku: payload.productSku || null,
      productName: payload.productName || payload.description || '',
      description: payload.description || '',
      gradeId: payload.gradeId || null,
      gradeCode: payload.gradeCode || null,
      thickness: payload.thickness || null,
      width: payload.width || null,
      length: payload.length || null,
      quantity: payload.quantity || 0,
      unit: payload.unit || 'LB',
      unitPrice: payload.unitPrice || 0,
      priceUnit: payload.priceUnit || 'CWT',
      extendedPrice: calculateExtendedPrice(payload),
      processing: null,
      notes: payload.notes || '',
      inventoryStatus: payload.inventoryStatus || 'CHECKING',
      addedAt: new Date()
    };
    
    const updatedLines = [...(context.lines || []), newLine];
    
    return {
      context: {
        lines: updatedLines,
        pricing: recalculatePricing(updatedLines, context.pricing)
      },
      async: {
        action: 'CHECK_INVENTORY',
        lineId: newLine.id,
        productId: newLine.productId
      }
    };
  },
  
  /**
   * Create a processed (cut) line item
   */
  [POSEffects.CREATE_PROCESSED_LINE]: (context, payload) => {
    const processingConfig = {
      operationType: payload.operationType || 'CTL', // CTL, SLIT, SHEAR, BLANK
      specifications: payload.cutSpecifications || {},
      pieces: payload.pieces || 1,
      cutLength: payload.cutLength || null,
      slitWidths: payload.slitWidths || [],
      blankDimensions: payload.blankDimensions || null,
      processingNotes: payload.processingNotes || '',
      isCounterCut: payload.isCounterCut || false, // Counter cuts need immediate shop notification
      estimatedTime: payload.estimatedTime || null,
      processingCharge: payload.processingCharge || 0
    };
    
    const newLine = {
      id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lineNumber: (context.lines?.length || 0) + 1,
      productId: payload.productId || null,
      productSku: payload.productSku || null,
      productName: payload.productName || payload.description || '',
      description: buildProcessedDescription(payload, processingConfig),
      gradeId: payload.gradeId || null,
      gradeCode: payload.gradeCode || null,
      thickness: payload.thickness || null,
      width: payload.width || null,
      length: processingConfig.cutLength || payload.length || null,
      quantity: payload.quantity || 0,
      unit: payload.unit || 'LB',
      unitPrice: payload.unitPrice || 0,
      priceUnit: payload.priceUnit || 'CWT',
      extendedPrice: calculateExtendedPrice(payload),
      processing: processingConfig,
      processingCharge: processingConfig.processingCharge,
      notes: payload.notes || '',
      inventoryStatus: 'CHECKING',
      addedAt: new Date()
    };
    
    const updatedLines = [...(context.lines || []), newLine];
    
    return {
      context: {
        lines: updatedLines,
        pricing: recalculatePricing(updatedLines, context.pricing),
        flags: {
          ...context.flags,
          processingRequired: true
        }
      },
      async: {
        action: 'CHECK_PROCESSING_AVAILABILITY',
        lineId: newLine.id,
        operationType: processingConfig.operationType
      }
    };
  },
  
  /**
   * Populate lines from a quote
   */
  [POSEffects.POPULATE_LINES]: (context, payload) => {
    const quoteLines = payload.quoteLines || [];
    
    const newLines = quoteLines.map((ql, idx) => ({
      id: `line_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
      lineNumber: (context.lines?.length || 0) + idx + 1,
      productId: ql.productId || null,
      productSku: ql.productSku || null,
      productName: ql.productName || ql.description || '',
      description: ql.description || '',
      gradeId: ql.gradeId || null,
      gradeCode: ql.gradeCode || null,
      thickness: ql.thickness || null,
      width: ql.width || null,
      length: ql.length || null,
      quantity: ql.quantity || 0,
      unit: ql.unit || 'LB',
      unitPrice: ql.unitPrice || 0,
      priceUnit: ql.priceUnit || 'CWT',
      extendedPrice: ql.extendedPrice || calculateExtendedPrice(ql),
      processing: ql.processing || null,
      notes: ql.notes || '',
      inventoryStatus: 'CHECKING',
      sourceQuoteId: payload.quoteId,
      sourceQuoteLineId: ql.id,
      addedAt: new Date()
    }));
    
    const updatedLines = [...(context.lines || []), ...newLines];
    
    return {
      context: {
        lines: updatedLines,
        pricing: recalculatePricing(updatedLines, context.pricing),
        sourceQuoteId: payload.quoteId,
        sourceQuoteNumber: payload.quoteNumber
      },
      async: {
        action: 'BATCH_CHECK_INVENTORY',
        lineIds: newLines.map(l => l.id)
      }
    };
  },
  
  /**
   * Copy lines from order history
   */
  [POSEffects.COPY_LINES]: (context, payload) => {
    const historyLines = payload.historyLines || [];
    
    const newLines = historyLines.map((hl, idx) => ({
      id: `line_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
      lineNumber: (context.lines?.length || 0) + idx + 1,
      productId: hl.productId || null,
      productSku: hl.productSku || null,
      productName: hl.productName || hl.description || '',
      description: hl.description || '',
      gradeId: hl.gradeId || null,
      gradeCode: hl.gradeCode || null,
      thickness: hl.thickness || null,
      width: hl.width || null,
      length: hl.length || null,
      quantity: hl.quantity || 0,
      unit: hl.unit || 'LB',
      unitPrice: null, // Re-price at current rates
      priceUnit: hl.priceUnit || 'CWT',
      extendedPrice: 0, // Will be calculated
      processing: hl.processing || null,
      notes: hl.notes || '',
      inventoryStatus: 'CHECKING',
      sourceOrderId: payload.sourceOrderId,
      sourceOrderLineId: hl.id,
      addedAt: new Date()
    }));
    
    const updatedLines = [...(context.lines || []), ...newLines];
    
    return {
      context: {
        lines: updatedLines,
        reorderSource: {
          orderId: payload.sourceOrderId,
          orderNumber: payload.sourceOrderNumber
        }
      },
      async: {
        action: 'REPRICE_AND_CHECK_INVENTORY',
        lineIds: newLines.map(l => l.id)
      }
    };
  },
  
  /**
   * Lock pricing after approval
   */
  [POSEffects.LOCK_PRICING]: (context, payload) => {
    return {
      context: {
        pricing: {
          ...context.pricing,
          locked: true,
          lockedAt: new Date(),
          approvedBy: payload.approverId || payload.approvedBy,
          approvalNotes: payload.approvalNotes || ''
        }
      },
      async: {
        action: 'LOG_PRICING_APPROVAL',
        sessionId: context.sessionId,
        approverId: payload.approverId
      }
    };
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate extended price for a line item
 */
function calculateExtendedPrice(lineData) {
  const qty = parseFloat(lineData.quantity) || 0;
  const unitPrice = parseFloat(lineData.unitPrice) || 0;
  const priceUnit = lineData.priceUnit || 'CWT';
  
  // Convert to base price depending on price unit
  let extendedPrice = 0;
  
  switch (priceUnit) {
    case 'CWT': // per hundred weight
      extendedPrice = (qty / 100) * unitPrice;
      break;
    case 'LB':
      extendedPrice = qty * unitPrice;
      break;
    case 'TON':
      extendedPrice = (qty / 2000) * unitPrice;
      break;
    case 'EACH':
    case 'LF':
      extendedPrice = qty * unitPrice;
      break;
    default:
      extendedPrice = qty * unitPrice;
  }
  
  // Add processing charge if present
  if (lineData.processingCharge) {
    extendedPrice += parseFloat(lineData.processingCharge);
  }
  
  return Math.round(extendedPrice * 100) / 100; // Round to 2 decimal places
}

/**
 * Build description for processed items
 */
function buildProcessedDescription(lineData, processingConfig) {
  const parts = [];
  
  if (lineData.productName) parts.push(lineData.productName);
  
  // Add dimensions
  const dims = [];
  if (lineData.thickness) dims.push(`${lineData.thickness}" THK`);
  if (lineData.width) dims.push(`${lineData.width}" W`);
  if (processingConfig.cutLength) dims.push(`${processingConfig.cutLength}" L`);
  if (dims.length > 0) parts.push(dims.join(' x '));
  
  // Add operation type
  const opDescriptions = {
    CTL: 'Cut-to-Length',
    SLIT: 'Slit',
    SHEAR: 'Shear Cut',
    BLANK: 'Blank',
    LEVELCUT: 'Level & Cut'
  };
  
  if (processingConfig.operationType) {
    parts.push(opDescriptions[processingConfig.operationType] || processingConfig.operationType);
  }
  
  // Add piece count if relevant
  if (processingConfig.pieces && processingConfig.pieces > 1) {
    parts.push(`(${processingConfig.pieces} pcs)`);
  }
  
  return parts.join(' - ');
}

/**
 * Recalculate pricing totals
 */
function recalculatePricing(lines, existingPricing = {}) {
  const subtotal = lines.reduce((sum, line) => {
    return sum + (parseFloat(line.extendedPrice) || 0);
  }, 0);
  
  // Processing charges
  const processingTotal = lines.reduce((sum, line) => {
    return sum + (parseFloat(line.processingCharge) || 0);
  }, 0);
  
  // Discounts
  const discountTotal = (existingPricing.discounts || []).reduce((sum, d) => {
    return sum + (parseFloat(d.amount) || 0);
  }, 0);
  
  // Keep existing tax and freight if set
  const taxAmount = existingPricing.taxAmount || 0;
  const freightAmount = existingPricing.freightAmount || 0;
  
  const totalAmount = subtotal + processingTotal - discountTotal + taxAmount + freightAmount;
  
  return {
    ...existingPricing,
    subtotal: Math.round(subtotal * 100) / 100,
    processingTotal: Math.round(processingTotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    taxAmount,
    freightAmount,
    totalAmount: Math.round(totalAmount * 100) / 100
  };
}

// ============================================
// EFFECT EXECUTOR
// ============================================

/**
 * Execute an effect
 * @param {string} effectId - The effect identifier
 * @param {object} context - The workflow context
 * @param {object} payload - Additional data for the effect
 * @returns {object} - Effect result with context changes and async actions
 */
export function executeEffect(effectId, context, payload = {}) {
  const effectFn = effectFunctions[effectId];
  
  if (!effectFn) {
    console.warn(`Unknown effect: ${effectId}`);
    return { context: {}, async: null };
  }
  
  try {
    return effectFn(context, payload);
  } catch (error) {
    console.error(`Error executing effect ${effectId}:`, error);
    return { context: {}, async: null, error: error.message };
  }
}

/**
 * Execute multiple effects in sequence
 * @param {string[]} effectIds - Array of effect identifiers
 * @param {object} context - The workflow context
 * @param {object} payload - Additional data for the effects
 * @returns {object} - Combined effect results
 */
export function executeEffects(effectIds, context, payload = {}) {
  let combinedContext = {};
  const asyncActions = [];
  const errors = [];
  
  let currentContext = context;
  
  for (const effectId of effectIds) {
    const result = executeEffect(effectId, currentContext, payload);
    
    if (result.context) {
      combinedContext = { ...combinedContext, ...result.context };
      currentContext = { ...currentContext, ...result.context };
    }
    
    if (result.async) {
      asyncActions.push(result.async);
    }
    
    if (result.error) {
      errors.push({ effectId, error: result.error });
    }
  }
  
  return {
    context: combinedContext,
    asyncActions,
    errors: errors.length > 0 ? errors : null
  };
}

// Export helpers for external use
export {
  calculateExtendedPrice,
  recalculatePricing,
  buildProcessedDescription
};

export default executeEffect;
