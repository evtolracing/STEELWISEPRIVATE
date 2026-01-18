/**
 * POS Pricing Hooks
 * 
 * React hooks for integrating pricing functionality into POS workflow.
 * Provides real-time price calculation, discount management, and margin validation.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { posApi } from '../../api/pos';
import pricingApi from '../../api/pricing';

// ============================================
// PRICING CONFIGURATION
// ============================================

export const PriceUnits = {
  CWT: { label: 'Per CWT', multiplier: 0.01 },
  LB: { label: 'Per LB', multiplier: 1 },
  TON: { label: 'Per Ton', multiplier: 0.0005 },
  EACH: { label: 'Each', multiplier: 1 },
  LF: { label: 'Per Linear Ft', multiplier: 1 },
  SF: { label: 'Per Sq Ft', multiplier: 1 }
};

export const MarginStatus = {
  OK: { color: 'success', label: 'Good Margin', icon: 'check_circle' },
  WARNING: { color: 'warning', label: 'Low Margin', icon: 'warning' },
  APPROVAL_REQUIRED: { color: 'error', label: 'Approval Required', icon: 'error' }
};

// ============================================
// USE PRICE CALCULATOR HOOK
// ============================================

/**
 * Hook for calculating prices for line items
 */
export function usePriceCalculator(options = {}) {
  const { sessionId, customerId, divisionId, autoCalculate = true } = options;
  
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const debounceRef = useRef(null);
  
  /**
   * Calculate price for a product
   */
  const calculatePrice = useCallback(async (productData) => {
    setCalculating(true);
    setError(null);
    
    try {
      const result = await pricingApi.calculatePrice({
        customerId,
        divisionId,
        productId: productData.productId,
        productSku: productData.productSku,
        productCategory: productData.category,
        gradeCode: productData.gradeCode,
        thickness: productData.thickness,
        width: productData.width,
        length: productData.length,
        quantity: productData.quantity,
        unit: productData.unit || 'LB',
        processing: productData.processing,
        certifications: productData.certifications
      });
      
      setLastResult(result);
      return result;
    } catch (err) {
      const errorMsg = err.message || 'Price calculation failed';
      setError(errorMsg);
      throw err;
    } finally {
      setCalculating(false);
    }
  }, [customerId, divisionId]);
  
  /**
   * Debounced price calculation
   */
  const calculatePriceDebounced = useCallback((productData, delay = 300) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    return new Promise((resolve, reject) => {
      debounceRef.current = setTimeout(async () => {
        try {
          const result = await calculatePrice(productData);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      }, delay);
    });
  }, [calculatePrice]);
  
  /**
   * Calculate extended price locally (for quick updates)
   */
  const calculateExtendedPrice = useCallback((unitPrice, quantity, priceUnit = 'CWT', processingCharge = 0) => {
    const config = PriceUnits[priceUnit] || PriceUnits.LB;
    const materialPrice = quantity * config.multiplier * unitPrice;
    return Math.round((materialPrice + processingCharge) * 100) / 100;
  }, []);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  return {
    calculatePrice,
    calculatePriceDebounced,
    calculateExtendedPrice,
    calculating,
    error,
    lastResult,
    clearError: () => setError(null)
  };
}

// ============================================
// USE DISCOUNT MANAGER HOOK
// ============================================

/**
 * Hook for managing discounts on lines and orders
 */
