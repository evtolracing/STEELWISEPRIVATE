/**
 * PIPELINE API ROUTES
 * ====================
 * REST API endpoints for the pipeline orchestrator.
 * 
 * Endpoints:
 * - POST /pipeline - Create new pipeline
 * - GET /pipeline/:id - Get pipeline status
 * - POST /pipeline/:id/advance - Advance to next stage
 * - POST /pipeline/:id/auto-advance - Auto-advance through stages
 * - GET /pipelines - List all active pipelines
 * - POST /pipeline/:id/approve - Human approval
 * - GET /pipeline/:id/analysis - AI analysis
 * - POST /pipeline/simulate - Run simulation
 */

import { Router } from 'express';
import pipeline, {
  PIPELINE_STAGES,
  STAGE_TRANSITIONS,
  INPUT_CHANNELS,
  PRIORITY,
  formatPipelineOutput,
  aiDecisionEngine,
} from '../pipeline/index.js';

const router = Router();

// ============================================================================
// GET STAGE METADATA - MUST BE BEFORE /:id routes
// ============================================================================

/**
 * GET /v1/pipeline/stages
 * Get all pipeline stages and their transitions
 */
router.get('/stages', (req, res) => {
  res.json({
    stages: Object.keys(PIPELINE_STAGES),
    transitions: STAGE_TRANSITIONS,
    channels: Object.keys(INPUT_CHANNELS),
    priorities: Object.keys(PRIORITY),
  });
});

/**
 * POST /v1/pipeline/simulate
 * Run a complete pipeline simulation - MUST BE BEFORE /:id routes
 */
