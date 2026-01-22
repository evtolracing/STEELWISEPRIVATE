/**
 * Real-Time Pricing Calculator
 * 
 * Provides live pricing updates for POS order intake.
 * Implements real-time calculation from design document 42-AI-ORDER-INTAKE-POS.md
 * 
 * Features:
 * - Debounced price calculations
 * - Margin monitoring with thresholds
 * - Real-time totals with tax
 * - Quantity break suggestions
 * - Discount impact preview
 */

import { posPricingService } from './POSPricingService.js';

// ============================================
// CONFIGURATION
// ============================================

export const RealTimePricingConfig = {
  // Calculation debounce (ms)
  debounceMs: 150,
  
  // Auto-refresh interval for commodity prices (ms)
  commodityRefreshMs: 60000,
  
  // Margin thresholds
  marginThresholds: {
    critical: 0,      // Negative margin
    warning: 0.08,    // Below 8%
    acceptable: 0.12, // 8-12%
    good: 0.18,       // 12-18%
    excellent: 0.25   // Above 25%
  },
  
  // Max quantity break suggestions to show
  maxQuantityBreakSuggestions: 3,
  
  // Tax rates by state (simplified)
  defaultTaxRate: 0.0825,
  
  // Processing charge update triggers
  processingTriggers: ['quantity', 'cutLength', 'pieces', 'processingType']
};

// ============================================
// MARGIN STATUS
// ============================================

export const MarginStatus = {
  CRITICAL: 'critical',
  WARNING: 'warning', 
  ACCEPTABLE: 'acceptable',
  GOOD: 'good',
  EXCELLENT: 'excellent'
};

// ============================================
// REAL-TIME PRICING CALCULATOR CLASS
// ============================================

class RealTimePricingCalculator {
  constructor() {
    this.sessions = new Map();
    this.commodityPrices = new Map();
    this.lastCommodityRefresh = null;
  }
  
  // ========================================
  // SESSION MANAGEMENT
  // ========================================
  
  /**
   * Initialize pricing session for an order
   */
  initSession(sessionId, options = {}) {
    const session = {
      id: sessionId,
      customerId: options.customerId,
      customerTier: options.customerTier || 'BRONZE',
      taxExempt: options.taxExempt || false,
      taxRate: options.taxRate || RealTimePricingConfig.defaultTaxRate,
      contracts: options.contracts || [],
      lines: [],
      totals: this.createEmptyTotals(),
      lastCalculation: null,
      pendingCalculation: null,
      callbacks: new Set()
    };
    
    this.sessions.set(sessionId, session);
    return session;
  }
  
