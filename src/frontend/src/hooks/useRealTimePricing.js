/**
 * Real-Time Pricing Hook
 * 
 * React hook for real-time pricing calculations in POS screens.
 * Provides live price updates, margin monitoring, and discount previews.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ============================================
// CONFIGURATION
// ============================================

const DEBOUNCE_MS = 150;
const POLL_INTERVAL_MS = 5000; // For checking commodity price updates

// ============================================
// MARGIN STATUS CONSTANTS
// ============================================

export const MarginStatus = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  ACCEPTABLE: 'acceptable',
  GOOD: 'good',
  EXCELLENT: 'excellent'
};

export const MarginColors = {
  [MarginStatus.CRITICAL]: '#d32f2f',
  [MarginStatus.WARNING]: '#f57c00',
  [MarginStatus.ACCEPTABLE]: '#fbc02d',
  [MarginStatus.GOOD]: '#388e3c',
  [MarginStatus.EXCELLENT]: '#1b5e20'
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value || 0);
}

function formatPercent(value) {
  return `${(value || 0).toFixed(2)}%`;
}

// ============================================
// USE REAL-TIME PRICING HOOK
// ============================================

/**
 * Main hook for real-time pricing
 */
export function useRealTimePricing(options = {}) {
  const {
    sessionId,
    customerId,
    customerTier = 'BRONZE',
    taxExempt = false,
    taxRate = 0.0825,
    contracts = [],
    autoRefresh = false
  } = options;

  // State
  const [lines, setLines] = useState([]);
  const [totals, setTotals] = useState(createEmptyTotals());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Refs
  const sessionRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Initialize session
  useEffect(() => {
    if (sessionId && customerId) {
      initSession();
    }
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [sessionId, customerId]);

  // Auto-refresh for commodity prices
  useEffect(() => {
    if (autoRefresh && sessionId) {
      pollIntervalRef.current = setInterval(() => {
        refreshPrices();
      }, POLL_INTERVAL_MS);
      
      return () => clearInterval(pollIntervalRef.current);
    }
  }, [autoRefresh, sessionId]);

  /**
   * Initialize pricing session
   */
  const initSession = useCallback(async () => {
    try {
      const response = await fetch('/api/pos/pricing/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          customerId,
          customerTier,
          taxExempt,
          taxRate,
          contracts
        })
      });

      if (response.ok) {
        const session = await response.json();
        sessionRef.current = session.id;
        setLines(session.lines || []);
        setTotals(session.totals || createEmptyTotals());
      }
    } catch (err) {
      console.error('Failed to init pricing session:', err);
      setError('Failed to initialize pricing');
    }
  }, [sessionId, customerId, customerTier, taxExempt, taxRate, contracts]);

  /**
   * Update line item with debounced pricing
   */
  const updateLineDebounced = useMemo(
    () => debounce(async (lineData) => {
      setLoading(true);
      try {
        const response = await fetch('/api/pos/pricing/line', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionRef.current || sessionId,
            line: lineData
          })
        });

        if (response.ok) {
          const result = await response.json();
          setLines(prev => {
            const index = prev.findIndex(l => l.lineNumber === result.line.lineNumber);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = result.line;
              return updated;
            }
            return [...prev, result.line];
          });
          setTotals(result.totals);
          setLastUpdated(Date.now());
        }
      } catch (err) {
        console.error('Failed to update line:', err);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS),
    [sessionId]
  );

  /**
   * Update line item (immediate call)
   */
  const updateLine = useCallback(async (lineData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/pos/pricing/line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionRef.current || sessionId,
          line: lineData
        })
      });

      if (response.ok) {
        const result = await response.json();
        setLines(prev => {
          const index = prev.findIndex(l => l.lineNumber === result.line.lineNumber);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = result.line;
            return updated;
          }
          return [...prev, result.line];
        });
        setTotals(result.totals);
        setLastUpdated(Date.now());
        return result;
      }
    } catch (err) {
      console.error('Failed to update line:', err);
      setError('Failed to calculate price');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  /**
   * Remove line item
   */
  const removeLine = useCallback(async (lineNumber) => {
    try {
      const response = await fetch(`/api/pos/pricing/line/${lineNumber}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionRef.current || sessionId })
      });

      if (response.ok) {
        const result = await response.json();
        setLines(prev => prev.filter(l => l.lineNumber !== lineNumber));
        setTotals(result.totals);
        setLastUpdated(Date.now());
      }
    } catch (err) {
      console.error('Failed to remove line:', err);
    }
  }, [sessionId]);

  /**
   * Preview discount
   */
  const previewDiscount = useCallback(async (discountParams) => {
    try {
      const response = await fetch('/api/pos/pricing/discount/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionRef.current || sessionId,
          ...discountParams
        })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error('Failed to preview discount:', err);
    }
    return null;
  }, [sessionId]);

  /**
   * Apply discount
   */
  const applyDiscount = useCallback(async (discountParams) => {
    try {
      const response = await fetch('/api/pos/pricing/discount/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionRef.current || sessionId,
          ...discountParams
        })
      });

      if (response.ok) {
        const result = await response.json();
        setTotals(result.totals);
        if (result.preview?.lineNumber) {
          setLines(prev => {
            const updated = [...prev];
            const index = updated.findIndex(l => l.lineNumber === result.preview.lineNumber);
            if (index >= 0) {
              updated[index] = {
                ...updated[index],
                discountAmount: result.preview.discountAmount,
                discountPercent: result.preview.discountPercent,
                extendedPrice: result.preview.newPrice,
                margin: result.preview.newMargin,
                marginPercent: result.preview.newMarginPercent
              };
            }
            return updated;
          });
        }
        setLastUpdated(Date.now());
        return result;
      }
    } catch (err) {
      console.error('Failed to apply discount:', err);
    }
    return null;
  }, [sessionId]);

  /**
   * Refresh all prices
   */
  const refreshPrices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pos/pricing/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionRef.current || sessionId })
      });

      if (response.ok) {
        const result = await response.json();
        setLines(result.lines);
        setTotals(result.totals);
        setLastUpdated(Date.now());
      }
    } catch (err) {
      console.error('Failed to refresh prices:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  /**
   * Get quick estimate (no session)
   */
  const quickEstimate = useCallback(async (params) => {
    try {
      const response = await fetch('/api/pos/pricing/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error('Failed to get estimate:', err);
    }
    return null;
  }, []);

  /**
   * Clear all lines
   */
  const clearLines = useCallback(() => {
    setLines([]);
    setTotals(createEmptyTotals());
    setLastUpdated(Date.now());
  }, []);

  return {
    // State
    lines,
    totals,
    loading,
    error,
    lastUpdated,
    
    // Line operations
    updateLine,
    updateLineDebounced,
    removeLine,
    clearLines,
    
    // Discount operations
    previewDiscount,
    applyDiscount,
    
    // Refresh
    refreshPrices,
    
    // Quick estimate
    quickEstimate,
    
    // Helpers
    formatCurrency,
    formatPercent
  };
}

// ============================================
// USE LINE PRICING HOOK
// ============================================

/**
 * Hook for individual line pricing
 */
export function useLinePricing(line) {
  const margin = useMemo(() => ({
    amount: line?.margin || 0,
    percent: line?.marginPercent || 0,
    status: line?.marginStatus || MarginStatus.GOOD,
    color: MarginColors[line?.marginStatus] || MarginColors[MarginStatus.GOOD]
  }), [line?.margin, line?.marginPercent, line?.marginStatus]);

  const hasQuantityBreaks = useMemo(() => 
    line?.quantityBreaks?.length > 0, 
    [line?.quantityBreaks]
  );

  const nextBreak = useMemo(() => 
    line?.quantityBreaks?.[0] || null,
    [line?.quantityBreaks]
  );

  return {
    unitPrice: line?.unitPrice || 0,
    priceUnit: line?.priceUnit || 'CWT',
    priceSource: line?.priceSource,
    contractName: line?.contractName,
    
    materialPrice: line?.materialPrice || 0,
    processingCharge: line?.processingCharge || 0,
    extendedPrice: line?.extendedPrice || 0,
    
    discountPercent: line?.discountPercent || 0,
    discountAmount: line?.discountAmount || 0,
    
    margin,
    hasQuantityBreaks,
    nextBreak,
    
    isNegativeMargin: margin.percent < 0,
    needsApproval: margin.status === MarginStatus.CRITICAL
  };
}

// ============================================
// USE MARGIN MONITOR HOOK
// ============================================

/**
 * Hook for monitoring order margins
 */
export function useMarginMonitor(totals) {
  const status = useMemo(() => {
    const percent = totals?.orderMarginPercent || 0;
    
    if (percent < 0) return MarginStatus.CRITICAL;
    if (percent < 8) return MarginStatus.WARNING;
    if (percent < 12) return MarginStatus.ACCEPTABLE;
    if (percent >= 25) return MarginStatus.EXCELLENT;
    return MarginStatus.GOOD;
  }, [totals?.orderMarginPercent]);

  const alerts = useMemo(() => {
    const list = [];
    
    if (totals?.criticalMarginLines > 0) {
      list.push({
        severity: 'error',
        message: `${totals.criticalMarginLines} line(s) have negative margin`
      });
    }
    
    if (totals?.warningMarginLines > 0) {
      list.push({
        severity: 'warning',
        message: `${totals.warningMarginLines} line(s) below margin threshold`
      });
    }
    
    if (totals?.requiresApproval) {
      list.push({
        severity: 'info',
        message: 'Order requires manager approval'
      });
    }
    
    return list;
  }, [totals]);

  return {
    orderMargin: totals?.orderMargin || 0,
    orderMarginPercent: totals?.orderMarginPercent || 0,
    status,
    color: MarginColors[status],
    
    hasIssues: totals?.hasMarginIssues || false,
    requiresApproval: totals?.requiresApproval || false,
    alerts,
    
    criticalLines: totals?.criticalMarginLines || 0,
    warningLines: totals?.warningMarginLines || 0
  };
}

// ============================================
// USE DISCOUNT CALCULATOR HOOK
// ============================================

/**
 * Hook for discount calculations
 */
export function useDiscountCalculator() {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculateLineDiscount = useCallback((originalPrice, type, value) => {
    let discountAmount = 0;
    let newPrice = originalPrice;
    
    switch (type) {
      case 'PERCENT':
        discountAmount = originalPrice * (value / 100);
        newPrice = originalPrice - discountAmount;
        break;
      case 'AMOUNT':
        discountAmount = value;
        newPrice = Math.max(0, originalPrice - discountAmount);
        break;
      case 'PRICE_OVERRIDE':
        newPrice = value;
        discountAmount = originalPrice - value;
        break;
    }
    
    return {
      originalPrice,
      discountAmount: Math.round(discountAmount * 100) / 100,
      discountPercent: Math.round((discountAmount / originalPrice) * 10000) / 100,
      newPrice: Math.round(newPrice * 100) / 100
    };
  }, []);

  const calculateOrderDiscount = useCallback((subtotal, type, value) => {
    let discountAmount = 0;
    let newSubtotal = subtotal;
    
    switch (type) {
      case 'PERCENT':
        discountAmount = subtotal * (value / 100);
        newSubtotal = subtotal - discountAmount;
        break;
      case 'AMOUNT':
        discountAmount = value;
        newSubtotal = Math.max(0, subtotal - discountAmount);
        break;
    }
    
    return {
      originalSubtotal: subtotal,
      discountAmount: Math.round(discountAmount * 100) / 100,
      discountPercent: Math.round((discountAmount / subtotal) * 10000) / 100,
      newSubtotal: Math.round(newSubtotal * 100) / 100
    };
  }, []);

  return {
    preview,
    loading,
    calculateLineDiscount,
    calculateOrderDiscount,
    clearPreview: () => setPreview(null)
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function createEmptyTotals() {
  return {
    lineCount: 0,
    materialSubtotal: 0,
    processingTotal: 0,
    subtotal: 0,
    discountTotal: 0,
    taxExempt: false,
    taxRate: 0.0825,
    taxableAmount: 0,
    taxAmount: 0,
    orderTotal: 0,
    totalCost: 0,
    orderMargin: 0,
    orderMarginPercent: 0,
    orderMarginStatus: MarginStatus.GOOD,
    criticalMarginLines: 0,
    warningMarginLines: 0,
    hasMarginIssues: false,
    requiresApproval: false
  };
}

// ============================================
// EXPORTS
// ============================================

export default {
  useRealTimePricing,
  useLinePricing,
  useMarginMonitor,
  useDiscountCalculator,
  MarginStatus,
  MarginColors,
  formatCurrency,
  formatPercent
};