router.post('/simulate', async (req, res) => {
  try {
    const { 
      contact, 
      rfqData, 
      channel = 'SIMULATION',
      priority = 'STANDARD',
      stages = 'ALL',
    } = req.body;
    
    // Create pipeline
    const ctx = await pipeline.createPipeline({
      channel: INPUT_CHANNELS.SIMULATION,
      priority: PRIORITY[priority.toUpperCase()] || PRIORITY.STANDARD,
    });
    
    // Auto-advance with simulation payload
    const result = await pipeline.autoAdvance(ctx.id, {
      contact: contact || {
        companyName: 'Simulation Customer',
        contactName: 'Test User',
        email: 'test@simulation.com',
      },
      rfqData: rfqData || {
        lines: [
          { commodity: 'STEEL', form: 'SHEET', grade: 'A36', thickness: 0.125, width: 48, length: 96, quantity: 10 },
        ],
      },
      marginStrategy: { percent: 0.25 },
      simulationMode: true,
    });
    
    const finalCtx = pipeline.getPipeline(ctx.id);
    
    res.json({
      success: true,
      simulation: {
        pipelineId: ctx.id,
        stagesProcessed: result.stagesProcessed,
        finalStage: result.finalContext?.currentStage,
        blockedAt: finalCtx?.humanApprovalRequired ? {
          stage: finalCtx.currentStage,
          reason: finalCtx.humanApprovalReason,
        } : null,
      },
      context: result.finalContext,
      output: formatPipelineOutput(finalCtx, 'SIMULATION'),
    });
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// CREATE NEW PIPELINE
// ============================================================================

/**
 * POST /v1/pipeline
 * Create a new pipeline from an input event
 * 
 * Body:
 * - channel: EMAIL | PHONE | WEB_PORTAL | etc.
 * - priority: { level, label } or string (HOT, RUSH, VIP, STANDARD, LOW)
 * - contact: { companyName, contactName, email, phone, ... }
 * - rfqData: { lines: [...], requestedDueDate, ... }
 * - autoAdvance: boolean - auto-advance through stages
 */
router.post('/', async (req, res) => {
  try {
    const { channel, priority, contact, rfqData, autoAdvance } = req.body;
    
    // Determine priority object
    let priorityObj = PRIORITY.STANDARD;
    if (typeof priority === 'string') {
      priorityObj = PRIORITY[priority.toUpperCase()] || PRIORITY.STANDARD;
    } else if (priority?.level) {
      priorityObj = priority;
    }
    
    // Create pipeline
    const ctx = await pipeline.createPipeline({
      channel: channel || INPUT_CHANNELS.EMAIL,
      priority: priorityObj,
    });
    
    // If contact and/or RFQ data provided, advance through initial stages
    if (contact || rfqData) {
      // Lead capture
      await pipeline.advancePipeline(ctx.id, PIPELINE_STAGES.RFQ_RECEIVED, {
        contact,
        rfqData,
        channel,
      });
    }
    
    // Auto-advance if requested
    if (autoAdvance) {
      const result = await pipeline.autoAdvance(ctx.id, { contact, rfqData });
      return res.status(201).json({
        success: true,
        message: `Pipeline created and auto-advanced through ${result.stagesProcessed} stages`,
        pipeline: result.finalContext,
        stagesProcessed: result.stagesProcessed,
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Pipeline created',
      pipeline: ctx.toJSON(),
      nextStages: STAGE_TRANSITIONS[ctx.currentStage],
    });
  } catch (error) {
    console.error('Pipeline creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET PIPELINE STATUS
// ============================================================================

/**
 * GET /v1/pipeline/:id
 * Get current pipeline status and context
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const ctx = pipeline.getPipeline(id);
    
    if (!ctx) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    
    res.json({
      success: true,
      pipeline: ctx.toJSON(),
      status: pipeline.getStatus(id),
      output: formatPipelineOutput(ctx, 'STATUS'),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ADVANCE PIPELINE
// ============================================================================

/**
 * POST /v1/pipeline/:id/advance
 * Advance pipeline to next stage
 * 
 * Body:
 * - targetStage: (optional) specific stage to transition to
 * - payload: data for the stage handler
 */
router.post('/:id/advance', async (req, res) => {
  try {
    const { id } = req.params;
    const { targetStage, payload = {} } = req.body;
    
    const result = await pipeline.advancePipeline(id, targetStage, payload);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        context: result.context,
      });
    }
    
    const ctx = pipeline.getPipeline(id);
    
    res.json({
      success: true,
      previousStage: result.previousStage,
      currentStage: result.currentStage,
      nextValidStages: result.nextValidStages,
      output: formatPipelineOutput(ctx, 'ADVANCE'),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AUTO-ADVANCE PIPELINE
// ============================================================================

/**
 * POST /v1/pipeline/:id/auto-advance
 * Automatically advance pipeline through all stages until blocked
 */
router.post('/:id/auto-advance', async (req, res) => {
  try {
    const { id } = req.params;
    const { payload = {} } = req.body;
    
    const result = await pipeline.autoAdvance(id, payload);
    
    res.json({
      success: true,
      stagesProcessed: result.stagesProcessed,
      finalStage: result.finalContext?.currentStage,
      context: result.finalContext,
      results: result.results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// LIST PIPELINES
// ============================================================================

/**
 * GET /v1/pipelines
 * List all active pipelines with optional filters
 */
router.get('/', (req, res) => {
  try {
    const { stage, channel } = req.query;
    const pipelines = pipeline.listPipelines({ stage, channel });
    
    res.json({
      success: true,
      count: pipelines.length,
      pipelines,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// HUMAN APPROVAL
// ============================================================================

/**
 * POST /v1/pipeline/:id/approve
 * Submit human approval for a blocked pipeline
 */
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, notes, edits } = req.body;
    
    const ctx = pipeline.getPipeline(id);
    if (!ctx) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    
    if (!ctx.humanApprovalRequired) {
      return res.status(400).json({ error: 'Pipeline does not require approval' });
    }
    
    if (approved) {
      ctx.humanApprovalRequired = false;
      ctx.humanApprovalReason = null;
      
      // Apply any edits
      if (edits) {
        if (edits.rfq && ctx.rfq) Object.assign(ctx.rfq, edits.rfq);
        if (edits.quote && ctx.quote) Object.assign(ctx.quote, edits.quote);
        if (edits.order && ctx.order) Object.assign(ctx.order, edits.order);
      }
      
      ctx.addAiRecommendation({
        type: 'HUMAN_APPROVAL',
        message: 'Approved by human operator',
        confidence: 1.0,
        details: { notes },
      });
      
      res.json({
        success: true,
        message: 'Pipeline approved - ready to continue',
        pipeline: ctx.toJSON(),
        nextStages: STAGE_TRANSITIONS[ctx.currentStage],
      });
    } else {
      ctx.addError('Rejected by human operator: ' + (notes || 'No reason given'));
      
      res.json({
        success: true,
        message: 'Pipeline rejected',
        pipeline: ctx.toJSON(),
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AI ANALYSIS
// ============================================================================

/**
 * GET /v1/pipeline/:id/analysis
 * Get AI analysis and recommendations for pipeline
 */
router.get('/:id/analysis', (req, res) => {
  try {
    const { id } = req.params;
    const ctx = pipeline.getPipeline(id);
    
    if (!ctx) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    
    const analysis = aiDecisionEngine.analyzeContext(ctx);
    const risks = aiDecisionEngine.assessRisk(ctx);
    
    res.json({
      success: true,
      analysis,
      risks,
      recommendations: ctx.aiRecommendations,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PRICING RECOMMENDATION
// ============================================================================

/**
 * POST /v1/pipeline/:id/pricing-recommendation
 * Get AI pricing recommendations
 */
router.post('/:id/pricing-recommendation', (req, res) => {
  try {
    const { id } = req.params;
    const { targetMargin, competitorPrice, customerType, volume } = req.body;
    
    const ctx = pipeline.getPipeline(id);
    if (!ctx) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    
    const recommendation = aiDecisionEngine.getPricingRecommendation(ctx, {
      targetMargin,
      competitorPrice,
      customerType,
      volume,
    });
    
    res.json({
      success: true,
      recommendation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
