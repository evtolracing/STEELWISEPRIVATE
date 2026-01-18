/**
 * POS Workflow Service
 * 
 * High-level service for managing POS workflow sessions.
 * Handles session lifecycle, transitions, and integration with external services.
 */

import { PrismaClient } from '@prisma/client';
import POSWorkflowStateMachine, { POSStates, POSTriggers } from './POSWorkflowStateMachine.js';
import { evaluateGuard, getAllGuardResults } from './guards.js';
import { executeEffect, recalculatePricing } from './effects.js';
import { getPricingService } from './POSPricingService.js';
import { divisionService, DivisionFlowResult } from './DivisionService.js';

const prisma = new PrismaClient();
const pricingService = getPricingService();

// ============================================
// SESSION STORE (In-Memory - Replace with Redis for production)
// ============================================

const sessionStore = new Map();

// ============================================
// POS WORKFLOW SERVICE
// ============================================

class POSWorkflowService {
  
  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================
  
  /**
   * Create a new POS session
   */
  async createSession(userId, entryPoint = 'WALK_IN_CUSTOMER', terminalId = null) {
    const sessionId = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const initialContext = {
      currentUser: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization?.name
      },
      terminalId,
      entryPoint
    };
    
    const machine = new POSWorkflowStateMachine(sessionId, initialContext);
    
    // Store session
    sessionStore.set(sessionId, machine);
    
    // Log session creation
    console.log(`[POS] Session created: ${sessionId} by ${user.email}`);
    
