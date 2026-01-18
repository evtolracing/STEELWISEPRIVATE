/**
 * POS Pricing Service
 * 
 * Comprehensive pricing engine for POS order intake with support for:
 * - Contract pricing
 * - Customer price tiers
 * - Commodity-based pricing
 * - Mill extras and adders
 * - Processing charges
 * - Volume discounts
 * - Margin validation
 * - Real-time price calculation
 */

// ============================================
// PRICING CONFIGURATION
// ============================================

/**
 * Price source priority (higher = higher priority)
 */
export const PriceSourcePriority = {
  CONTRACT_FIXED: 100,
  CONTRACT_FORMULA: 90,
  CUSTOMER_PRICE_LIST: 80,
  CUSTOMER_TIER: 70,
  COMMODITY_MARGIN: 60,
  CATALOG_PRICE: 50,
  LIST_PRICE: 40
};

/**
 * Customer pricing tiers
 */
export const CustomerTiers = {
  PLATINUM: { multiplier: 0.85, name: 'Platinum' },
  GOLD: { multiplier: 0.90, name: 'Gold' },
  SILVER: { multiplier: 0.95, name: 'Silver' },
  BRONZE: { multiplier: 1.00, name: 'Bronze' },
  RETAIL: { multiplier: 1.10, name: 'Retail' }
};

/**
 * Product category margins
 */
export const CategoryMargins = {
  CARBON_FLAT: { target: 0.18, min: 0.08, maxDiscount: 0.15 },
  CARBON_PLATE: { target: 0.22, min: 0.10, maxDiscount: 0.18 },
  CARBON_BAR: { target: 0.20, min: 0.10, maxDiscount: 0.15 },
  STAINLESS_FLAT: { target: 0.25, min: 0.12, maxDiscount: 0.18 },
  STAINLESS_BAR: { target: 0.28, min: 0.15, maxDiscount: 0.20 },
  ALUMINUM_SHEET: { target: 0.22, min: 0.10, maxDiscount: 0.15 },
  ALUMINUM_BAR: { target: 0.25, min: 0.12, maxDiscount: 0.18 },
  SPECIALTY: { target: 0.30, min: 0.18, maxDiscount: 0.20 },
  PLASTICS: { target: 0.24, min: 0.12, maxDiscount: 0.16 },
  SUPPLIES: { target: 0.35, min: 0.20, maxDiscount: 0.25 }
};

/**
 * Processing operation charges
 */
export const ProcessingCharges = {
  CTL: { // Cut-to-Length
    baseCharge: 0.50, // per cut
    perPoundCharge: 0.02,
    minCharge: 15.00
  },
  SLIT: {
    baseCharge: 25.00,
    perCoilCharge: 10.00,
    minCharge: 50.00
  },
  SHEAR: {
    baseCharge: 0.75,
    perCutCharge: 0.25,
    minCharge: 10.00
  },
  BLANK: {
    baseCharge: 2.00,
    perPieceCharge: 0.50,
    minCharge: 25.00
  },
  LEVELCUT: {
    baseCharge: 1.50,
    perPoundCharge: 0.03,
    minCharge: 35.00
  }
};

/**
 * Mill extras configuration
 */
export const MillExtras = {
  GAUGE: {
    thin: { threshold: 0.075, adder: 1.50 }, // per cwt
    thick: { threshold: 0.500, adder: 2.00 }
  },
  WIDTH: {
    wide: { threshold: 72, adder: 2.50 }
  },
  LENGTH: {
    long: { threshold: 240, adder: 1.75 }
  },
  DOMESTIC_MELT: { adder: 3.00 },
  DFARS: { adder: 2.50 },
  CERTIFIED: { adder: 1.00 }
};

// ============================================
// PRICE CALCULATION ENGINE
// ============================================

export class POSPricingService {
  constructor(options = {}) {
    this.commodityService = options.commodityService || null;
    this.contractService = options.contractService || null;
    this.customerService = options.customerService || null;
    this.inventoryService = options.inventoryService || null;
    
    // Cache for performance
    this.priceCache = new Map();
    this.cacheTTL = options.cacheTTL || 60000; // 1 minute default
  }
  
  // ========================================
  // MAIN PRICE CALCULATION
  // ========================================
  
