/**
 * POS Workflow API Routes
 * 
 * RESTful API endpoints for POS workflow operations.
 */

import { Router } from 'express';
import posWorkflowService from '../workflows/pos/POSWorkflowService.js';
import { POSStates, POSTriggers, POSWorkflowDefinition } from '../workflows/pos/POSWorkflowStateMachine.js';
import { screenFlowManager } from '../workflows/pos/ScreenFlowService.js';
import { ScreenFlows, POSComponents, ValidationRules } from '../workflows/pos/screens.js';

const router = Router();

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * GET /api/pos/workflow/definition
 * Get the workflow definition (for UI to understand states/transitions)
 */
router.get('/workflow/definition', (req, res) => {
  try {
    res.json({
      states: POSStates,
      triggers: POSTriggers,
      definition: {
        id: POSWorkflowDefinition.id,
        name: POSWorkflowDefinition.name,
        version: POSWorkflowDefinition.version,
        entryPoints: POSWorkflowDefinition.entryPoints,
        initialState: POSWorkflowDefinition.initialState,
        parallelStates: POSWorkflowDefinition.parallelStates,
        timeoutRules: POSWorkflowDefinition.timeoutRules,
        stateCount: Object.keys(POSWorkflowDefinition.states).length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get workflow definition' });
  }
});

// ============================================
// SCREEN FLOW ENDPOINTS
// ============================================

/**
 * GET /api/pos/flows
 * Get all available screen flows
 */
router.get('/flows', (req, res) => {
  try {
    const flows = screenFlowManager.getAllFlows();
    res.json({ flows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get flows' });
  }
});

/**
 * GET /api/pos/flows/:flowId
 * Get a specific flow definition
 */
router.get('/flows/:flowId', (req, res) => {
  try {
    const flow = screenFlowManager.getFlow(req.params.flowId);
    
    if (!flow) {
      return res.status(404).json({ error: 'Flow not found' });
    }
    
    res.json(flow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get flow' });
  }
});

/**
 * GET /api/pos/flows/:flowId/screens
 * Get all screens for a flow
 */
router.get('/flows/:flowId/screens', (req, res) => {
  try {
    const screens = screenFlowManager.getFlowScreens(req.params.flowId);
    
    if (screens.length === 0) {
      return res.status(404).json({ error: 'Flow not found or has no screens' });
    }
    
    res.json({ screens });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get screens' });
  }
});

/**
 * GET /api/pos/flows/:flowId/screens/:screenId
 * Get a specific screen definition
 */
router.get('/flows/:flowId/screens/:screenId', (req, res) => {
  try {
    const screen = screenFlowManager.getScreen(req.params.flowId, req.params.screenId);
    
    if (!screen) {
      return res.status(404).json({ error: 'Screen not found' });
    }
    
    // Get full component definitions
    const components = screenFlowManager.getScreenComponents(screen);
    const subScreens = screenFlowManager.getSubScreens(req.params.flowId, req.params.screenId);
    const shortcuts = screenFlowManager.getScreenShortcuts(req.params.flowId, req.params.screenId);
    
    res.json({
      ...screen,
      components,
      subScreens,
      shortcuts
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get screen' });
  }
});

/**
 * GET /api/pos/components
 * Get all available component definitions
 */
router.get('/components', (req, res) => {
  try {
    res.json({ components: POSComponents });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get components' });
  }
});

/**
 * GET /api/pos/validation-rules
 * Get all validation rule definitions
 */
router.get('/validation-rules', (req, res) => {
  try {
    const rules = Object.entries(ValidationRules).map(([id, rule]) => ({
      id,
      message: rule.message
    }));
    res.json({ rules });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get validation rules' });
  }
});

/**
 * GET /api/pos/validation/rules
 * Get comprehensive validation rules
 */
router.get('/validation/rules', async (req, res) => {
  try {
    const { posValidationService } = await import('../workflows/pos/POSValidationService.js');
    const rules = posValidationService.getAllRules();
    res.json(rules);
  } catch (error) {
    console.error('Failed to get validation rules:', error);
    res.status(500).json({ error: 'Failed to get validation rules' });
  }
});

/**
 * POST /api/pos/validation/field
 * Validate a single field
 */
router.post('/validation/field', async (req, res) => {
  try {
    const { posValidationService, FieldValidators } = await import('../workflows/pos/POSValidationService.js');
    
    const { value, fieldName, validators } = req.body;
    
    if (!fieldName || !validators) {
      return res.status(400).json({ error: 'fieldName and validators are required' });
    }
    
    // Map validator names to actual validators
    const validatorFns = validators.map(v => {
      if (typeof v === 'string') {
        return FieldValidators[v];
      } else if (v.name && v.args) {
        return FieldValidators[v.name]?.(...v.args);
      }
      return null;
    }).filter(Boolean);
    
    const result = posValidationService.validateField(value, fieldName, validatorFns);
    res.json(result);
  } catch (error) {
    console.error('Failed to validate field:', error);
    res.status(500).json({ error: 'Failed to validate field' });
  }
});

/**
 * POST /api/pos/validation/entity
 * Validate an entity against a schema
 */
router.post('/validation/entity', async (req, res) => {
  try {
    const { posValidationService } = await import('../workflows/pos/POSValidationService.js');
    
    const { entity, schemaName } = req.body;
    
    if (!entity || !schemaName) {
      return res.status(400).json({ error: 'entity and schemaName are required' });
    }
    
    const result = posValidationService.validateEntity(entity, schemaName);
    res.json(result);
  } catch (error) {
    console.error('Failed to validate entity:', error);
    res.status(500).json({ error: 'Failed to validate entity' });
  }
});

/**
 * POST /api/pos/validation/business-rules
 * Validate business rules against a context
 */
router.post('/validation/business-rules', async (req, res) => {
  try {
    const { posValidationService } = await import('../workflows/pos/POSValidationService.js');
    
    const { context, ruleIds } = req.body;
    
    if (!context) {
      return res.status(400).json({ error: 'context is required' });
    }
    
    const result = posValidationService.validateBusinessRules(context, ruleIds);
    res.json(result);
  } catch (error) {
    console.error('Failed to validate business rules:', error);
    res.status(500).json({ error: 'Failed to validate business rules' });
  }
});

/**
 * POST /api/pos/validation/screen
 * Validate screen data
 */
router.post('/validation/screen', async (req, res) => {
  try {
    const { posValidationService } = await import('../workflows/pos/POSValidationService.js');
    
    const { screenId, context } = req.body;
    
    if (!screenId || !context) {
      return res.status(400).json({ error: 'screenId and context are required' });
    }
    
    const result = posValidationService.validateScreen(screenId, context);
    res.json(result);
  } catch (error) {
    console.error('Failed to validate screen:', error);
    res.status(500).json({ error: 'Failed to validate screen' });
  }
});

/**
 * POST /api/pos/validation/order
 * Validate complete order
 */
router.post('/validation/order', async (req, res) => {
  try {
    const { posValidationService } = await import('../workflows/pos/POSValidationService.js');
    
    const { order } = req.body;
    
    if (!order) {
      return res.status(400).json({ error: 'order is required' });
    }
    
    const result = posValidationService.validateOrder(order);
    res.json(result);
  } catch (error) {
    console.error('Failed to validate order:', error);
    res.status(500).json({ error: 'Failed to validate order' });
  }
});

/**
 * POST /api/pos/validation/quick-sale
 * Validate quick sale data
 */
router.post('/validation/quick-sale', async (req, res) => {
  try {
    const { posValidationService } = await import('../workflows/pos/POSValidationService.js');
    
    const { sale } = req.body;
    
    if (!sale) {
      return res.status(400).json({ error: 'sale is required' });
    }
    
    const result = posValidationService.validateQuickSale(sale);
    res.json(result);
  } catch (error) {
    console.error('Failed to validate quick sale:', error);
    res.status(500).json({ error: 'Failed to validate quick sale' });
  }
});

/**
 * POST /api/pos/validation/will-call
 * Validate will-call pickup data
 */
router.post('/validation/will-call', async (req, res) => {
  try {
    const { posValidationService } = await import('../workflows/pos/POSValidationService.js');
    
    const { pickup } = req.body;
    
    if (!pickup) {
      return res.status(400).json({ error: 'pickup is required' });
    }
    
    const result = posValidationService.validateWillCallPickup(pickup);
    res.json(result);
  } catch (error) {
    console.error('Failed to validate will-call pickup:', error);
    res.status(500).json({ error: 'Failed to validate will-call pickup' });
  }
});

// ============================================
// REAL-TIME PRICING ENDPOINTS
// ============================================

/**
 * POST /api/pos/pricing/session
 * Initialize a pricing session
 */
router.post('/pricing/session', async (req, res) => {
  try {
    const { realTimePricingCalculator } = await import('../workflows/pos/RealTimePricingCalculator.js');
    
    const { sessionId, customerId, customerTier, taxExempt, taxRate, contracts } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    
    const session = realTimePricingCalculator.initSession(sessionId, {
      customerId,
      customerTier,
      taxExempt,
      taxRate,
      contracts
    });
    
    res.json({
      id: session.id,
      customerId: session.customerId,
      customerTier: session.customerTier,
      taxExempt: session.taxExempt,
      taxRate: session.taxRate,
      lines: session.lines,
      totals: session.totals
    });
  } catch (error) {
    console.error('Failed to init pricing session:', error);
    res.status(500).json({ error: 'Failed to initialize pricing session' });
  }
});

/**
 * POST /api/pos/pricing/line
 * Add or update a line item with real-time pricing
 */
router.post('/pricing/line', async (req, res) => {
  try {
    const { realTimePricingCalculator } = await import('../workflows/pos/RealTimePricingCalculator.js');
    
    const { sessionId, line } = req.body;
    
    if (!sessionId || !line) {
      return res.status(400).json({ error: 'sessionId and line are required' });
    }
    
    const result = await realTimePricingCalculator.updateLine(sessionId, line);
    res.json(result);
  } catch (error) {
    console.error('Failed to update line pricing:', error);
    res.status(500).json({ error: 'Failed to calculate line pricing' });
  }
});

/**
 * DELETE /api/pos/pricing/line/:lineNumber
 * Remove a line item
 */
router.delete('/pricing/line/:lineNumber', async (req, res) => {
  try {
    const { realTimePricingCalculator } = await import('../workflows/pos/RealTimePricingCalculator.js');
    
    const { sessionId } = req.body;
    const lineNumber = parseInt(req.params.lineNumber);
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    
    const result = realTimePricingCalculator.removeLine(sessionId, lineNumber);
    res.json(result);
  } catch (error) {
    console.error('Failed to remove line:', error);
    res.status(500).json({ error: 'Failed to remove line' });
  }
});

/**
 * POST /api/pos/pricing/discount/preview
 * Preview discount impact before applying
 */
router.post('/pricing/discount/preview', async (req, res) => {
  try {
    const { realTimePricingCalculator } = await import('../workflows/pos/RealTimePricingCalculator.js');
    
    const { sessionId, type, value, lineNumber, scope } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    
    const preview = await realTimePricingCalculator.previewDiscount(sessionId, {
      type,
      value,
      lineNumber,
      scope: scope || (lineNumber ? 'LINE' : 'ORDER')
    });
    
    res.json(preview);
  } catch (error) {
    console.error('Failed to preview discount:', error);
    res.status(500).json({ error: 'Failed to preview discount' });
  }
});

/**
 * POST /api/pos/pricing/discount/apply
 * Apply discount to line or order
 */
router.post('/pricing/discount/apply', async (req, res) => {
  try {
    const { realTimePricingCalculator } = await import('../workflows/pos/RealTimePricingCalculator.js');
    
    const { sessionId, type, value, lineNumber, scope, reason, approverId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    
    const result = await realTimePricingCalculator.applyDiscount(sessionId, {
      type,
      value,
      lineNumber,
      scope: scope || (lineNumber ? 'LINE' : 'ORDER'),
      reason,
      approverId
    });
    
    res.json(result);
  } catch (error) {
    console.error('Failed to apply discount:', error);
    res.status(500).json({ error: 'Failed to apply discount' });
  }
});

/**
 * POST /api/pos/pricing/refresh
 * Refresh all prices for a session
 */
router.post('/pricing/refresh', async (req, res) => {
  try {
    const { realTimePricingCalculator } = await import('../workflows/pos/RealTimePricingCalculator.js');
    
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    
    const result = await realTimePricingCalculator.refreshPrices(sessionId);
    res.json(result);
  } catch (error) {
    console.error('Failed to refresh prices:', error);
    res.status(500).json({ error: 'Failed to refresh prices' });
  }
});

/**
 * GET /api/pos/pricing/:sessionId
 * Get current pricing state for a session
 */
router.get('/pricing/:sessionId', async (req, res) => {
  try {
    const { realTimePricingCalculator } = await import('../workflows/pos/RealTimePricingCalculator.js');
    
    const pricing = realTimePricingCalculator.getCurrentPricing(req.params.sessionId);
    
    if (!pricing) {
      return res.status(404).json({ error: 'Pricing session not found' });
    }
    
    res.json(pricing);
  } catch (error) {
    console.error('Failed to get pricing:', error);
    res.status(500).json({ error: 'Failed to get pricing' });
  }
});

/**
 * POST /api/pos/pricing/estimate
 * Quick price estimate (no session required)
 */
router.post('/pricing/estimate', async (req, res) => {
  try {
    const { realTimePricingCalculator } = await import('../workflows/pos/RealTimePricingCalculator.js');
    
    const estimate = await realTimePricingCalculator.quickEstimate(req.body);
    res.json(estimate);
  } catch (error) {
    console.error('Failed to get estimate:', error);
    res.status(500).json({ error: 'Failed to get price estimate' });
  }
});

/**
 * POST /api/pos/pricing/margin/validate
 * Validate margin for a line or order
 */
router.post('/pricing/margin/validate', async (req, res) => {
  try {
    const { posPricingService } = await import('../workflows/pos/POSPricingService.js');
    
    const { productId, productCategory, extendedPrice, quantity, unit } = req.body;
    
    const margin = await posPricingService.calculateMargin({
      productId,
      productCategory,
      extendedPrice,
      quantity,
      unit
    });
    
    res.json(margin);
  } catch (error) {
    console.error('Failed to validate margin:', error);
    res.status(500).json({ error: 'Failed to validate margin' });
  }
});

/**
 * POST /api/pos/pricing/processing
 * Calculate processing charges
 */
router.post('/pricing/processing', async (req, res) => {
  try {
    const { posPricingService } = await import('../workflows/pos/POSPricingService.js');
    
    const result = await posPricingService.calculateProcessingCharge(req.body);
    res.json(result);
  } catch (error) {
    console.error('Failed to calculate processing:', error);
    res.status(500).json({ error: 'Failed to calculate processing charges' });
  }
});

/**
 * POST /api/pos/pricing/quantity-breaks
 * Get quantity break pricing
 */
router.post('/pricing/quantity-breaks', async (req, res) => {
  try {
    const { posPricingService } = await import('../workflows/pos/POSPricingService.js');
    
    const { customerId, productId, currentQuantity } = req.body;
    
    const breaks = await posPricingService.getQuantityBreaks({
      customerId,
      productId,
      currentQuantity
    });
    
    res.json(breaks);
  } catch (error) {
    console.error('Failed to get quantity breaks:', error);
    res.status(500).json({ error: 'Failed to get quantity breaks' });
  }
});

/**
 * GET /api/pos/sessions/:sessionId/screen
 * Get current screen for a session
 */
router.get('/sessions/:sessionId/screen', (req, res) => {
  try {
    const { flowId } = req.query;
    
    if (!flowId) {
      return res.status(400).json({ error: 'flowId query parameter is required' });
    }
    
    const screen = screenFlowManager.getCurrentScreen(req.params.sessionId, flowId);
    
    if (screen.error) {
      return res.status(404).json({ error: screen.error });
    }
    
    res.json(screen);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get current screen' });
  }
});

/**
 * GET /api/pos/sessions/:sessionId/screen/validate
 * Validate current screen data
 */
router.get('/sessions/:sessionId/screen/validate', (req, res) => {
  try {
    const { flowId, screenId } = req.query;
    
    if (!flowId) {
      return res.status(400).json({ error: 'flowId query parameter is required' });
    }
    
    const validation = screenFlowManager.validateScreen(req.params.sessionId, flowId, screenId);
    res.json(validation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate screen' });
  }
});

/**
 * POST /api/pos/sessions/:sessionId/screen/next
 * Navigate to next screen
 */
router.post('/sessions/:sessionId/screen/next', async (req, res) => {
  try {
    const { flowId } = req.body;
    
    if (!flowId) {
      return res.status(400).json({ error: 'flowId is required' });
    }
    
    const result = await screenFlowManager.navigateNext(req.params.sessionId, flowId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to navigate to next screen' });
  }
});

/**
 * POST /api/pos/sessions/:sessionId/screen/previous
 * Navigate to previous screen
 */
router.post('/sessions/:sessionId/screen/previous', async (req, res) => {
  try {
    const { flowId } = req.body;
    
    if (!flowId) {
      return res.status(400).json({ error: 'flowId is required' });
    }
    
    const result = await screenFlowManager.navigatePrevious(req.params.sessionId, flowId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to navigate to previous screen' });
  }
});

/**
 * GET /api/pos/sessions/:sessionId/progress
 * Get flow progress for a session
 */
router.get('/sessions/:sessionId/progress', (req, res) => {
  try {
    const { flowId } = req.query;
    
    if (!flowId) {
      return res.status(400).json({ error: 'flowId query parameter is required' });
    }
    
    const progress = screenFlowManager.getFlowProgress(req.params.sessionId, flowId);
    
    if (progress.error) {
      return res.status(404).json({ error: progress.error });
    }
    
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * POST /api/pos/sessions
 * Create a new POS session
 */
router.post('/sessions', async (req, res) => {
  try {
    const { userId, entryPoint, terminalId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const session = await posWorkflowService.createSession(userId, entryPoint, terminalId);
    res.status(201).json(session);
  } catch (error) {
    console.error('Failed to create POS session:', error);
    res.status(500).json({ error: error.message || 'Failed to create session' });
  }
});

/**
 * GET /api/pos/sessions
 * List all active sessions (admin/monitoring)
 */
router.get('/sessions', (req, res) => {
  try {
    const sessions = posWorkflowService.getAllSessions();
    res.json({ sessions, count: sessions.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

/**
 * GET /api/pos/sessions/:sessionId
 * Get a specific session
 */
router.get('/sessions/:sessionId', (req, res) => {
  try {
    const session = posWorkflowService.getSession(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get session' });
  }
});

/**
 * DELETE /api/pos/sessions/:sessionId
 * End a session
 */
router.delete('/sessions/:sessionId', (req, res) => {
  try {
    const result = posWorkflowService.endSession(req.params.sessionId);
    
    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to end session' });
  }
});

/**
 * POST /api/pos/sessions/:sessionId/suspend
 * Suspend a session
 */
router.post('/sessions/:sessionId/suspend', async (req, res) => {
  try {
    const result = await posWorkflowService.suspendSession(req.params.sessionId);
    
    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to suspend session' });
  }
});

// ============================================
// STATE TRANSITIONS
// ============================================

/**
 * POST /api/pos/sessions/:sessionId/transition
 * Execute a state transition
 */
router.post('/sessions/:sessionId/transition', async (req, res) => {
  try {
    const { trigger, payload } = req.body;
    
    if (!trigger) {
      return res.status(400).json({ error: 'trigger is required' });
    }
    
    const result = await posWorkflowService.transition(
      req.params.sessionId,
      trigger,
      payload || {}
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Transition failed:', error);
    res.status(500).json({ error: 'Failed to execute transition' });
  }
});

/**
 * GET /api/pos/sessions/:sessionId/actions
 * Get available actions for current state
 */
router.get('/sessions/:sessionId/actions', (req, res) => {
  try {
    const actions = posWorkflowService.getAvailableActions(req.params.sessionId);
    
    if (actions.error) {
      return res.status(404).json({ error: actions.error });
    }
    
    res.json(actions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get available actions' });
  }
});

// ============================================
// CUSTOMER OPERATIONS
// ============================================

/**
 * GET /api/pos/sessions/:sessionId/customers/search
 * Search for customers
 */
router.get('/sessions/:sessionId/customers/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    
    const result = await posWorkflowService.searchCustomers(req.params.sessionId, q);
    
    if (result.error) {
      return res.status(404).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search customers' });
  }
});

/**
 * POST /api/pos/sessions/:sessionId/customers/select
 * Select a customer for the order
 */
router.post('/sessions/:sessionId/customers/select', async (req, res) => {
  try {
    const { customerId } = req.body;
    
    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }
    
    const result = await posWorkflowService.selectCustomer(req.params.sessionId, customerId);
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to select customer' });
  }
});

/**
 * POST /api/pos/sessions/:sessionId/customers
 * Create a new quick customer
 */
router.post('/sessions/:sessionId/customers', async (req, res) => {
  try {
    const customerData = req.body;
    
    if (!customerData.name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }
    
    const result = await posWorkflowService.createQuickCustomer(req.params.sessionId, customerData);
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// ============================================
// DIVISION & SHIP-TO OPERATIONS
// ============================================

/**
 * POST /api/pos/division-flow
 * Determine division selection flow for a customer
 * Returns whether to auto-select, prompt for division, ship-to, or both
 */
router.post('/division-flow', async (req, res) => {
  try {
    const { customerId, orderSource, quoteId, orderId } = req.body;
    
    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }
    
    // Import division service dynamically
    const { divisionService } = await import('../workflows/pos/DivisionService.js');
    
    // Get customer data (mock - replace with actual DB query)
    const customer = await getCustomerWithDivisions(customerId);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Determine flow
    const flowResult = await divisionService.determineDivisionFlow(
      customer,
      orderSource || 'POS',
      { quoteId, orderId }
    );
    
    res.json(flowResult);
  } catch (error) {
    console.error('Failed to determine division flow:', error);
    res.status(500).json({ error: 'Failed to determine division flow' });
  }
});

/**
 * GET /api/pos/divisions/:divisionId/ship-tos
 * Get ship-to addresses for a division
 */
router.get('/divisions/:divisionId/ship-tos', async (req, res) => {
  try {
    const { divisionId } = req.params;
    const { customerId } = req.query;
    
    if (!customerId) {
      return res.status(400).json({ error: 'customerId query parameter is required' });
    }
    
    const { divisionService } = await import('../workflows/pos/DivisionService.js');
    
    const shipTos = await divisionService.getFilteredShipTos(customerId, divisionId);
    
    res.json({ shipTos });
  } catch (error) {
    console.error('Failed to get ship-tos:', error);
    res.status(500).json({ error: 'Failed to get ship-to addresses' });
  }
});

/**
 * POST /api/pos/sessions/:sessionId/division
 * Select division and ship-to for a session
 */
router.post('/sessions/:sessionId/division', async (req, res) => {
  try {
    const { divisionId, shipToId, jobId } = req.body;
    
    if (!divisionId) {
      return res.status(400).json({ error: 'divisionId is required' });
    }
    
    const result = await posWorkflowService.transition(
      req.params.sessionId,
      'SELECT_DIVISION',
      { divisionId, shipToId, jobId }
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Failed to select division:', error);
    res.status(500).json({ error: 'Failed to select division' });
  }
});

/**
 * GET /api/pos/sessions/:sessionId/tax-jurisdiction
 * Get tax jurisdiction for current order
 */
router.get('/sessions/:sessionId/tax-jurisdiction', async (req, res) => {
  try {
    const session = posWorkflowService.getSession(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const { divisionService } = await import('../workflows/pos/DivisionService.js');
    
    const jurisdiction = await divisionService.determineTaxJurisdiction(
      session.context.division,
      session.context.shipping?.shipTo,
      session.context.shipping?.method
    );
    
    res.json(jurisdiction);
  } catch (error) {
    console.error('Failed to get tax jurisdiction:', error);
    res.status(500).json({ error: 'Failed to get tax jurisdiction' });
  }
});

/**
 * Helper: Get customer with divisions
 * TODO: Replace with actual database query
 */
async function getCustomerWithDivisions(customerId) {
  // Mock implementation - replace with actual DB query
  // This would typically query the Customer table with related divisions and ship-tos
  return {
    id: customerId,
    name: 'Mock Customer',
    type: 'REGULAR',
    divisions: [],
    shipTos: []
  };
}

// ============================================
// PRODUCT OPERATIONS
// ============================================

/**
 * GET /api/pos/sessions/:sessionId/products/search
 * Search for products
 */
router.get('/sessions/:sessionId/products/search', async (req, res) => {
  try {
    const { q, productType, form, gradeId } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    
    const filters = {};
    if (productType) filters.productType = productType;
    if (form) filters.form = form;
    if (gradeId) filters.gradeId = gradeId;
    
    const result = await posWorkflowService.searchProducts(req.params.sessionId, q, filters);
    
    if (result.error) {
      return res.status(404).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search products' });
  }
});

/**
 * GET /api/pos/sessions/:sessionId/products/:productId
 * Get product details with availability
 */
router.get('/sessions/:sessionId/products/:productId', async (req, res) => {
  try {
    const result = await posWorkflowService.getProductDetails(
      req.params.sessionId,
      req.params.productId
    );
    
    if (result.error) {
      return res.status(404).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get product details' });
  }
});

/**
 * POST /api/pos/sessions/:sessionId/products/add
 * Add a product to the order
 */
router.post('/sessions/:sessionId/products/add', async (req, res) => {
  try {
    const productData = req.body;
    
    if (!productData.productId && !productData.description) {
      return res.status(400).json({ error: 'productId or description is required' });
    }
    
    const result = await posWorkflowService.addProduct(req.params.sessionId, productData);
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add product' });
  }
});

/**
 * POST /api/pos/sessions/:sessionId/products/add-processed
 * Add a processed item to the order
 */
router.post('/sessions/:sessionId/products/add-processed', async (req, res) => {
  try {
    const { product, processing } = req.body;
    
    if (!product) {
      return res.status(400).json({ error: 'product data is required' });
    }
    if (!processing || !processing.operationType) {
      return res.status(400).json({ error: 'processing configuration is required' });
    }
    
    const result = await posWorkflowService.addProcessedItem(
      req.params.sessionId,
      product,
      processing
    );
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add processed item' });
  }
});

// ============================================
// LINE OPERATIONS
// ============================================

/**
 * PUT /api/pos/sessions/:sessionId/lines/:lineId
 * Update a line item
 */
router.put('/sessions/:sessionId/lines/:lineId', async (req, res) => {
  try {
    const updates = req.body;
    
    const result = await posWorkflowService.updateLine(
      req.params.sessionId,
      req.params.lineId,
      updates
    );
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update line' });
  }
});

/**
 * DELETE /api/pos/sessions/:sessionId/lines/:lineId
 * Remove a line item
 */
router.delete('/sessions/:sessionId/lines/:lineId', async (req, res) => {
  try {
    const result = await posWorkflowService.removeLine(
      req.params.sessionId,
      req.params.lineId
    );
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove line' });
  }
});

// ============================================
// PRICING OPERATIONS
// ============================================

/**
 * POST /api/pos/sessions/:sessionId/pricing/discount
 * Apply a discount
 */
router.post('/sessions/:sessionId/pricing/discount', async (req, res) => {
  try {
    const discountData = req.body;
    
    if (!discountData.value && discountData.value !== 0) {
      return res.status(400).json({ error: 'Discount value is required' });
    }
    
    const result = await posWorkflowService.applyDiscount(req.params.sessionId, discountData);
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Failed to apply discount:', error);
    res.status(500).json({ error: 'Failed to apply discount' });
  }
});

/**
 * DELETE /api/pos/sessions/:sessionId/pricing/discount/:discountId
 * Remove a discount
 */
router.delete('/sessions/:sessionId/pricing/discount/:discountId', async (req, res) => {
  try {
    const { sessionId, discountId } = req.params;
    
    const result = await posWorkflowService.removeDiscount(sessionId, discountId);
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Failed to remove discount:', error);
    res.status(500).json({ error: 'Failed to remove discount' });
  }
});

/**
 * POST /api/pos/sessions/:sessionId/pricing/discount/:discountId/approve
 * Approve a discount (requires manager credentials)
 */
router.post('/sessions/:sessionId/pricing/discount/:discountId/approve', async (req, res) => {
  try {
    const { sessionId, discountId } = req.params;
    const { approverPin, approverId, reason } = req.body;
    
    if (!approverPin && !approverId) {
      return res.status(400).json({ error: 'Approver credentials required' });
    }
    
    const result = await posWorkflowService.approveDiscount(sessionId, discountId, {
      approverPin,
      approverId,
      reason
    });
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Failed to approve discount:', error);
    res.status(500).json({ error: 'Failed to approve discount' });
  }
});

/**
 * POST /api/pos/sessions/:sessionId/pricing/calculate
 * Calculate/recalculate pricing for a line
 */
router.post('/sessions/:sessionId/pricing/calculate', async (req, res) => {
  try {
    const lineData = req.body;
    
    const result = await posWorkflowService.calculateLinePrice(
      req.params.sessionId,
      lineData
    );
    
    res.json(result);
  } catch (error) {
    console.error('Failed to calculate price:', error);
    res.status(500).json({ error: 'Failed to calculate price' });
  }
});

/**
 * POST /api/pos/sessions/:sessionId/pricing/recalculate
 * Recalculate all pricing for the order
 */
router.post('/sessions/:sessionId/pricing/recalculate', async (req, res) => {
  try {
    const result = await posWorkflowService.recalculateOrderPricing(req.params.sessionId);
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Failed to recalculate pricing:', error);
    res.status(500).json({ error: 'Failed to recalculate pricing' });
  }
});

/**
 * GET /api/pos/sessions/:sessionId/pricing
 * Get current pricing summary
 */
router.get('/sessions/:sessionId/pricing', async (req, res) => {
  try {
    const result = await posWorkflowService.getPricingSummary(req.params.sessionId);
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Failed to get pricing:', error);
    res.status(500).json({ error: 'Failed to get pricing' });
  }
});

// ============================================
// ORDER SUBMISSION
// ============================================

/**
 * POST /api/pos/sessions/:sessionId/submit
 * Submit the order
 */
router.post('/sessions/:sessionId/submit', async (req, res) => {
  try {
    const result = await posWorkflowService.submitOrder(req.params.sessionId);
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Order submission failed:', error);
    res.status(500).json({ error: 'Failed to submit order' });
  }
});

// ============================================
// QUICK SALE ENDPOINTS
// ============================================

/**
 * POST /api/pos/sessions/:sessionId/quick-sale/scan
 * Scan a barcode for quick sale
 */
router.post('/sessions/:sessionId/quick-sale/scan', async (req, res) => {
  try {
    const { barcode } = req.body;
    
    if (!barcode) {
      return res.status(400).json({ error: 'barcode is required' });
    }
    
    // Look up product by barcode/SKU
    const session = posWorkflowService.getSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const products = await posWorkflowService.searchProducts(req.params.sessionId, barcode);
    
    if (products.products && products.products.length > 0) {
      // Auto-add the product
      const product = products.products[0];
      const result = await posWorkflowService.addProduct(req.params.sessionId, {
        productId: product.id,
        productSku: product.sku,
        productName: product.name,
        quantity: 1,
        unit: 'EACH'
      });
      
      // Transition back to quick sale
      await posWorkflowService.transition(req.params.sessionId, 'item_added', {});
      
      res.json({ 
        success: true, 
        product, 
        ...result 
      });
    } else {
      // Product not found, transition to product search
      await posWorkflowService.transition(req.params.sessionId, 'item_not_found', { barcode });
      res.status(404).json({ error: 'Product not found', barcode });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to process barcode scan' });
  }
});

// ============================================
// WILL-CALL ENDPOINTS
// ============================================

/**
 * GET /api/pos/will-call/queue
 * Get will-call orders ready for pickup
 */
router.get('/will-call/queue', async (req, res) => {
  try {
    const { willCallService } = await import('../workflows/pos/WillCallService.js');
    const { status, customerId, search, dateFrom, dateTo } = req.query;
    
    // Get location from user context or query
    const locationId = req.query.locationId || req.user?.locationId || 'default';
    
    const orders = await willCallService.getPickupQueue(locationId, {
      status: status ? status.split(',') : undefined,
      customerId,
      search,
      dateFrom,
      dateTo
    });
    
    const stats = await willCallService.getQueueStats(locationId);
    
    res.json({ orders, stats });
  } catch (error) {
    console.error('Failed to get will-call queue:', error);
    res.status(500).json({ error: 'Failed to get will-call queue' });
  }
});

/**
 * GET /api/pos/will-call/:orderId
 * Get will-call order details
 */
router.get('/will-call/:orderId', async (req, res) => {
  try {
    const { willCallService } = await import('../workflows/pos/WillCallService.js');
    
    const order = await willCallService.getPickupOrder(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Failed to get will-call order:', error);
    res.status(500).json({ error: 'Failed to get will-call order' });
  }
});

/**
 * POST /api/pos/will-call/:orderId/verify
 * Verify pickup person identity
 */
router.post('/will-call/:orderId/verify', async (req, res) => {
  try {
    const { willCallService } = await import('../workflows/pos/WillCallService.js');
    
    const verification = req.body;
    
    // Add employee ID from auth context
    verification.verifiedByEmployeeId = verification.verifiedByEmployeeId || req.user?.id;
    
    const result = await willCallService.verifyPickupPerson(req.params.orderId, verification);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Verification failed:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * GET /api/pos/will-call/:orderId/checklist
 * Get loading checklist for order
 */
router.get('/will-call/:orderId/checklist', async (req, res) => {
  try {
    const { willCallService } = await import('../workflows/pos/WillCallService.js');
    
    const checklist = await willCallService.getLoadingChecklist(req.params.orderId);
    
    if (!checklist) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(checklist);
  } catch (error) {
    console.error('Failed to get checklist:', error);
    res.status(500).json({ error: 'Failed to get checklist' });
  }
});

/**
 * POST /api/pos/will-call/:orderId/load-item
 * Mark item as loaded
 */
router.post('/will-call/:orderId/load-item', async (req, res) => {
  try {
    const { willCallService } = await import('../workflows/pos/WillCallService.js');
    
    const { lineId, quantityLoaded, bundleTags } = req.body;
    
    if (!lineId) {
      return res.status(400).json({ error: 'lineId is required' });
    }
    
    const result = await willCallService.markItemLoaded(req.params.orderId, lineId, {
      quantityLoaded: quantityLoaded || 1,
      bundleTags,
      loaderEmployeeId: req.user?.id
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Failed to mark item loaded:', error);
    res.status(500).json({ error: 'Failed to mark item loaded' });
  }
});

/**
 * POST /api/pos/will-call/:orderId/signature
 * Capture pickup signature
 */
router.post('/will-call/:orderId/signature', async (req, res) => {
  try {
    const { willCallService } = await import('../workflows/pos/WillCallService.js');
    
    const { signatureImage, signerName } = req.body;
    
    if (!signatureImage || !signerName) {
      return res.status(400).json({ error: 'signatureImage and signerName are required' });
    }
    
    const result = await willCallService.captureSignature(req.params.orderId, {
      signatureImage,
      signerName
    });
    
    res.json(result);
  } catch (error) {
    console.error('Failed to capture signature:', error);
    res.status(500).json({ error: 'Failed to capture signature' });
  }
});

/**
 * POST /api/pos/will-call/:orderId/vehicle-photo
 * Capture vehicle photo
 */
router.post('/will-call/:orderId/vehicle-photo', async (req, res) => {
  try {
    const { willCallService } = await import('../workflows/pos/WillCallService.js');
    
    const { photoImage, vehicleType, licensePlate } = req.body;
    
    const result = await willCallService.captureVehiclePhoto(req.params.orderId, {
      photoImage,
      vehicleType,
      licensePlate
    });
    
    res.json(result);
  } catch (error) {
    console.error('Failed to capture vehicle photo:', error);
    res.status(500).json({ error: 'Failed to capture vehicle photo' });
  }
});

/**
 * POST /api/pos/will-call/:orderId/complete
 * Complete will-call pickup
 */
router.post('/will-call/:orderId/complete', async (req, res) => {
  try {
    const { willCallService } = await import('../workflows/pos/WillCallService.js');
    
    const completionData = {
      ...req.body,
      completedByEmployeeId: req.body.completedByEmployeeId || req.user?.id
    };
    
    const result = await willCallService.completePickup(req.params.orderId, completionData);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Failed to complete pickup:', error);
    res.status(500).json({ error: 'Failed to complete pickup' });
  }
});

/**
 * POST /api/pos/will-call/:orderId/partial
 * Handle partial pickup
 */
router.post('/will-call/:orderId/partial', async (req, res) => {
  try {
    const { willCallService } = await import('../workflows/pos/WillCallService.js');
    
    const { reason, rescheduleDate, itemsToPickupNow, itemsToLeave, notes } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'reason is required for partial pickup' });
    }
    
    const result = await willCallService.handlePartialPickup(req.params.orderId, {
      reason,
      rescheduleDate,
      itemsToPickupNow,
      itemsToLeave,
      notes
    });
    
    res.json(result);
  } catch (error) {
    console.error('Failed to handle partial pickup:', error);
    res.status(500).json({ error: 'Failed to handle partial pickup' });
  }
});

/**
 * GET /api/pos/will-call/stats
 * Get will-call queue statistics
 */
router.get('/will-call/stats', async (req, res) => {
  try {
    const { willCallService } = await import('../workflows/pos/WillCallService.js');
    
    const locationId = req.query.locationId || req.user?.locationId || 'default';
    const stats = await willCallService.getQueueStats(locationId);
    
    res.json(stats);
  } catch (error) {
    console.error('Failed to get stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Legacy endpoint for session-based will-call queue (deprecated)
router.get('/sessions/:sessionId/will-call/queue', async (req, res) => {
  try {
    const { willCallService } = await import('../workflows/pos/WillCallService.js');
    const locationId = 'default';
    
    const orders = await willCallService.getPickupQueue(locationId);
    const stats = await willCallService.getQueueStats(locationId);
    
    res.json({ orders, stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get will-call queue' });
  }
});

// ============================================
// QUICK SALE ENDPOINTS
// ============================================

/**
 * POST /api/pos/quick-sale/create
 * Start a new quick sale
 */
router.post('/quick-sale/create', async (req, res) => {
  try {
    const { quickSaleService } = await import('../workflows/pos/QuickSaleService.js');
    
    const { customerType, customerId, employeeId, locationId } = req.body;
    
    const sale = await quickSaleService.createSale({
      customerType: customerType || 'WALK_IN',
      customerId,
      employeeId: employeeId || req.user?.id,
      locationId: locationId || req.user?.locationId || 'default'
    });
    
    res.json(sale);
  } catch (error) {
    console.error('Failed to create quick sale:', error);
    res.status(500).json({ error: 'Failed to create quick sale' });
  }
});

/**
 * POST /api/pos/quick-sale/lookup
 * Look up a product by barcode/SKU
 */
router.post('/quick-sale/lookup', async (req, res) => {
  try {
    const { quickSaleService } = await import('../workflows/pos/QuickSaleService.js');
    
    const { scanInput, locationId } = req.body;
    
    if (!scanInput) {
      return res.status(400).json({ error: 'scanInput is required' });
    }
    
    const product = await quickSaleService.lookupProduct(
      scanInput, 
      locationId || req.user?.locationId || 'default'
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Failed to lookup product:', error);
    res.status(500).json({ error: 'Failed to lookup product' });
  }
});

/**
 * POST /api/pos/quick-sale/:saleId/add-item
 * Add an item to the quick sale
 */
router.post('/quick-sale/:saleId/add-item', async (req, res) => {
  try {
    const { quickSaleService } = await import('../workflows/pos/QuickSaleService.js');
    
    const { product, quantity } = req.body;
    
    if (!product) {
      return res.status(400).json({ error: 'product is required' });
    }
    
    const result = await quickSaleService.addItem(
      req.params.saleId, 
      product, 
      quantity || 1
    );
    
    res.json(result);
  } catch (error) {
    console.error('Failed to add item:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

/**
 * PUT /api/pos/quick-sale/:saleId/items/:lineNumber
 * Update item quantity
 */
router.put('/quick-sale/:saleId/items/:lineNumber', async (req, res) => {
  try {
    const { quickSaleService } = await import('../workflows/pos/QuickSaleService.js');
    
    const { quantity } = req.body;
    
    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }
    
    const result = await quickSaleService.updateItemQuantity(
      req.params.saleId,
      parseInt(req.params.lineNumber),
      quantity
    );
    
    res.json(result);
  } catch (error) {
    console.error('Failed to update item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

/**
 * DELETE /api/pos/quick-sale/:saleId/items/:lineNumber
 * Remove an item from the sale
 */
router.delete('/quick-sale/:saleId/items/:lineNumber', async (req, res) => {
  try {
    const { quickSaleService } = await import('../workflows/pos/QuickSaleService.js');
    
    const result = await quickSaleService.removeItem(
      req.params.saleId,
      parseInt(req.params.lineNumber)
    );
    
    res.json(result);
  } catch (error) {
    console.error('Failed to remove item:', error);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

/**
 * DELETE /api/pos/quick-sale/:saleId/items
 * Clear all items from the sale
 */
router.delete('/quick-sale/:saleId/items', async (req, res) => {
  try {
    const { quickSaleService } = await import('../workflows/pos/QuickSaleService.js');
    
    const result = await quickSaleService.clearItems(req.params.saleId);
    
    res.json(result);
  } catch (error) {
    console.error('Failed to clear items:', error);
    res.status(500).json({ error: 'Failed to clear items' });
  }
});

/**
 * POST /api/pos/quick-sale/process-payment
 * Process payment for quick sale
 */
router.post('/quick-sale/process-payment', async (req, res) => {
  try {
    const { quickSaleService } = await import('../workflows/pos/QuickSaleService.js');
    
    const { sale, payment } = req.body;
    
    if (!sale || !payment) {
      return res.status(400).json({ error: 'sale and payment are required' });
    }
    
    const result = await quickSaleService.processPayment(sale.id || 'temp', payment);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    // Generate receipt
    const receipt = await quickSaleService.generateReceipt(sale.id || 'temp');
    
    res.json({
      ...result,
      receipt
    });
  } catch (error) {
    console.error('Failed to process payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

/**
 * GET /api/pos/quick-sale/:saleId/receipt
 * Get receipt for a sale
 */
router.get('/quick-sale/:saleId/receipt', async (req, res) => {
  try {
    const { quickSaleService } = await import('../workflows/pos/QuickSaleService.js');
    
    const receipt = await quickSaleService.generateReceipt(req.params.saleId);
    
    res.json(receipt);
  } catch (error) {
    console.error('Failed to get receipt:', error);
    res.status(500).json({ error: 'Failed to get receipt' });
  }
});

/**
 * POST /api/pos/quick-sale/print-receipt
 * Print a receipt
 */
router.post('/quick-sale/print-receipt', async (req, res) => {
  try {
    const { quickSaleService } = await import('../workflows/pos/QuickSaleService.js');
    
    const { saleId } = req.body;
    
    const receipt = await quickSaleService.generateReceipt(saleId);
    const formatted = await quickSaleService.formatReceiptForPrint(receipt);
    
    // In production, would send to print queue
    console.log('Print request for receipt:', saleId);
    
    res.json({ 
      success: true, 
      message: 'Receipt sent to printer',
      formatted
    });
  } catch (error) {
    console.error('Failed to print receipt:', error);
    res.status(500).json({ error: 'Failed to print receipt' });
  }
});

/**
 * POST /api/pos/quick-sale/email-receipt
 * Email a receipt to customer
 */
router.post('/quick-sale/email-receipt', async (req, res) => {
  try {
    const { saleId, email } = req.body;
    
    if (!saleId || !email) {
      return res.status(400).json({ error: 'saleId and email are required' });
    }
    
    // In production, would send email
    console.log('Email receipt:', saleId, 'to:', email);
    
    res.json({ 
      success: true, 
      message: `Receipt sent to ${email}`
    });
  } catch (error) {
    console.error('Failed to email receipt:', error);
    res.status(500).json({ error: 'Failed to email receipt' });
  }
});

/**
 * POST /api/pos/quick-sale/sms-receipt
 * Text a receipt link to customer
 */
router.post('/quick-sale/sms-receipt', async (req, res) => {
  try {
    const { saleId, phone } = req.body;
    
    if (!saleId || !phone) {
      return res.status(400).json({ error: 'saleId and phone are required' });
    }
    
    // In production, would send SMS
    console.log('SMS receipt:', saleId, 'to:', phone);
    
    res.json({ 
      success: true, 
      message: `Receipt link sent to ${phone}`
    });
  } catch (error) {
    console.error('Failed to SMS receipt:', error);
    res.status(500).json({ error: 'Failed to SMS receipt' });
  }
});

/**
 * POST /api/pos/quick-sale/:saleId/void
 * Void a quick sale
 */
router.post('/quick-sale/:saleId/void', async (req, res) => {
  try {
    const { quickSaleService } = await import('../workflows/pos/QuickSaleService.js');
    
    const { reason, employeeId } = req.body;
    
    const result = await quickSaleService.voidSale(
      req.params.saleId,
      reason || 'Customer request',
      employeeId || req.user?.id
    );
    
    res.json(result);
  } catch (error) {
    console.error('Failed to void sale:', error);
    res.status(500).json({ error: 'Failed to void sale' });
  }
});

/**
 * GET /api/pos/quick-sale/daily-stats
 * Get daily quick sale statistics
 */
router.get('/quick-sale/daily-stats', async (req, res) => {
  try {
    const { quickSaleService } = await import('../workflows/pos/QuickSaleService.js');
    
    const { locationId, date } = req.query;
    
    const stats = await quickSaleService.getDailyStats(
      locationId || req.user?.locationId || 'default',
      date ? new Date(date) : new Date()
    );
    
    res.json(stats);
  } catch (error) {
    console.error('Failed to get daily stats:', error);
    res.status(500).json({ error: 'Failed to get daily stats' });
  }
});

/**
 * GET /api/pos/quick-sale/quick-amounts
 * Get quick cash amount suggestions
 */
router.get('/quick-sale/quick-amounts', async (req, res) => {
  try {
    const { quickSaleService } = await import('../workflows/pos/QuickSaleService.js');
    
    const { total } = req.query;
    
    if (!total) {
      return res.status(400).json({ error: 'total is required' });
    }
    
    const amounts = quickSaleService.getQuickCashAmounts(parseFloat(total));
    
    res.json({ amounts });
  } catch (error) {
    console.error('Failed to get quick amounts:', error);
    res.status(500).json({ error: 'Failed to get quick amounts' });
  }
});

export default router;