    return {
      sessionId,
      currentState: machine.currentState,
      stateDefinition: machine.getStateDefinition(),
      availableTransitions: machine.getAvailableTransitions(),
      context: machine.context
    };
  }
  
  /**
   * Get an existing session
   */
  getSession(sessionId) {
    const machine = sessionStore.get(sessionId);
    
    if (!machine) {
      return null;
    }
    
    // Check timeout
    const timeoutCheck = machine.checkTimeout();
    
    return {
      sessionId,
      currentState: machine.currentState,
      stateDefinition: machine.getStateDefinition(),
      availableTransitions: machine.getAvailableTransitions(),
      activeParallelStates: Array.from(machine.activeParallelStates),
      context: machine.context,
      timeout: timeoutCheck,
      stateHistory: machine.stateHistory
    };
  }
  
  /**
   * Get all active sessions (for admin/monitoring)
   */
  getAllSessions() {
    const sessions = [];
    
    for (const [sessionId, machine] of sessionStore.entries()) {
      sessions.push({
        sessionId,
        currentState: machine.currentState,
        customer: machine.context.customer?.name || 'No customer',
        lineCount: machine.context.lines?.length || 0,
        total: machine.context.pricing?.totalAmount || 0,
        createdAt: machine.context.createdAt,
        lastActivity: machine.context.lastActivity,
        timeout: machine.checkTimeout()
      });
    }
    
    return sessions;
  }
  
  /**
   * Delete/end a session
   */
  endSession(sessionId) {
    const machine = sessionStore.get(sessionId);
    
    if (!machine) {
      return { success: false, error: 'Session not found' };
    }
    
    sessionStore.delete(sessionId);
    console.log(`[POS] Session ended: ${sessionId}`);
    
    return { success: true, sessionId };
  }
  
  /**
   * Suspend session (for timeout)
   */
  async suspendSession(sessionId) {
    const machine = sessionStore.get(sessionId);
    
    if (!machine) {
      return { success: false, error: 'Session not found' };
    }
    
    // Store in database for later resume
    // For now, just mark as suspended in memory
    machine.context.suspended = true;
    machine.context.suspendedAt = new Date();
    
    return { 
      success: true, 
      sessionId,
      message: 'Session suspended - can be resumed within 24 hours'
    };
  }
  
  // ==========================================
  // STATE TRANSITIONS
  // ==========================================
  
  /**
   * Execute a workflow transition
   */
  async transition(sessionId, trigger, payload = {}) {
    const machine = sessionStore.get(sessionId);
    
    if (!machine) {
      return { success: false, error: 'Session not found' };
    }
    
    // Check if session is suspended
    if (machine.context.suspended) {
      return { 
        success: false, 
        error: 'Session is suspended - please resume first',
        suspendedAt: machine.context.suspendedAt
      };
    }
    
    // Execute transition with guard evaluator and effect executor
    const result = machine.transition(
      trigger, 
      payload, 
      evaluateGuard, 
      executeEffect
    );
    
    if (result.success) {
      // Handle any async actions from effects
      if (result.asyncActions) {
        await this.handleAsyncActions(sessionId, result.asyncActions);
      }
      
      console.log(`[POS] ${sessionId}: ${result.previousState} -> ${result.currentState} (${trigger})`);
    }
    
    return {
      ...result,
      availableTransitions: machine.getAvailableTransitions(),
      activeParallelStates: Array.from(machine.activeParallelStates)
    };
  }
  
  /**
   * Get available actions for current state
   */
  getAvailableActions(sessionId) {
    const machine = sessionStore.get(sessionId);
    
    if (!machine) {
      return { error: 'Session not found' };
    }
    
    const transitions = machine.getAvailableTransitions();
    const guardResults = getAllGuardResults(machine.context);
    
    // Evaluate which transitions are actually available
    const availableActions = transitions.map(t => ({
      trigger: t.trigger,
      targetState: t.to,
      guard: t.guard,
      guardPasses: t.guard ? guardResults[t.guard] : true,
      effect: t.effect
    }));
    
    return {
      currentState: machine.currentState,
      stateType: machine.getStateDefinition()?.type,
      actions: availableActions,
      parallelStates: Array.from(machine.activeParallelStates)
    };
  }
  
  // ==========================================
  // CUSTOMER OPERATIONS
  // ==========================================
  
  /**
   * Search for customers
   */
  async searchCustomers(sessionId, query) {
    const machine = sessionStore.get(sessionId);
    if (!machine) return { error: 'Session not found' };
    
    // Search organizations that are customers
    const customers = await prisma.organization.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } }
        ],
        type: { in: ['FABRICATOR', 'OEM', 'DISTRIBUTOR'] },
        isActive: true
      },
      take: 20,
      orderBy: { name: 'asc' }
    });
    
    // Get credit status for each customer (simplified - would be from separate credit table)
    const results = customers.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      address: [c.address, c.city, c.state, c.postalCode].filter(Boolean).join(', '),
      phone: c.phone,
      email: c.email,
      creditStatus: 'ACTIVE', // Would come from credit module
      creditLimit: 50000, // Would come from credit module
      divisions: [] // Would come from divisions table
    }));
    
    return { customers: results };
  }
  
  /**
   * Select a customer for the order
   */
  async selectCustomer(sessionId, customerId) {
    const machine = sessionStore.get(sessionId);
    if (!machine) return { error: 'Session not found' };
    
    const customer = await prisma.organization.findUnique({
      where: { id: customerId }
    });
    
    if (!customer) {
      return { error: 'Customer not found' };
    }
    
    // Build customer object for context
    const customerData = {
      id: customer.id,
      name: customer.name,
      type: customer.type,
      address: {
        line1: customer.address,
        city: customer.city,
        state: customer.state,
        postalCode: customer.postalCode,
        country: customer.country
      },
      phone: customer.phone,
      email: customer.email,
      isActive: customer.isActive,
      creditStatus: 'ACTIVE', // From credit module
      creditLimit: 50000,
      creditAvailable: 45000,
      divisions: [], // From divisions table
      defaultPaymentTerms: 'NET30',
      taxExempt: false
    };
    
    // Determine which trigger based on credit status
    const trigger = customerData.creditStatus === 'HOLD' 
      ? POSTriggers.CUSTOMER_FOUND 
      : POSTriggers.CUSTOMER_FOUND;
    
    // Transition with customer data
    return this.transition(sessionId, trigger, { customer: customerData });
  }
  
  /**
   * Create a new quick customer
   */
  async createQuickCustomer(sessionId, customerData) {
    const machine = sessionStore.get(sessionId);
    if (!machine) return { error: 'Session not found' };
    
    // Create the organization
    const newCustomer = await prisma.organization.create({
      data: {
        name: customerData.name,
        type: customerData.type || 'FABRICATOR',
        address: customerData.address,
        city: customerData.city,
        state: customerData.state,
        postalCode: customerData.postalCode,
        country: customerData.country || 'USA',
        phone: customerData.phone,
        email: customerData.email,
        isActive: true
      }
    });
    
    // Build customer object for context
    const customer = {
      id: newCustomer.id,
      name: newCustomer.name,
      type: newCustomer.type,
      address: {
        line1: newCustomer.address,
        city: newCustomer.city,
        state: newCustomer.state,
        postalCode: newCustomer.postalCode,
        country: newCustomer.country
      },
      phone: newCustomer.phone,
      email: newCustomer.email,
      isActive: true,
      creditStatus: 'COD', // New customers start as COD
      creditLimit: 0,
      creditAvailable: 0,
      divisions: [],
      isNewCustomer: true
    };
    
    // Transition with new customer
    return this.transition(sessionId, POSTriggers.CUSTOMER_CREATED, { customer });
  }
  
  // ==========================================
  // DIVISION OPERATIONS
  // ==========================================
  
  /**
   * Determine division selection flow for current session
   */
  async getDivisionFlow(sessionId) {
    const machine = sessionStore.get(sessionId);
    if (!machine) return { error: 'Session not found' };
    
    const customer = machine.context.customer;
    if (!customer) return { error: 'No customer selected' };
    
    const orderSource = machine.context.orderSource || 'POS';
    const options = {
      quoteId: machine.context.quoteId,
      orderId: machine.context.orderId
    };
    
    return divisionService.determineDivisionFlow(customer, orderSource, options);
  }
  
  /**
   * Select division and ship-to for the order
   */
  async selectDivision(sessionId, divisionId, shipToId = null, jobId = null) {
    const machine = sessionStore.get(sessionId);
    if (!machine) return { error: 'Session not found' };
    
    const customer = machine.context.customer;
    if (!customer) return { error: 'No customer selected' };
    
    // Get division data
    const division = await divisionService.selectDivision(customer.id, divisionId);
    if (!division) return { error: 'Division not found' };
    
    // Get ship-to if specified
    let shipTo = null;
    if (shipToId) {
      shipTo = await divisionService.selectShipTo(customer.id, divisionId, shipToId);
    }
    
    // Get tax jurisdiction
    const deliveryMethod = machine.context.shipping?.method || 'DELIVERY';
    const taxJurisdiction = await divisionService.determineTaxJurisdiction(
      division,
      shipTo,
      deliveryMethod
    );
    
    // Build payload for transition
    const payload = {
      divisionId,
      division,
      shipToId,
      shipTo,
      jobId,
      taxJurisdiction
    };
    
    return this.transition(sessionId, POSTriggers.SELECT_DIVISION, payload);
  }
  
  /**
   * Get ship-to addresses for a division
   */
  async getDivisionShipTos(sessionId, divisionId) {
    const machine = sessionStore.get(sessionId);
    if (!machine) return { error: 'Session not found' };
    
    const customer = machine.context.customer;
    if (!customer) return { error: 'No customer selected' };
    
    const shipTos = await divisionService.getFilteredShipTos(customer.id, divisionId);
    return { shipTos };
  }
  
  // ==========================================
  // PRODUCT OPERATIONS
  // ==========================================
  
  /**
   * Search for products
   */
  async searchProducts(sessionId, query, filters = {}) {
    const machine = sessionStore.get(sessionId);
    if (!machine) return { error: 'Session not found' };
    
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { sku: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ],
        isActive: true,
        ...(filters.productType && { productType: filters.productType }),
        ...(filters.form && { form: filters.form }),
        ...(filters.gradeId && { gradeId: filters.gradeId })
      },
      include: {
        grade: true
      },
      take: 50,
      orderBy: { name: 'asc' }
    });
    
    return { 
      products: products.map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        category: p.category,
        productType: p.productType,
        form: p.form,
        grade: p.grade ? { id: p.grade.id, code: p.grade.code, name: p.grade.name } : null,
        thicknessRange: p.thicknessMin && p.thicknessMax 
          ? `${p.thicknessMin}" - ${p.thicknessMax}"` : null,
        widthRange: p.widthMin && p.widthMax 
          ? `${p.widthMin}" - ${p.widthMax}"` : null,
        basePriceCwt: p.basePriceCwt,
        priceUnit: p.priceUnit
      }))
    };
  }
  
  /**
   * Get product details with availability
   */
  async getProductDetails(sessionId, productId) {
    const machine = sessionStore.get(sessionId);
    if (!machine) return { error: 'Session not found' };
    
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        grade: true,
        coils: {
          where: { status: 'AVAILABLE' },
          include: { inventory: true, location: true },
          take: 10
        }
      }
    });
    
    if (!product) {
      return { error: 'Product not found' };
    }
    
    // Calculate availability summary
    const availableInventory = product.coils.reduce((sum, c) => {
      return sum + (parseFloat(c.inventory?.qtyAvailable) || 0);
    }, 0);
    
    return {
      product: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        category: product.category,
        productType: product.productType,
        form: product.form,
        grade: product.grade,
        thicknessMin: product.thicknessMin,
        thicknessMax: product.thicknessMax,
        widthMin: product.widthMin,
        widthMax: product.widthMax,
        basePriceCwt: product.basePriceCwt,
        priceUnit: product.priceUnit
      },
      availability: {
        totalAvailable: availableInventory,
        unit: 'LB',
        coilCount: product.coils.length,
        locations: [...new Set(product.coils.map(c => c.location?.name).filter(Boolean))]
      },
      inventory: product.coils.map(c => ({
        coilId: c.id,
        coilNumber: c.coilNumber,
        thickness: c.thicknessIn,
        width: c.widthIn,
        weight: c.netWeightLb,
        available: c.inventory?.qtyAvailable,
        location: c.location?.name
      }))
    };
  }
  
  /**
   * Add a product to the order
   */
  async addProduct(sessionId, productData) {
    const machine = sessionStore.get(sessionId);
    if (!machine) return { error: 'Session not found' };
    
    // Get current pricing for the product
    const pricingResult = await this.calculateLinePrice(sessionId, productData);
    const pricing = pricingResult.pricing || pricingResult;
    
    const payload = {
      ...productData,
      unitPrice: pricing.unitPrice,
      extendedPrice: pricing.extendedPrice,
      pricing: pricing
    };
    
    return this.transition(sessionId, POSTriggers.ADD_TO_ORDER, payload);
  }
  
  /**
   * Add a processed item to the order
   */
  async addProcessedItem(sessionId, productData, processingConfig) {
    const machine = sessionStore.get(sessionId);
    if (!machine) return { error: 'Session not found' };
    
    // Calculate pricing including processing
    const pricing = await this.calculateProcessingPrice(productData, processingConfig);
    
    const payload = {
      ...productData,
      ...processingConfig,
      unitPrice: pricing.unitPrice,
      processingCharge: pricing.processingCharge,
      extendedPrice: pricing.extendedPrice
    };
    
    return this.transition(sessionId, POSTriggers.CONFIG_SAVED, payload);
  }
  
  // ==========================================
  // LINE OPERATIONS
  // ==========================================
  
  /**
   * Update a line item
   */
  async updateLine(sessionId, lineId, updates) {
    const machine = sessionStore.get(sessionId);
    if (!machine) return { error: 'Session not found' };
    
    const lines = machine.context.lines || [];
    const lineIndex = lines.findIndex(l => l.id === lineId);
    
    if (lineIndex === -1) {
      return { error: 'Line not found' };
    }
    
    // Update the line
    const updatedLine = { ...lines[lineIndex], ...updates };
    
    // Recalculate extended price if quantity or price changed
    if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
      const qty = parseFloat(updatedLine.quantity) || 0;
      const price = parseFloat(updatedLine.unitPrice) || 0;
      const priceUnit = updatedLine.priceUnit || 'CWT';
      
      if (priceUnit === 'CWT') {
        updatedLine.extendedPrice = (qty / 100) * price;
      } else {
        updatedLine.extendedPrice = qty * price;
      }
    }
    
    lines[lineIndex] = updatedLine;
    
    // Recalculate totals
    const pricing = recalculatePricing(lines, machine.context.pricing);
    
    machine.context.lines = lines;
    machine.context.pricing = pricing;
    machine.context.lastActivity = new Date();
    
    return {
      success: true,
      line: updatedLine,
      pricing
    };
  }
  
  /**
   * Remove a line item
   */
  async removeLine(sessionId, lineId) {
    const machine = sessionStore.get(sessionId);
    if (!machine) return { error: 'Session not found' };
    
    const lines = machine.context.lines || [];
    const newLines = lines.filter(l => l.id !== lineId);
    
    // Renumber lines
    newLines.forEach((line, idx) => {
      line.lineNumber = idx + 1;
    });
    
    // Recalculate totals
    const pricing = recalculatePricing(newLines, machine.context.pricing);
    
    machine.context.lines = newLines;
    machine.context.pricing = pricing;
    machine.context.lastActivity = new Date();
    
    return {
      success: true,
      lines: newLines,
      pricing
    };
  }
  
  // ==========================================
  // PRICING OPERATIONS
  // ==========================================
  
  /**
   * Calculate line price using the pricing service
   */
  async calculateLinePrice(sessionId, lineData) {
    const machine = sessionStore.get(sessionId);
    
    // Get customer context for pricing
    const customer = machine?.context?.customer || null;
    const division = machine?.context?.division || null;
    
    // Use the pricing service for full calculation
    try {
      const pricing = await pricingService.calculatePrice({
        productId: lineData.productId,
        quantity: lineData.quantity,
        weight: lineData.weight,
        uom: lineData.uom || 'LB',
        processingType: lineData.processingType,
        processingConfig: lineData.processing,
        certifications: lineData.certifications
      }, {
        customerId: customer?.id,
        divisionId: division?.id,
        customerTier: customer?.tier,
        contractId: customer?.contractId
      });
      
      // Check for warnings
      const warnings = [];
      const marginResult = pricingService.calculateMargin(
        pricing.extendedPrice,
        pricing.baseCost || pricing.basePrice * 0.75, // Estimate cost if not provided
        lineData.category || 'HOT_ROLL'
      );
      
      if (!marginResult.meetsMinimum) {
        warnings.push({
          type: 'LOW_MARGIN',
          message: marginResult.message,
          severity: marginResult.margin < marginResult.minimumMargin * 0.5 ? 'ERROR' : 'WARNING'
        });
      }
      
      return {
        success: true,
        pricing: {
          ...pricing,
          margin: marginResult.margin,
          marginWarning: warnings.length > 0
        },
        warnings,
        requiresApproval: !marginResult.meetsTarget,
        approvalReason: marginResult.message
      };
    } catch (error) {
      console.error('Pricing calculation error:', error);
      
      // Fallback to simple calculation
      const product = lineData.productId 
        ? await prisma.product.findUnique({ where: { id: lineData.productId } })
        : null;
      
      const basePrice = product?.basePriceCwt || lineData.unitPrice || 0;
      const qty = parseFloat(lineData.quantity) || 0;
      const priceUnit = lineData.priceUnit || 'CWT';
      
      let extendedPrice = 0;
      if (priceUnit === 'CWT') {
        extendedPrice = (qty / 100) * basePrice;
      } else {
        extendedPrice = qty * basePrice;
      }
      
      return {
        success: true,
        pricing: {
          basePrice,
          unitPrice: basePrice,
          priceUnit,
          extendedPrice: Math.round(extendedPrice * 100) / 100,
          priceSource: 'CATALOG'
        },
        warnings: [],
        requiresApproval: false
      };
    }
  }
  
  /**
   * Calculate processing price
   */
  async calculateProcessingPrice(sessionId, productData, processingConfig) {
    // Get base product price
    const basePriceResult = await this.calculateLinePrice(sessionId, productData);
    const basePrice = basePriceResult.pricing || basePriceResult;
    
    // Use pricing service for processing charges
    try {
      const processingCharge = pricingService.calculateProcessingCharge(
        processingConfig.operationType,
        parseFloat(productData.quantity) || 0,
        processingConfig
      );
      
      return {
        ...basePrice,
        processingCharge,
        extendedPrice: basePrice.extendedPrice + processingCharge
      };
    } catch (error) {
      // Fallback to static rates
      const processingRates = {
        CTL: 0.02, // $0.02/lb
        SLIT: 0.015,
        SHEAR: 0.025,
        BLANK: 0.03,
        LEVELCUT: 0.035
      };
      
      const rate = processingRates[processingConfig.operationType] || 0.02;
      const qty = parseFloat(productData.quantity) || 0;
      const processingCharge = Math.round(qty * rate * 100) / 100;
      
      return {
        ...basePrice,
        processingCharge,
        extendedPrice: basePrice.extendedPrice + processingCharge
      };
    }
  }
  
  /**
   * Apply a discount
   */
  async applyDiscount(sessionId, discountData) {
    const machine = sessionStore.get(sessionId);
    if (!machine) return { error: 'Session not found' };
    
    const discount = {
      id: `disc_${Date.now()}`,
      type: discountData.type || 'PERCENTAGE', // PERCENTAGE, FIXED, LINE
      code: discountData.code || null,
      description: discountData.description || 'Manual discount',
      percentage: discountData.percentage || null,
      amount: discountData.amount || 0,
      appliedBy: machine.context.currentUser?.id,
      appliedAt: new Date()
    };
    
    // Calculate discount amount
    if (discount.type === 'PERCENTAGE' && discount.percentage) {
      discount.amount = (machine.context.pricing.subtotal * discount.percentage) / 100;
    }
    
    const discounts = [...(machine.context.pricing.discounts || []), discount];
    const pricing = recalculatePricing(machine.context.lines, {
      ...machine.context.pricing,
      discounts
    });
    
    machine.context.pricing = pricing;
    machine.context.lastActivity = new Date();
    
    return {
      success: true,
      discount,
      pricing
    };
  }
  
  /**
   * Remove a discount
   */
  async removeDiscount(sessionId, discountId) {
    const machine = sessionStore.get(sessionId);
    if (!machine) return { error: 'Session not found' };
    
    const discounts = (machine.context.pricing.discounts || []).filter(d => d.id !== discountId);
    
    const pricing = recalculatePricing(machine.context.lines, {
      ...machine.context.pricing,
      discounts
    });
    
    machine.context.pricing = pricing;
    machine.context.lastActivity = new Date();
    
    return {
      success: true,
      discountId,
      pricing
    };
  }
  
  /**
   * Approve a discount (manager approval)
   */
  async approveDiscount(sessionId, discountId, credentials) {
    const machine = sessionStore.get(sessionId);
    if (!machine) return { error: 'Session not found' };
    
    // Find the discount
    const discountIndex = (machine.context.pricing.discounts || [])
      .findIndex(d => d.id === discountId);
    
    if (discountIndex === -1) {
      return { error: 'Discount not found' };
    }
    
    // Validate approver credentials
    // TODO: Implement proper manager PIN validation
    if (!credentials.approverPin && !credentials.approverId) {
      return { error: 'Valid approver credentials required' };
    }
    
    // Mark discount as approved
    const discount = machine.context.pricing.discounts[discountIndex];
    discount.approved = true;
    discount.approvedBy = credentials.approverId;
    discount.approvedAt = new Date();
    discount.pendingApproval = false;
    
    // Remove from pending approvals
    machine.context.pendingApprovals = (machine.context.pendingApprovals || [])
      .filter(a => !(a.type === 'DISCOUNT' && a.discountId === discountId));
    
    machine.context.lastActivity = new Date();
    
    return {
      success: true,
      discountId,
      discount,
      pricing: machine.context.pricing
    };
  }
  
  /**
   * Recalculate all order pricing
   */
  async recalculateOrderPricing(sessionId) {
    const machine = sessionStore.get(sessionId);
    if (!machine) return { error: 'Session not found' };
    
    const pricing = recalculatePricing(machine.context.lines, machine.context.pricing);
    
    machine.context.pricing = pricing;
    machine.context.lastActivity = new Date();
    
    return {
      success: true,
      pricing
    };
  }
  
  /**
   * Get pricing summary
   */
  async getPricingSummary(sessionId) {
    const machine = sessionStore.get(sessionId);
    if (!machine) return { error: 'Session not found' };
    
    const pricing = machine.context.pricing || {};
    const pricingWarnings = machine.context.pricingWarnings || [];
    const pendingApprovals = machine.context.pendingApprovals || [];
    
    return {
      success: true,
      pricing,
      pricingWarnings,
      pendingApprovals,
      summary: {
        lineCount: machine.context.lines?.length || 0,
        subtotal: pricing.subtotal || 0,
        processingTotal: pricing.processingTotal || 0,
        discountTotal: pricing.discountTotal || 0,
        taxAmount: pricing.taxAmount || 0,
        grandTotal: pricing.grandTotal || pricing.totalAmount || 0,
        hasWarnings: pricingWarnings.length > 0,
        hasPendingApprovals: pendingApprovals.length > 0,
        isLocked: pricing.locked || false
      }
    };
  }
  
  // ==========================================
  // ORDER SUBMISSION
  // ==========================================
  
  /**
   * Submit the order
   */
  async submitOrder(sessionId) {
    const machine = sessionStore.get(sessionId);
    if (!machine) return { error: 'Session not found' };
    
    const ctx = machine.context;
    
    // Validate order can be submitted
    if (!ctx.customer) {
      return { error: 'No customer selected' };
    }
    if (!ctx.lines || ctx.lines.length === 0) {
      return { error: 'No line items' };
    }
    
    // Create the order in database
    const orderCount = await prisma.order.count();
    const orderNumber = `SO-${String(orderCount + 1).padStart(5, '0')}`;
    
    const order = await prisma.order.create({
      data: {
        orderNumber,
        orderType: 'SO',
        buyerId: ctx.customer.id,
        shipToAddress: ctx.shipping?.address?.line1,
        shipToCity: ctx.shipping?.address?.city,
        shipToState: ctx.shipping?.address?.state,
        shipToZip: ctx.shipping?.address?.postalCode,
        requiredDate: ctx.shipping?.requestedDate,
        promisedDate: ctx.shipping?.promisedDate,
        status: 'CONFIRMED',
        subtotal: ctx.pricing.subtotal,
        taxAmount: ctx.pricing.taxAmount,
        freightAmount: ctx.pricing.freightAmount,
        totalAmount: ctx.pricing.totalAmount,
        paymentTerms: ctx.payment?.method,
        freightTerms: ctx.shipping?.method === 'will_call' ? null : 'PREPAID',
        poReference: ctx.poReference,
        notes: ctx.notes,
        createdById: ctx.currentUser.id,
        lines: {
          create: ctx.lines.map((line, idx) => ({
            lineNumber: idx + 1,
            productId: line.productId || undefined,
            gradeId: line.gradeId || undefined,
            description: line.description,
            thicknessIn: line.thickness,
            widthIn: line.width,
            lengthIn: line.length,
            qtyOrdered: line.quantity,
            unit: line.unit || 'LB',
            unitPrice: line.unitPrice,
            priceUnit: line.priceUnit || 'CWT',
            extendedPrice: line.extendedPrice,
            notes: line.notes
          }))
        }
      },
      include: {
        lines: true,
        buyer: true
      }
    });
    
    // Store order reference in context
    machine.context.orderId = order.id;
    machine.context.orderNumber = order.orderNumber;
    
    console.log(`[POS] Order created: ${order.orderNumber} for ${ctx.customer.name}`);
    
    // Transition to confirmation
    const transitionResult = await this.transition(sessionId, POSTriggers.SUBMIT_ORDER, {
      orderId: order.id,
      orderNumber: order.orderNumber
    });
    
    return {
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.buyer?.name,
        total: order.totalAmount,
        lineCount: order.lines.length,
        status: order.status
      },
      transition: transitionResult
    };
  }
  
  // ==========================================
  // ASYNC ACTION HANDLERS
  // ==========================================
  
  /**
   * Handle async actions from effects
   */
  async handleAsyncActions(sessionId, asyncActions) {
    if (!asyncActions || asyncActions.length === 0) return;
    
    for (const action of asyncActions) {
      try {
        switch (action.action) {
          case 'CHECK_INVENTORY':
            await this.checkInventoryForLine(sessionId, action.lineId, action.productId);
            break;
          case 'BATCH_CHECK_INVENTORY':
            for (const lineId of action.lineIds) {
              await this.checkInventoryForLine(sessionId, lineId);
            }
            break;
          case 'CHECK_PROCESSING_AVAILABILITY':
            await this.checkProcessingAvailability(sessionId, action.lineId, action.operationType);
            break;
          case 'REPRICE_AND_CHECK_INVENTORY':
            for (const lineId of action.lineIds) {
              await this.repriceAndCheckLine(sessionId, lineId);
            }
            break;
          case 'LOG_PRICING_APPROVAL':
            console.log(`[POS] Pricing approved for ${action.sessionId} by ${action.approverId}`);
            break;
          default:
            console.warn(`[POS] Unknown async action: ${action.action}`);
        }
      } catch (error) {
        console.error(`[POS] Async action failed: ${action.action}`, error);
      }
    }
  }
  
  /**
   * Check inventory for a line item
   */
  async checkInventoryForLine(sessionId, lineId, productId = null) {
    const machine = sessionStore.get(sessionId);
    if (!machine) return;
    
    const line = machine.context.lines?.find(l => l.id === lineId);
    if (!line) return;
    
    // Check available inventory
    const pId = productId || line.productId;
    if (!pId) {
      line.inventoryStatus = 'UNKNOWN';
      return;
    }
    
    const inventory = await prisma.inventory.aggregate({
      where: {
        coil: { productId: pId, status: 'AVAILABLE' }
      },
      _sum: { qtyAvailable: true }
    });
    
    const available = parseFloat(inventory._sum.qtyAvailable) || 0;
    const requested = parseFloat(line.quantity) || 0;
    
    if (available >= requested) {
      line.inventoryStatus = 'IN_STOCK';
    } else if (available > 0) {
      line.inventoryStatus = 'PARTIAL';
      line.availableQty = available;
    } else {
      line.inventoryStatus = 'OUT_OF_STOCK';
    }
    
    machine.context.lastActivity = new Date();
  }
  
  /**
   * Check processing availability
   */
  async checkProcessingAvailability(sessionId, lineId, operationType) {
    const machine = sessionStore.get(sessionId);
    if (!machine) return;
    
    const line = machine.context.lines?.find(l => l.id === lineId);
    if (!line) return;
    
    // Check work center availability (simplified)
    const workCenters = await prisma.workCenter.findMany({
      where: {
        capabilities: { has: operationType },
        isActive: true
      }
    });
    
    if (workCenters.length > 0) {
      line.processingStatus = 'AVAILABLE';
      line.availableWorkCenters = workCenters.map(wc => wc.code);
    } else {
      line.processingStatus = 'NOT_AVAILABLE';
    }
    
    machine.context.lastActivity = new Date();
  }
  
  /**
   * Reprice a line and check inventory
   */
  async repriceAndCheckLine(sessionId, lineId) {
    const machine = sessionStore.get(sessionId);
    if (!machine) return;
    
    const line = machine.context.lines?.find(l => l.id === lineId);
    if (!line) return;
    
    // Get current price
    const pricingResult = await this.calculateLinePrice(sessionId, line);
    const pricing = pricingResult.pricing || pricingResult;
    line.unitPrice = pricing.unitPrice;
    line.extendedPrice = pricing.extendedPrice;
    line.pricing = pricing;
    
    // Check inventory
    await this.checkInventoryForLine(sessionId, lineId, line.productId);
    
    // Recalculate totals
    machine.context.pricing = recalculatePricing(machine.context.lines, machine.context.pricing);
    machine.context.lastActivity = new Date();
  }
}

// Export singleton instance
export const posWorkflowService = new POSWorkflowService();
export default posWorkflowService;