  /**
   * Calculate price for a line item
   * @param {object} params - Pricing parameters
   * @returns {Promise<PriceResult>}
   */
  async calculatePrice(params) {
    const {
      customerId,
      productId,
      productSku,
      productCategory,
      gradeCode,
      thickness,
      width,
      length,
      quantity,
      unit,
      processing,
      certifications,
      divisionId
    } = params;
    
    const priceResult = {
      basePrice: 0,
      basePriceSource: null,
      basePriceUnit: 'CWT',
      
      millExtras: [],
      millExtrasTotal: 0,
      
      processingCharge: 0,
      processingBreakdown: null,
      
      certificationCharges: [],
      certificationTotal: 0,
      
      adjustedPrice: 0,
      extendedPrice: 0,
      
      margin: 0,
      marginPercent: 0,
      marginStatus: 'OK', // OK, WARNING, APPROVAL_REQUIRED
      
      priceDerivation: [],
      calculatedAt: new Date()
    };
    
    try {
      // Step 1: Determine base price
      const baseResult = await this.determineBasePrice({
        customerId,
        productId,
        productSku,
        productCategory,
        gradeCode,
        divisionId
      });
      
      priceResult.basePrice = baseResult.price;
      priceResult.basePriceSource = baseResult.source;
      priceResult.basePriceUnit = baseResult.priceUnit;
      priceResult.priceDerivation.push({
        step: 'BASE_PRICE',
        source: baseResult.source,
        value: baseResult.price,
        description: baseResult.description
      });
      
      // Step 2: Calculate mill extras
      const extras = this.calculateMillExtras({
        productCategory,
        thickness,
        width,
        length,
        certifications
      });
      
      priceResult.millExtras = extras.items;
      priceResult.millExtrasTotal = extras.total;
      
      if (extras.items.length > 0) {
        priceResult.priceDerivation.push({
          step: 'MILL_EXTRAS',
          items: extras.items,
          value: extras.total,
          description: `Mill extras: ${extras.items.map(e => e.type).join(', ')}`
        });
      }
      
      // Step 3: Calculate processing charges
      if (processing) {
        const procResult = this.calculateProcessingCharge({
          operation: processing.operationType,
          quantity,
          unit,
          pieces: processing.pieces,
          ...processing
        });
        
        priceResult.processingCharge = procResult.charge;
        priceResult.processingBreakdown = procResult.breakdown;
        
        priceResult.priceDerivation.push({
          step: 'PROCESSING',
          operation: processing.operationType,
          value: procResult.charge,
          description: procResult.description
        });
      }
      
      // Step 4: Calculate certification charges
      if (certifications && certifications.length > 0) {
        const certResult = this.calculateCertificationCharges(certifications, quantity);
        priceResult.certificationCharges = certResult.items;
        priceResult.certificationTotal = certResult.total;
        
        priceResult.priceDerivation.push({
          step: 'CERTIFICATIONS',
          items: certResult.items,
          value: certResult.total,
          description: `Certifications: ${certifications.join(', ')}`
        });
      }
      
      // Step 5: Calculate adjusted unit price (base + extras)
      priceResult.adjustedPrice = priceResult.basePrice + priceResult.millExtrasTotal;
      
      // Step 6: Calculate extended price
      priceResult.extendedPrice = this.calculateExtendedPrice({
        unitPrice: priceResult.adjustedPrice,
        priceUnit: priceResult.basePriceUnit,
        quantity,
        unit,
        processingCharge: priceResult.processingCharge,
        certificationTotal: priceResult.certificationTotal
      });
      
      // Step 7: Calculate margin
      const marginResult = await this.calculateMargin({
        productId,
        productCategory,
        extendedPrice: priceResult.extendedPrice,
        quantity,
        unit
      });
      
      priceResult.margin = marginResult.margin;
      priceResult.marginPercent = marginResult.marginPercent;
      priceResult.marginStatus = marginResult.status;
      
      if (marginResult.status !== 'OK') {
        priceResult.priceDerivation.push({
          step: 'MARGIN_CHECK',
          status: marginResult.status,
          value: marginResult.marginPercent,
          description: marginResult.message
        });
      }
      
    } catch (error) {
      priceResult.error = error.message;
      priceResult.priceDerivation.push({
        step: 'ERROR',
        description: error.message
      });
    }
    
    return priceResult;
  }
  