  /**
   * Get session
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }
  
  /**
   * End session
   */
  endSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.callbacks.clear();
      this.sessions.delete(sessionId);
    }
  }
  
  /**
   * Subscribe to pricing updates
   */
  subscribe(sessionId, callback) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.callbacks.add(callback);
      return () => session.callbacks.delete(callback);
    }
    return () => {};
  }
  
  /**
   * Notify subscribers of price changes
   */
  notifySubscribers(sessionId, data) {
    const session = this.sessions.get(sessionId);
    if (session) {
      for (const callback of session.callbacks) {
        try {
          callback(data);
        } catch (err) {
          console.error('Pricing callback error:', err);
        }
      }
    }
  }
  
  // ========================================
  // LINE ITEM PRICING
  // ========================================
  
  /**
   * Add or update a line item with real-time pricing
   */
  async updateLine(sessionId, lineData) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    const startTime = Date.now();
    
    // Find existing line or create new
    let line = session.lines.find(l => l.lineNumber === lineData.lineNumber);
    const isNew = !line;
    
    if (isNew) {
      line = {
        lineNumber: lineData.lineNumber || session.lines.length + 1,
        productId: lineData.productId,
        productCode: lineData.productCode,
        description: lineData.description,
        category: lineData.category,
        ...this.createEmptyLinePricing()
      };
      session.lines.push(line);
    }
    
    // Update line data
    Object.assign(line, {
      quantity: lineData.quantity || line.quantity || 0,
      quantityUom: lineData.quantityUom || line.quantityUom || 'LBS',
      pieces: lineData.pieces || line.pieces || 0,
      weight: lineData.weight || line.weight || 0,
      dimensions: lineData.dimensions || line.dimensions,
      processing: lineData.processing || line.processing
    });
    
    // Calculate pricing for this line
    const pricing = await this.calculateLinePricing(session, line);
    Object.assign(line, pricing);
    
    // Recalculate order totals
    const totals = this.calculateOrderTotals(session);
    session.totals = totals;
    session.lastCalculation = Date.now();
    
    const result = {
      line,
      totals,
      calculationTimeMs: Date.now() - startTime
    };
    
    // Notify subscribers
    this.notifySubscribers(sessionId, {
      type: isNew ? 'LINE_ADDED' : 'LINE_UPDATED',
      ...result
    });
    
    return result;
  }
  
  /**
   * Remove a line item
   */
  removeLine(sessionId, lineNumber) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    const index = session.lines.findIndex(l => l.lineNumber === lineNumber);
    if (index >= 0) {
      session.lines.splice(index, 1);
      
      // Renumber lines
      session.lines.forEach((l, i) => l.lineNumber = i + 1);
      
      // Recalculate totals
      const totals = this.calculateOrderTotals(session);
      session.totals = totals;
      
      this.notifySubscribers(sessionId, {
        type: 'LINE_REMOVED',
        lineNumber,
        totals
      });
      
      return { success: true, totals };
    }
    
    return { success: false, error: 'Line not found' };
  }
  
  /**
   * Calculate pricing for a single line
   */
  async calculateLinePricing(session, line) {
    // Get base price
    const priceResult = await posPricingService.calculatePrice({
      customerId: session.customerId,
      productId: line.productId,
      productCategory: line.category,
      quantity: line.quantity,
      quantityUnit: line.quantityUom,
      contractIds: session.contracts.map(c => c.id)
    });
    
    // Calculate processing charges if applicable
    let processingCharge = 0;
    if (line.processing?.processingRequired) {
      const procResult = await posPricingService.calculateProcessingCharge({
        processingType: line.processing.processingType,
        quantity: line.quantity,
        quantityUnit: line.quantityUom,
        cutCount: line.processing.cutCount || 1,
        weight: line.weight,
        thickness: line.dimensions?.thickness
      });
      processingCharge = procResult.totalCharge;
    }
    
    // Calculate extended price
    const materialPrice = this.calculateMaterialPrice(
      priceResult.finalPrice,
      priceResult.priceUnit,
      line.quantity,
      line.quantityUom
    );
    
    const extendedPrice = materialPrice + processingCharge;
    
    // Calculate margin
    const marginResult = await this.calculateLineMargin(
      line.productId,
      line.category,
      extendedPrice,
      line.quantity,
      line.quantityUom
    );
    
    // Get quantity break suggestions
    const quantityBreaks = await this.getQuantityBreakSuggestions(
      session.customerId,
      line.productId,
      line.quantity
    );
    
    return {
      // Pricing
      listPrice: priceResult.listPrice,
      unitPrice: priceResult.finalPrice,
      priceUnit: priceResult.priceUnit,
      priceSource: priceResult.priceSource,
      contractId: priceResult.contractId,
      contractName: priceResult.contractName,
      
      // Discounts
      discountPercent: priceResult.discountPercent || 0,
      discountAmount: priceResult.discountAmount || 0,
      
      // Calculated amounts
      materialPrice: Math.round(materialPrice * 100) / 100,
      processingCharge: Math.round(processingCharge * 100) / 100,
      extendedPrice: Math.round(extendedPrice * 100) / 100,
      
      // Margin
      cost: marginResult.cost,
      margin: marginResult.margin,
      marginPercent: marginResult.marginPercent,
      marginStatus: marginResult.status,
      marginMessage: marginResult.message,
      
      // Suggestions
      quantityBreaks,
      hasQuantityBreakOpportunity: quantityBreaks.length > 0
    };
  }
  
  /**
   * Calculate material price based on price unit and quantity
   */
  calculateMaterialPrice(unitPrice, priceUnit, quantity, quantityUom) {
    const price = parseFloat(unitPrice) || 0;
    const qty = parseFloat(quantity) || 0;
    
    // Convert quantity to price unit basis
    switch (priceUnit) {
      case 'CWT':
        return (qty / 100) * price;
      case 'LB':
        return qty * price;
      case 'TON':
        return (qty / 2000) * price;
      case 'EACH':
      case 'EA':
        return qty * price;
      case 'LF':
      case 'SF':
        return qty * price;
      default:
        return qty * price;
    }
  }
  
  /**
   * Calculate margin for a line
   */
  async calculateLineMargin(productId, category, extendedPrice, quantity, uom) {
    // Get cost (would come from inventory/costing service)
    const cost = await this.getProductCost(productId, quantity, uom);
    
    const margin = extendedPrice - cost;
    const marginPercent = extendedPrice > 0 ? (margin / extendedPrice) : 0;
    
    // Determine status
    const thresholds = RealTimePricingConfig.marginThresholds;
    let status = MarginStatus.GOOD;
    let message = '';
    
    if (marginPercent < thresholds.critical) {
      status = MarginStatus.CRITICAL;
      message = 'Negative margin - requires approval';
    } else if (marginPercent < thresholds.warning) {
      status = MarginStatus.WARNING;
      message = 'Below minimum margin threshold';
    } else if (marginPercent < thresholds.acceptable) {
      status = MarginStatus.ACCEPTABLE;
      message = 'Below target margin';
    } else if (marginPercent >= thresholds.excellent) {
      status = MarginStatus.EXCELLENT;
      message = 'Excellent margin';
    }
    
    return {
      cost: Math.round(cost * 100) / 100,
      margin: Math.round(margin * 100) / 100,
      marginPercent: Math.round(marginPercent * 10000) / 100,
      status,
      message
    };
  }
  
  /**
   * Get product cost
   */
  async getProductCost(productId, quantity, uom) {
    // Mock cost calculation - in production would get from inventory
    // Assume 75% of typical selling price
    const avgPrice = 55.00; // $/cwt
    const costFactor = 0.75;
    return (quantity / 100) * avgPrice * costFactor;
  }
  
  /**
   * Get quantity break suggestions
   */
  async getQuantityBreakSuggestions(customerId, productId, currentQty) {
    const suggestions = [];
    
    // Mock quantity breaks - would come from pricing service
    const breaks = [
      { minQty: 500, price: 52.00, savings: 5 },
      { minQty: 1000, price: 49.00, savings: 8 },
      { minQty: 2500, price: 46.00, savings: 12 },
      { minQty: 5000, price: 43.00, savings: 15 }
    ];
    
    for (const breakPoint of breaks) {
      if (currentQty < breakPoint.minQty) {
        const additionalQty = breakPoint.minQty - currentQty;
        if (additionalQty <= currentQty) { // Only suggest if reasonable increase
          suggestions.push({
            targetQuantity: breakPoint.minQty,
            additionalQuantity: additionalQty,
            newPrice: breakPoint.price,
            savingsPercent: breakPoint.savings,
            message: `Add ${additionalQty} lbs to save ${breakPoint.savings}%`
          });
        }
      }
      
      if (suggestions.length >= RealTimePricingConfig.maxQuantityBreakSuggestions) {
        break;
      }
    }
    
    return suggestions;
  }
  
  // ========================================
  // ORDER TOTALS
  // ========================================
  
  /**
   * Calculate order totals
   */
  calculateOrderTotals(session) {
    const lines = session.lines;
    
    // Sum line values
    let subtotal = 0;
    let processingTotal = 0;
    let discountTotal = 0;
    let totalCost = 0;
    let criticalMarginLines = 0;
    let warningMarginLines = 0;
    
    for (const line of lines) {
      subtotal += line.materialPrice || 0;
      processingTotal += line.processingCharge || 0;
      discountTotal += line.discountAmount || 0;
      totalCost += line.cost || 0;
      
      if (line.marginStatus === MarginStatus.CRITICAL) {
        criticalMarginLines++;
      } else if (line.marginStatus === MarginStatus.WARNING) {
        warningMarginLines++;
      }
    }
    
    const materialSubtotal = subtotal;
    subtotal += processingTotal;
    
    // Calculate tax
    const taxableAmount = session.taxExempt ? 0 : subtotal;
    const taxAmount = taxableAmount * session.taxRate;
    
    // Order total
    const orderTotal = subtotal + taxAmount;
    
    // Order margin
    const orderMargin = subtotal - totalCost;
    const orderMarginPercent = subtotal > 0 ? (orderMargin / subtotal) * 100 : 0;
    
    // Determine order margin status
    let orderMarginStatus = MarginStatus.GOOD;
    if (orderMarginPercent < 0) {
      orderMarginStatus = MarginStatus.CRITICAL;
    } else if (orderMarginPercent < 8) {
      orderMarginStatus = MarginStatus.WARNING;
    } else if (orderMarginPercent < 12) {
      orderMarginStatus = MarginStatus.ACCEPTABLE;
    } else if (orderMarginPercent >= 25) {
      orderMarginStatus = MarginStatus.EXCELLENT;
    }
    
    return {
      lineCount: lines.length,
      
      // Amounts
      materialSubtotal: Math.round(materialSubtotal * 100) / 100,
      processingTotal: Math.round(processingTotal * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      
      // Tax
      taxExempt: session.taxExempt,
      taxRate: session.taxRate,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      
      // Total
      orderTotal: Math.round(orderTotal * 100) / 100,
      
      // Margin summary
      totalCost: Math.round(totalCost * 100) / 100,
      orderMargin: Math.round(orderMargin * 100) / 100,
      orderMarginPercent: Math.round(orderMarginPercent * 100) / 100,
      orderMarginStatus,
      
      // Margin alerts
      criticalMarginLines,
      warningMarginLines,
      hasMarginIssues: criticalMarginLines > 0 || warningMarginLines > 0,
      requiresApproval: criticalMarginLines > 0 || orderMarginPercent < 0
    };
  }
  
  /**
   * Create empty totals object
   */
  createEmptyTotals() {
    return {
      lineCount: 0,
      materialSubtotal: 0,
      processingTotal: 0,
      subtotal: 0,
      discountTotal: 0,
      taxExempt: false,
      taxRate: RealTimePricingConfig.defaultTaxRate,
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
  
  /**
   * Create empty line pricing
   */
  createEmptyLinePricing() {
    return {
      listPrice: 0,
      unitPrice: 0,
      priceUnit: 'CWT',
      priceSource: null,
      discountPercent: 0,
      discountAmount: 0,
      materialPrice: 0,
      processingCharge: 0,
      extendedPrice: 0,
      cost: 0,
      margin: 0,
      marginPercent: 0,
      marginStatus: MarginStatus.GOOD,
      quantityBreaks: []
    };
  }
  
  // ========================================
  // DISCOUNT PREVIEW
  // ========================================
  
  /**
   * Preview discount impact before applying
   */
  async previewDiscount(sessionId, discountParams) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    const {
      type,        // 'PERCENT', 'AMOUNT', 'PRICE_OVERRIDE'
      value,
      lineNumber,  // null for order-level
      scope        // 'LINE', 'ORDER'
    } = discountParams;
    
    if (scope === 'LINE' && lineNumber) {
      return this.previewLineDiscount(session, lineNumber, type, value);
    } else {
      return this.previewOrderDiscount(session, type, value);
    }
  }
  
  /**
   * Preview line-level discount
   */
  previewLineDiscount(session, lineNumber, type, value) {
    const line = session.lines.find(l => l.lineNumber === lineNumber);
    if (!line) {
      return { error: 'Line not found' };
    }
    
    const originalPrice = line.extendedPrice;
    let discountAmount = 0;
    let newPrice = originalPrice;
    
    switch (type) {
      case 'PERCENT':
        discountAmount = originalPrice * (value / 100);
        newPrice = originalPrice - discountAmount;
        break;
      case 'AMOUNT':
        discountAmount = value;
        newPrice = originalPrice - discountAmount;
        break;
      case 'PRICE_OVERRIDE':
        newPrice = value;
        discountAmount = originalPrice - value;
        break;
    }
    
    // Calculate new margin
    const newMargin = newPrice - line.cost;
    const newMarginPercent = newPrice > 0 ? (newMargin / newPrice) * 100 : 0;
    
    // Determine if approval required
    const discountPercent = (discountAmount / originalPrice) * 100;
    const requiresApproval = discountPercent > 15 || newMarginPercent < 8;
    
    return {
      lineNumber,
      originalPrice: Math.round(originalPrice * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      discountPercent: Math.round(discountPercent * 100) / 100,
      newPrice: Math.round(newPrice * 100) / 100,
      
      originalMargin: line.margin,
      originalMarginPercent: line.marginPercent,
      newMargin: Math.round(newMargin * 100) / 100,
      newMarginPercent: Math.round(newMarginPercent * 100) / 100,
      
      marginImpact: Math.round((newMarginPercent - line.marginPercent) * 100) / 100,
      requiresApproval,
      approvalReason: requiresApproval 
        ? (newMarginPercent < 8 ? 'Below margin threshold' : 'Discount exceeds limit')
        : null
    };
  }
  
  /**
   * Preview order-level discount
   */
  previewOrderDiscount(session, type, value) {
    const totals = session.totals;
    const originalSubtotal = totals.subtotal;
    let discountAmount = 0;
    let newSubtotal = originalSubtotal;
    
    switch (type) {
      case 'PERCENT':
        discountAmount = originalSubtotal * (value / 100);
        newSubtotal = originalSubtotal - discountAmount;
        break;
      case 'AMOUNT':
        discountAmount = value;
        newSubtotal = originalSubtotal - discountAmount;
        break;
    }
    
    // Recalculate tax
    const taxableAmount = session.taxExempt ? 0 : newSubtotal;
    const newTaxAmount = taxableAmount * session.taxRate;
    const newOrderTotal = newSubtotal + newTaxAmount;
    
    // Calculate new margin
    const newMargin = newSubtotal - totals.totalCost;
    const newMarginPercent = newSubtotal > 0 ? (newMargin / newSubtotal) * 100 : 0;
    
    const discountPercent = (discountAmount / originalSubtotal) * 100;
    const requiresApproval = discountPercent > 15 || newMarginPercent < 8;
    
    return {
      originalSubtotal: Math.round(originalSubtotal * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      discountPercent: Math.round(discountPercent * 100) / 100,
      newSubtotal: Math.round(newSubtotal * 100) / 100,
      
      originalTax: totals.taxAmount,
      newTaxAmount: Math.round(newTaxAmount * 100) / 100,
      
      originalTotal: totals.orderTotal,
      newOrderTotal: Math.round(newOrderTotal * 100) / 100,
      savings: Math.round((totals.orderTotal - newOrderTotal) * 100) / 100,
      
      originalMargin: totals.orderMargin,
      originalMarginPercent: totals.orderMarginPercent,
      newMargin: Math.round(newMargin * 100) / 100,
      newMarginPercent: Math.round(newMarginPercent * 100) / 100,
      
      marginImpact: Math.round((newMarginPercent - totals.orderMarginPercent) * 100) / 100,
      requiresApproval,
      approvalReason: requiresApproval
        ? (newMarginPercent < 8 ? 'Below margin threshold' : 'Discount exceeds limit')
        : null
    };
  }
  
  /**
   * Apply discount to line or order
   */
  async applyDiscount(sessionId, discountParams) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    const preview = await this.previewDiscount(sessionId, discountParams);
    
    if (discountParams.scope === 'LINE' && discountParams.lineNumber) {
      const line = session.lines.find(l => l.lineNumber === discountParams.lineNumber);
      if (line) {
        line.discountAmount = preview.discountAmount;
        line.discountPercent = preview.discountPercent;
        line.extendedPrice = preview.newPrice;
        line.margin = preview.newMargin;
        line.marginPercent = preview.newMarginPercent;
        
        // Update margin status
        if (preview.newMarginPercent < 0) {
          line.marginStatus = MarginStatus.CRITICAL;
        } else if (preview.newMarginPercent < 8) {
          line.marginStatus = MarginStatus.WARNING;
        } else if (preview.newMarginPercent < 12) {
          line.marginStatus = MarginStatus.ACCEPTABLE;
        } else {
          line.marginStatus = MarginStatus.GOOD;
        }
      }
    }
    
    // Recalculate totals
    const totals = this.calculateOrderTotals(session);
    session.totals = totals;
    
    this.notifySubscribers(sessionId, {
      type: 'DISCOUNT_APPLIED',
      discount: discountParams,
      preview,
      totals
    });
    
    return { preview, totals, requiresApproval: preview.requiresApproval };
  }
  
  // ========================================
  // PRICE REFRESH
  // ========================================
  
  /**
   * Refresh all prices for a session
   */
  async refreshPrices(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    const startTime = Date.now();
    const updatedLines = [];
    
    for (const line of session.lines) {
      const pricing = await this.calculateLinePricing(session, line);
      Object.assign(line, pricing);
      updatedLines.push(line);
    }
    
    const totals = this.calculateOrderTotals(session);
    session.totals = totals;
    session.lastCalculation = Date.now();
    
    const result = {
      lines: updatedLines,
      totals,
      refreshTimeMs: Date.now() - startTime
    };
    
    this.notifySubscribers(sessionId, {
      type: 'PRICES_REFRESHED',
      ...result
    });
    
    return result;
  }
  
  /**
   * Get current pricing state
   */
  getCurrentPricing(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }
    
    return {
      sessionId,
      customerId: session.customerId,
      customerTier: session.customerTier,
      taxExempt: session.taxExempt,
      taxRate: session.taxRate,
      lines: session.lines,
      totals: session.totals,
      lastCalculation: session.lastCalculation,
      contracts: session.contracts
    };
  }
  
  // ========================================
  // QUICK CALCULATIONS
  // ========================================
  
  /**
   * Quick price estimate (no session required)
   */
  async quickEstimate(params) {
    const {
      productId,
      productCategory,
      quantity,
      quantityUom,
      customerId,
      customerTier,
      includeProcessing,
      processingType
    } = params;
    
    // Get price
    const priceResult = await posPricingService.calculatePrice({
      customerId,
      productId,
      productCategory,
      quantity,
      quantityUnit: quantityUom
    });
    
    const materialPrice = this.calculateMaterialPrice(
      priceResult.finalPrice,
      priceResult.priceUnit,
      quantity,
      quantityUom
    );
    
    let processingCharge = 0;
    if (includeProcessing && processingType) {
      const procResult = await posPricingService.calculateProcessingCharge({
        processingType,
        quantity,
        quantityUnit: quantityUom
      });
      processingCharge = procResult.totalCharge;
    }
    
    const subtotal = materialPrice + processingCharge;
    const taxRate = RealTimePricingConfig.defaultTaxRate;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    return {
      unitPrice: priceResult.finalPrice,
      priceUnit: priceResult.priceUnit,
      priceSource: priceResult.priceSource,
      materialPrice: Math.round(materialPrice * 100) / 100,
      processingCharge: Math.round(processingCharge * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      taxRate,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }
}

// Export singleton
export const realTimePricingCalculator = new RealTimePricingCalculator();

export default realTimePricingCalculator;