export function useDiscountManager(options = {}) {
  const { sessionId, userDiscountLimit = 10, onApprovalRequired } = options;
  
  const [discounts, setDiscounts] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState(null);
  
  /**
   * Apply a discount
   */
  const applyDiscount = useCallback(async (discountData) => {
    setApplying(true);
    setError(null);
    
    try {
      const { type, value, lineId, reason, originalPrice } = discountData;
      
      // Calculate discount amount
      let discountAmount = 0;
      let discountPercent = 0;
      
      switch (type) {
        case 'PERCENT':
          discountPercent = value;
          discountAmount = originalPrice * (value / 100);
          break;
        case 'AMOUNT':
          discountAmount = value;
          discountPercent = (value / originalPrice) * 100;
          break;
        case 'PRICE_OVERRIDE':
          discountAmount = originalPrice - value;
          discountPercent = (discountAmount / originalPrice) * 100;
          break;
      }
      
      // Check if approval required
      const needsApproval = discountPercent > userDiscountLimit;
      
      if (needsApproval) {
        const pendingDiscount = {
          id: `pending_${Date.now()}`,
          ...discountData,
          discountAmount,
          discountPercent,
          status: 'PENDING',
          requestedAt: new Date()
        };
        
        setPendingApprovals(prev => [...prev, pendingDiscount]);
        
        if (onApprovalRequired) {
          onApprovalRequired(pendingDiscount);
        }
        
        return { 
          success: false, 
          needsApproval: true, 
          pendingDiscount,
          message: `Discount of ${discountPercent.toFixed(1)}% requires manager approval`
        };
      }
      
      // Apply discount
      const result = await posApi.applyDiscount(sessionId, {
        type,
        value,
        lineId,
        reason,
        discountAmount,
        discountPercent
      });
      
      if (result.success) {
        const newDiscount = {
          id: result.discount?.id || `disc_${Date.now()}`,
          type,
          value,
          amount: discountAmount,
          percent: discountPercent,
          lineId,
          reason,
          appliedAt: new Date()
        };
        
        setDiscounts(prev => [...prev, newDiscount]);
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setApplying(false);
    }
  }, [sessionId, userDiscountLimit, onApprovalRequired]);
  
  /**
   * Remove a discount
   */
  const removeDiscount = useCallback(async (discountId) => {
    try {
      // In production, call API to remove
      setDiscounts(prev => prev.filter(d => d.id !== discountId));
      return { success: true };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);
  
  /**
   * Approve a pending discount (manager action)
   */
  const approveDiscount = useCallback(async (pendingId, approverId) => {
    const pending = pendingApprovals.find(p => p.id === pendingId);
    if (!pending) return { success: false, error: 'Pending discount not found' };
    
    try {
      const result = await posApi.applyDiscount(sessionId, {
        ...pending,
        approverId,
        approved: true
      });
      
      if (result.success) {
        setPendingApprovals(prev => prev.filter(p => p.id !== pendingId));
        setDiscounts(prev => [...prev, { ...pending, approverId, status: 'APPROVED' }]);
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [sessionId, pendingApprovals]);
  
  /**
   * Reject a pending discount
   */
  const rejectDiscount = useCallback((pendingId, reason) => {
    setPendingApprovals(prev => prev.filter(p => p.id !== pendingId));
    return { success: true };
  }, []);
  
  /**
   * Get total discount amount
   */
  const totalDiscount = useMemo(() => {
    return discounts.reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [discounts]);
  
  /**
   * Get discounts for a specific line
   */
  const getLineDiscounts = useCallback((lineId) => {
    return discounts.filter(d => d.lineId === lineId);
  }, [discounts]);
  
  /**
   * Get order-level discounts
   */
  const orderDiscounts = useMemo(() => {
    return discounts.filter(d => !d.lineId);
  }, [discounts]);
  
  return {
    discounts,
    pendingApprovals,
    applying,
    error,
    applyDiscount,
    removeDiscount,
    approveDiscount,
    rejectDiscount,
    totalDiscount,
    getLineDiscounts,
    orderDiscounts,
    clearError: () => setError(null)
  };
}

// ============================================
// USE MARGIN VALIDATOR HOOK
// ============================================

/**
 * Hook for validating margins and handling approval workflow
 */
export function useMarginValidator(options = {}) {
  const { 
    minMargin = 8, 
    targetMargin = 18,
    onWarning,
    onApprovalRequired 
  } = options;
  
  const [warnings, setWarnings] = useState([]);
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [validating, setValidating] = useState(false);
  
  /**
   * Validate margin for a line item
   */
  const validateMargin = useCallback((priceResult) => {
    const { marginPercent, marginStatus, extendedPrice } = priceResult;
    
    const validation = {
      valid: marginStatus === 'OK',
      marginPercent,
      status: marginStatus,
      message: null,
      requiresApproval: false
    };
    
    if (marginPercent < 0) {
      validation.message = 'Negative margin - sale below cost';
      validation.requiresApproval = true;
      validation.severity = 'error';
    } else if (marginPercent < minMargin) {
      validation.message = `Margin ${marginPercent.toFixed(1)}% is below minimum ${minMargin}%`;
      validation.requiresApproval = true;
      validation.severity = 'error';
    } else if (marginPercent < targetMargin) {
      validation.message = `Margin ${marginPercent.toFixed(1)}% is below target ${targetMargin}%`;
      validation.severity = 'warning';
    }
    
    if (validation.severity === 'warning' && onWarning) {
      onWarning(validation);
    }
    
    if (validation.requiresApproval) {
      setApprovalRequired(true);
      if (onApprovalRequired) {
        onApprovalRequired(validation);
      }
    }
    
    return validation;
  }, [minMargin, targetMargin, onWarning, onApprovalRequired]);
  
  /**
   * Validate all lines in an order
   */
  const validateOrderMargins = useCallback((lines) => {
    const results = [];
    let hasWarnings = false;
    let hasApprovalRequired = false;
    
    for (const line of lines) {
      if (line.priceResult) {
        const validation = validateMargin(line.priceResult);
        results.push({ lineId: line.id, ...validation });
        
        if (validation.severity === 'warning') hasWarnings = true;
        if (validation.requiresApproval) hasApprovalRequired = true;
      }
    }
    
    setWarnings(results.filter(r => r.severity === 'warning'));
    setApprovalRequired(hasApprovalRequired);
    
    return {
      valid: !hasApprovalRequired,
      results,
      hasWarnings,
      hasApprovalRequired
    };
  }, [validateMargin]);
  
  /**
   * Get margin status display info
   */
  const getMarginStatus = useCallback((marginPercent) => {
    if (marginPercent < 0) {
      return MarginStatus.APPROVAL_REQUIRED;
    } else if (marginPercent < minMargin) {
      return MarginStatus.APPROVAL_REQUIRED;
    } else if (marginPercent < targetMargin) {
      return MarginStatus.WARNING;
    }
    return MarginStatus.OK;
  }, [minMargin, targetMargin]);
  
  return {
    validateMargin,
    validateOrderMargins,
    getMarginStatus,
    warnings,
    approvalRequired,
    validating,
    clearWarnings: () => setWarnings([]),
    clearApproval: () => setApprovalRequired(false)
  };
}

// ============================================
// USE ORDER TOTALS HOOK
// ============================================

/**
 * Hook for calculating and tracking order totals
 */
export function useOrderTotals(options = {}) {
  const { lines = [], discounts = [], taxRate = 0, freightAmount = 0 } = options;
  
  const totals = useMemo(() => {
    // Subtotal from lines
    const subtotal = lines.reduce((sum, line) => {
      return sum + (parseFloat(line.extendedPrice) || 0);
    }, 0);
    
    // Processing charges
    const processingTotal = lines.reduce((sum, line) => {
      return sum + (parseFloat(line.processingCharge) || 0);
    }, 0);
    
    // Discount total
    const discountTotal = discounts.reduce((sum, d) => {
      return sum + (parseFloat(d.amount) || 0);
    }, 0);
    
    // Taxable amount
    const taxableAmount = Math.max(0, subtotal - discountTotal);
    const taxAmount = taxableAmount * (taxRate / 100);
    
    // Grand total
    const totalAmount = subtotal - discountTotal + taxAmount + freightAmount;
    
    return {
      lineCount: lines.length,
      subtotal: Math.round(subtotal * 100) / 100,
      processingTotal: Math.round(processingTotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      taxRate,
      taxAmount: Math.round(taxAmount * 100) / 100,
      freightAmount: Math.round(freightAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    };
  }, [lines, discounts, taxRate, freightAmount]);
  
  /**
   * Format currency
   */
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }, []);
  
  return {
    ...totals,
    formatCurrency,
    formattedSubtotal: formatCurrency(totals.subtotal),
    formattedTotal: formatCurrency(totals.totalAmount),
    formattedDiscount: formatCurrency(totals.discountTotal),
    formattedTax: formatCurrency(totals.taxAmount)
  };
}

// ============================================
// USE PRICING CONTEXT HOOK
// ============================================

/**
 * Combined hook for all pricing functionality in POS context
 */
export function usePOSPricing(options = {}) {
  const { 
    sessionId, 
    customerId, 
    divisionId,
    lines = [],
    onPriceUpdate,
    onMarginWarning,
    onApprovalRequired
  } = options;
  
  // Sub-hooks
  const priceCalculator = usePriceCalculator({ 
    sessionId, 
    customerId, 
    divisionId 
  });
  
  const discountManager = useDiscountManager({ 
    sessionId,
    onApprovalRequired: (discount) => {
      if (onApprovalRequired) {
        onApprovalRequired({ type: 'DISCOUNT', data: discount });
      }
    }
  });
  
  const marginValidator = useMarginValidator({
    onWarning: onMarginWarning,
    onApprovalRequired: (validation) => {
      if (onApprovalRequired) {
        onApprovalRequired({ type: 'MARGIN', data: validation });
      }
    }
  });
  
  const orderTotals = useOrderTotals({
    lines,
    discounts: discountManager.discounts
  });
  
  /**
   * Calculate price for a line and validate margin
   */
  const calculateAndValidate = useCallback(async (productData) => {
    const priceResult = await priceCalculator.calculatePrice(productData);
    const marginValidation = marginValidator.validateMargin(priceResult);
    
    return {
      ...priceResult,
      marginValidation
    };
  }, [priceCalculator, marginValidator]);
  
  /**
   * Recalculate all line prices
   */
  const recalculateAll = useCallback(async () => {
    const results = [];
    
    for (const line of lines) {
      try {
        const result = await priceCalculator.calculatePrice({
          productId: line.productId,
          productSku: line.productSku,
          quantity: line.quantity,
          unit: line.unit,
          processing: line.processing
        });
        results.push({ lineId: line.id, ...result });
      } catch (err) {
        results.push({ lineId: line.id, error: err.message });
      }
    }
    
    if (onPriceUpdate) {
      onPriceUpdate(results);
    }
    
    return results;
  }, [lines, priceCalculator, onPriceUpdate]);
  
  return {
    // Price calculation
    calculatePrice: priceCalculator.calculatePrice,
    calculatePriceDebounced: priceCalculator.calculatePriceDebounced,
    calculateExtendedPrice: priceCalculator.calculateExtendedPrice,
    calculateAndValidate,
    recalculateAll,
    calculating: priceCalculator.calculating,
    
    // Discounts
    applyDiscount: discountManager.applyDiscount,
    removeDiscount: discountManager.removeDiscount,
    approveDiscount: discountManager.approveDiscount,
    discounts: discountManager.discounts,
    pendingApprovals: discountManager.pendingApprovals,
    
    // Margins
    validateMargin: marginValidator.validateMargin,
    validateOrderMargins: marginValidator.validateOrderMargins,
    getMarginStatus: marginValidator.getMarginStatus,
    marginWarnings: marginValidator.warnings,
    approvalRequired: marginValidator.approvalRequired,
    
    // Totals
    totals: orderTotals,
    
    // Errors
    error: priceCalculator.error || discountManager.error,
    clearError: () => {
      priceCalculator.clearError();
      discountManager.clearError();
    }
  };
}

// ============================================
// EXPORTS
// ============================================

export default {
  usePriceCalculator,
  useDiscountManager,
  useMarginValidator,
  useOrderTotals,
  usePOSPricing
};