  // ========================================
  // BASE PRICE DETERMINATION
  // ========================================
  
  /**
   * Determine base price from hierarchy of sources
   */
  async determineBasePrice(params) {
    const { customerId, productId, productSku, productCategory, gradeCode, divisionId } = params;
    
    // Check sources in priority order
    const sources = [
      () => this.checkContractPrice(customerId, productId, divisionId),
      () => this.checkCustomerPriceList(customerId, productId),
      () => this.checkCustomerTier(customerId, productId),
      () => this.getCommodityPrice(productCategory, gradeCode),
      () => this.getCatalogPrice(productId, productSku)
    ];
    
    for (const source of sources) {
      const result = await source();
      if (result && result.price > 0) {
        return result;
      }
    }
    
    // Fallback to list price
    return {
      price: 0,
      priceUnit: 'CWT',
      source: 'NOT_FOUND',
      description: 'No pricing found'
    };
  }
  
  /**
   * Check for contract pricing
   */
  async checkContractPrice(customerId, productId, divisionId) {
    // In production, query contracts table
    // Mock implementation
    const contract = null; // await this.contractService?.getActiveContract(customerId, productId);
    
    if (contract) {
      if (contract.priceType === 'FIXED') {
        return {
          price: contract.price,
          priceUnit: contract.priceUnit || 'CWT',
          source: 'CONTRACT_FIXED',
          description: `Contract ${contract.contractNumber}: Fixed price`,
          contractId: contract.id
        };
      } else if (contract.priceType === 'FORMULA') {
        // Calculate formula-based price
        const formulaPrice = await this.evaluateContractFormula(contract);
        return {
          price: formulaPrice,
          priceUnit: contract.priceUnit || 'CWT',
          source: 'CONTRACT_FORMULA',
          description: `Contract ${contract.contractNumber}: ${contract.formula}`,
          contractId: contract.id
        };
      }
    }
    
    return null;
  }
  
  /**
   * Check customer-specific price list
   */
  async checkCustomerPriceList(customerId, productId) {
    // In production, query customer price lists
    return null;
  }
  
  /**
   * Apply customer tier pricing
   */
  async checkCustomerTier(customerId, productId) {
    // In production, get customer tier and apply multiplier
    const customer = null; // await this.customerService?.getCustomer(customerId);
    
    if (customer?.pricingTier) {
      const tier = CustomerTiers[customer.pricingTier];
      if (tier) {
        const basePrice = await this.getCatalogPrice(productId);
        if (basePrice) {
          return {
            price: basePrice.price * tier.multiplier,
            priceUnit: basePrice.priceUnit,
            source: 'CUSTOMER_TIER',
            description: `${tier.name} tier pricing (${(1 - tier.multiplier) * 100}% discount)`,
            tier: customer.pricingTier
          };
        }
      }
    }
    
    return null;
  }
  
  /**
   * Get commodity-based price
   */
  async getCommodityPrice(productCategory, gradeCode) {
    // In production, get current commodity index + markup
    const margins = CategoryMargins[productCategory] || CategoryMargins.CARBON_FLAT;
    
    // Mock commodity price (would come from pricing records)
    const commodityIndex = 45.00; // $/cwt
    const targetPrice = commodityIndex / (1 - margins.target);
    
    return {
      price: Math.round(targetPrice * 100) / 100,
      priceUnit: 'CWT',
      source: 'COMMODITY_MARGIN',
      description: `Commodity index + ${margins.target * 100}% margin`,
      commodityIndex
    };
  }
  
  /**
   * Get catalog/list price
   */
  async getCatalogPrice(productId, productSku) {
    // In production, query product catalog
    // Mock implementation with reasonable steel prices
    const mockPrices = {
      'CARBON_FLAT': 55.00,
      'CARBON_PLATE': 62.00,
      'CARBON_BAR': 58.00,
      'STAINLESS_FLAT': 185.00,
      'ALUMINUM_SHEET': 145.00
    };
    
    return {
      price: mockPrices.CARBON_FLAT,
      priceUnit: 'CWT',
      source: 'CATALOG_PRICE',
      description: 'List price'
    };
  }
  
  // ========================================
  // MILL EXTRAS CALCULATION
  // ========================================
  
  /**
   * Calculate mill extras based on product specifications
   */
  calculateMillExtras(params) {
    const { productCategory, thickness, width, length, certifications } = params;
    const extras = [];
    
    // Gauge extras
    if (thickness) {
      if (thickness < MillExtras.GAUGE.thin.threshold) {
        extras.push({
          type: 'GAUGE_THIN',
          description: `Thin gauge (< ${MillExtras.GAUGE.thin.threshold}")`,
          adder: MillExtras.GAUGE.thin.adder,
          unit: 'CWT'
        });
      } else if (thickness > MillExtras.GAUGE.thick.threshold) {
        extras.push({
          type: 'GAUGE_THICK',
          description: `Thick gauge (> ${MillExtras.GAUGE.thick.threshold}")`,
          adder: MillExtras.GAUGE.thick.adder,
          unit: 'CWT'
        });
      }
    }
    
    // Width extras
    if (width && width > MillExtras.WIDTH.wide.threshold) {
      extras.push({
        type: 'WIDTH_WIDE',
        description: `Wide width (> ${MillExtras.WIDTH.wide.threshold}")`,
        adder: MillExtras.WIDTH.wide.adder,
        unit: 'CWT'
      });
    }
    
    // Length extras
    if (length && length > MillExtras.LENGTH.long.threshold) {
      extras.push({
        type: 'LENGTH_LONG',
        description: `Long length (> ${MillExtras.LENGTH.long.threshold}")`,
        adder: MillExtras.LENGTH.long.adder,
        unit: 'CWT'
      });
    }
    
    // Certification extras
    if (certifications) {
      if (certifications.includes('DOMESTIC_MELT')) {
        extras.push({
          type: 'DOMESTIC_MELT',
          description: 'Domestic melt required',
          adder: MillExtras.DOMESTIC_MELT.adder,
          unit: 'CWT'
        });
      }
      if (certifications.includes('DFARS')) {
        extras.push({
          type: 'DFARS',
          description: 'DFARS compliance',
          adder: MillExtras.DFARS.adder,
          unit: 'CWT'
        });
      }
      if (certifications.includes('CERTIFIED') || certifications.includes('MTR')) {
        extras.push({
          type: 'CERTIFIED',
          description: 'Mill test report',
          adder: MillExtras.CERTIFIED.adder,
          unit: 'CWT'
        });
      }
    }
    
    return {
      items: extras,
      total: extras.reduce((sum, e) => sum + e.adder, 0)
    };
  }
  
  // ========================================
  // PROCESSING CHARGES
  // ========================================
  
  /**
   * Calculate processing charges
   */
  calculateProcessingCharge(params) {
    const { operation, quantity, unit, pieces } = params;
    const config = ProcessingCharges[operation];
    
    if (!config) {
      return { charge: 0, breakdown: null, description: 'No processing' };
    }
    
    let charge = config.baseCharge;
    const breakdown = { base: config.baseCharge };
    
    // Weight-based charges
    if (config.perPoundCharge && quantity) {
      const weightLbs = this.convertToLbs(quantity, unit);
      const weightCharge = weightLbs * config.perPoundCharge;
      charge += weightCharge;
      breakdown.weightCharge = weightCharge;
    }
    
    // Per-piece charges
    if (config.perPieceCharge && pieces) {
      const pieceCharge = pieces * config.perPieceCharge;
      charge += pieceCharge;
      breakdown.pieceCharge = pieceCharge;
    }
    
    // Per-cut charges
    if (config.perCutCharge && pieces) {
      const cutCharge = pieces * config.perCutCharge;
      charge += cutCharge;
      breakdown.cutCharge = cutCharge;
    }
    
    // Apply minimum
    if (charge < config.minCharge) {
      charge = config.minCharge;
      breakdown.minimumApplied = true;
    }
    
    breakdown.total = Math.round(charge * 100) / 100;
    
    return {
      charge: breakdown.total,
      breakdown,
      description: `${operation} processing: $${breakdown.total.toFixed(2)}`
    };
  }
  
  // ========================================
  // CERTIFICATION CHARGES
  // ========================================
  
  /**
   * Calculate certification charges
   */
  calculateCertificationCharges(certifications, quantity) {
    const chargeMap = {
      MTR: { flat: 5.00, perCwt: 0.25, description: 'Mill Test Report' },
      COC: { flat: 10.00, perCwt: 0, description: 'Certificate of Conformance' },
      DFARS: { flat: 15.00, perCwt: 0.50, description: 'DFARS Certification' },
      DOMESTIC_MELT: { flat: 10.00, perCwt: 0.25, description: 'Domestic Melt Certification' },
      HEAT_TREAT_CERT: { flat: 20.00, perCwt: 0, description: 'Heat Treatment Certificate' }
    };
    
    const items = [];
    let total = 0;
    
    for (const cert of certifications) {
      const config = chargeMap[cert];
      if (config) {
        const charge = config.flat + (quantity / 100 * config.perCwt);
        items.push({
          type: cert,
          description: config.description,
          charge: Math.round(charge * 100) / 100
        });
        total += charge;
      }
    }
    
    return {
      items,
      total: Math.round(total * 100) / 100
    };
  }
  
  // ========================================
  // EXTENDED PRICE CALCULATION
  // ========================================
  
  /**
   * Calculate extended price
   */
  calculateExtendedPrice(params) {
    const { unitPrice, priceUnit, quantity, unit, processingCharge, certificationTotal } = params;
    
    let materialPrice = 0;
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    
    // Convert based on price unit
    switch (priceUnit) {
      case 'CWT':
        materialPrice = (qty / 100) * price;
        break;
      case 'LB':
        materialPrice = qty * price;
        break;
      case 'TON':
        materialPrice = (qty / 2000) * price;
        break;
      case 'EACH':
      case 'LF':
      case 'SF':
        materialPrice = qty * price;
        break;
      default:
        materialPrice = qty * price;
    }
    
    const extendedPrice = materialPrice + (processingCharge || 0) + (certificationTotal || 0);
    
    return Math.round(extendedPrice * 100) / 100;
  }
  
  // ========================================
  // MARGIN CALCULATION
  // ========================================
  
  /**
   * Calculate margin and validate against thresholds
   */
  async calculateMargin(params) {
    const { productId, productCategory, extendedPrice, quantity, unit } = params;
    
    // Get cost (in production, from inventory or costing service)
    const cost = await this.getProductCost(productId, quantity, unit);
    
    const margin = extendedPrice - cost;
    const marginPercent = extendedPrice > 0 ? margin / extendedPrice : 0;
    
    const categoryConfig = CategoryMargins[productCategory] || CategoryMargins.CARBON_FLAT;
    
    let status = 'OK';
    let message = '';
    
    if (marginPercent < 0) {
      status = 'APPROVAL_REQUIRED';
      message = 'Negative margin - requires manager approval';
    } else if (marginPercent < categoryConfig.min) {
      status = 'APPROVAL_REQUIRED';
      message = `Below minimum margin (${(categoryConfig.min * 100).toFixed(1)}%)`;
    } else if (marginPercent < categoryConfig.target * 0.8) {
      status = 'WARNING';
      message = `Below target margin (${(categoryConfig.target * 100).toFixed(1)}%)`;
    }
    
    return {
      margin: Math.round(margin * 100) / 100,
      marginPercent: Math.round(marginPercent * 10000) / 100, // As percentage
      cost,
      status,
      message,
      minMargin: categoryConfig.min * 100,
      targetMargin: categoryConfig.target * 100
    };
  }
  
  /**
   * Get product cost
   */
  async getProductCost(productId, quantity, unit) {
    // In production, get from inventory/costing service
    // Mock: assume 75% of list price
    const listPrice = 55.00; // $/cwt
    const cost = (quantity / 100) * (listPrice * 0.75);
    return Math.round(cost * 100) / 100;
  }
  
  // ========================================
  // DISCOUNT APPLICATION
  // ========================================
  
  /**
   * Apply discount to line or order
   */
  applyDiscount(params) {
    const { 
      type, // PERCENT, AMOUNT, PRICE_OVERRIDE
      value,
      lineId, // null for order-level
      reason,
      approverId,
      originalPrice,
      quantity
    } = params;
    
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
    
    // Check if approval required
    const discountPercent = (discountAmount / originalPrice) * 100;
    const needsApproval = discountPercent > 15; // Max 15% without approval
    
    return {
      discountAmount: Math.round(discountAmount * 100) / 100,
      newPrice: Math.round(newPrice * 100) / 100,
      discountPercent: Math.round(discountPercent * 100) / 100,
      needsApproval,
      approvalReason: needsApproval ? `Discount exceeds 15% (${discountPercent.toFixed(1)}%)` : null,
      discount: {
        id: `disc_${Date.now()}`,
        type,
        value,
        amount: Math.round(discountAmount * 100) / 100,
        lineId,
        reason,
        approverId: needsApproval ? approverId : null,
        appliedAt: new Date()
      }
    };
  }
  
  /**
   * Validate discount against limits
   */
  validateDiscount(discount, customer, user) {
    const limits = {
      maxPercentWithoutApproval: 15,
      maxAmountWithoutApproval: 500,
      userMaxPercent: user?.discountLimit || 10,
      customerMaxDiscount: customer?.maxDiscount || 20
    };
    
    const errors = [];
    
    if (discount.discountPercent > limits.maxPercentWithoutApproval && !discount.approverId) {
      errors.push({
        code: 'APPROVAL_REQUIRED',
        message: `Discount of ${discount.discountPercent.toFixed(1)}% requires manager approval`
      });
    }
    
    if (discount.discountPercent > limits.customerMaxDiscount) {
      errors.push({
        code: 'EXCEEDS_CUSTOMER_LIMIT',
        message: `Discount exceeds customer limit of ${limits.customerMaxDiscount}%`
      });
    }
    
    if (discount.discountPercent > limits.userMaxPercent && !discount.approverId) {
      errors.push({
        code: 'EXCEEDS_USER_AUTHORITY',
        message: `Discount exceeds your authority of ${limits.userMaxPercent}%`
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
      limits
    };
  }
  
  // ========================================
  // ORDER TOTALS
  // ========================================
  
  /**
   * Calculate order totals
   */
  calculateOrderTotals(lines, discounts = [], taxRate = 0, freightAmount = 0) {
    // Line subtotals
    const subtotal = lines.reduce((sum, line) => {
      return sum + (parseFloat(line.extendedPrice) || 0);
    }, 0);
    
    // Processing total
    const processingTotal = lines.reduce((sum, line) => {
      return sum + (parseFloat(line.processingCharge) || 0);
    }, 0);
    
    // Discount total
    const discountTotal = discounts.reduce((sum, d) => {
      return sum + (parseFloat(d.amount) || 0);
    }, 0);
    
    // Taxable amount (subtotal - discounts, excluding freight in some jurisdictions)
    const taxableAmount = subtotal - discountTotal;
    const taxAmount = taxableAmount * (taxRate / 100);
    
    // Grand total
    const totalAmount = subtotal - discountTotal + taxAmount + freightAmount;
    
    return {
      lineCount: lines.length,
      subtotal: Math.round(subtotal * 100) / 100,
      processingTotal: Math.round(processingTotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      discounts,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      taxRate,
      taxAmount: Math.round(taxAmount * 100) / 100,
      freightAmount: Math.round(freightAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    };
  }
  
  // ========================================
  // UTILITY METHODS
  // ========================================
  
  /**
   * Convert quantity to pounds
   */
  convertToLbs(quantity, unit) {
    const conversions = {
      LB: 1,
      KG: 2.20462,
      TON: 2000,
      MT: 2204.62,
      CWT: 100,
      OZ: 0.0625
    };
    return quantity * (conversions[unit] || 1);
  }
  
  /**
   * Evaluate contract formula
   */
  async evaluateContractFormula(contract) {
    // In production, parse and evaluate formula like "LME + $0.50"
    return contract.price || 0;
  }
  
  /**
   * Clear price cache
   */
  clearCache() {
    this.priceCache.clear();
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let pricingServiceInstance = null;

export function getPricingService(options = {}) {
  if (!pricingServiceInstance) {
    pricingServiceInstance = new POSPricingService(options);
  }
  return pricingServiceInstance;
}

export default POSPricingService;
