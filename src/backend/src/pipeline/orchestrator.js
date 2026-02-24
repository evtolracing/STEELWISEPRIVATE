/**
 * STEELWISE PIPELINE ORCHESTRATOR
 * ================================
 * Master workflow engine for metals/plastics service center operations.
 * 
 * Controls the full flow:
 * Lead → RFQ → Quote → Order → Planning → Jobs → Shop Floor → QC → Pack → Ship → Invoice → Analytics
 * 
 * This orchestrator is BULLETPROOF and EXHAUSTIVE.
 */

import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/db.js';

// ============================================================================
// PIPELINE STAGES (STATE MACHINE)
// ============================================================================

export const PIPELINE_STAGES = {
  // Commercial Layer
  LEAD_CAPTURE: 'LEAD_CAPTURE',
  RFQ_RECEIVED: 'RFQ_RECEIVED',
  RFQ_PARSING: 'RFQ_PARSING',
  RFQ_CSR_REVIEW: 'RFQ_CSR_REVIEW',
  QUOTE_BUILDING: 'QUOTE_BUILDING',
  QUOTE_PRICING: 'QUOTE_PRICING',
  QUOTE_NEGOTIATION: 'QUOTE_NEGOTIATION',
  QUOTE_SENT: 'QUOTE_SENT',
  QUOTE_ACCEPTED: 'QUOTE_ACCEPTED',
  QUOTE_REJECTED: 'QUOTE_REJECTED',
  
  // Order Execution Layer
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_PLANNING: 'ORDER_PLANNING',
  ORDER_INVENTORY_CHECK: 'ORDER_INVENTORY_CHECK',
  ORDER_ALLOCATION: 'ORDER_ALLOCATION',
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  
  // Production Layer
  JOB_CREATED: 'JOB_CREATED',
  JOB_BOM_MATCHED: 'JOB_BOM_MATCHED',
  JOB_SCHEDULED: 'JOB_SCHEDULED',
  JOB_DISPATCHED: 'JOB_DISPATCHED',
  JOB_IN_PROGRESS: 'JOB_IN_PROGRESS',
  JOB_QC_CHECK: 'JOB_QC_CHECK',
  JOB_COMPLETED: 'JOB_COMPLETED',
  JOB_REWORK: 'JOB_REWORK',
  
  // Fulfillment Layer
  PACK_CREATED: 'PACK_CREATED',
  PACK_LABELED: 'PACK_LABELED',
  SHIP_READY: 'SHIP_READY',
  SHIP_DISPATCHED: 'SHIP_DISPATCHED',
  SHIP_IN_TRANSIT: 'SHIP_IN_TRANSIT',
  SHIP_DELIVERED: 'SHIP_DELIVERED',
  
  // Financial Layer
  INVOICE_CREATED: 'INVOICE_CREATED',
  INVOICE_SENT: 'INVOICE_SENT',
  INVOICE_PAID: 'INVOICE_PAID',
  
  // Terminal States
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ON_HOLD: 'ON_HOLD',
};

// ============================================================================
// STAGE TRANSITIONS (VALID NEXT STATES)
// ============================================================================

export const STAGE_TRANSITIONS = {
  [PIPELINE_STAGES.LEAD_CAPTURE]: [PIPELINE_STAGES.RFQ_RECEIVED],
  [PIPELINE_STAGES.RFQ_RECEIVED]: [PIPELINE_STAGES.RFQ_PARSING, PIPELINE_STAGES.RFQ_CSR_REVIEW, PIPELINE_STAGES.CANCELLED],
  [PIPELINE_STAGES.RFQ_PARSING]: [PIPELINE_STAGES.RFQ_CSR_REVIEW, PIPELINE_STAGES.ON_HOLD],
  [PIPELINE_STAGES.RFQ_CSR_REVIEW]: [PIPELINE_STAGES.QUOTE_BUILDING, PIPELINE_STAGES.CANCELLED],
  [PIPELINE_STAGES.QUOTE_BUILDING]: [PIPELINE_STAGES.QUOTE_PRICING],
  [PIPELINE_STAGES.QUOTE_PRICING]: [PIPELINE_STAGES.QUOTE_SENT, PIPELINE_STAGES.QUOTE_NEGOTIATION],
  [PIPELINE_STAGES.QUOTE_NEGOTIATION]: [PIPELINE_STAGES.QUOTE_PRICING, PIPELINE_STAGES.QUOTE_SENT, PIPELINE_STAGES.CANCELLED],
  [PIPELINE_STAGES.QUOTE_SENT]: [PIPELINE_STAGES.QUOTE_ACCEPTED, PIPELINE_STAGES.QUOTE_REJECTED, PIPELINE_STAGES.QUOTE_NEGOTIATION],
  [PIPELINE_STAGES.QUOTE_ACCEPTED]: [PIPELINE_STAGES.ORDER_CREATED],
  [PIPELINE_STAGES.QUOTE_REJECTED]: [PIPELINE_STAGES.CANCELLED],
  
  [PIPELINE_STAGES.ORDER_CREATED]: [PIPELINE_STAGES.ORDER_PLANNING],
  [PIPELINE_STAGES.ORDER_PLANNING]: [PIPELINE_STAGES.ORDER_INVENTORY_CHECK],
  [PIPELINE_STAGES.ORDER_INVENTORY_CHECK]: [PIPELINE_STAGES.ORDER_ALLOCATION, PIPELINE_STAGES.ON_HOLD],
  [PIPELINE_STAGES.ORDER_ALLOCATION]: [PIPELINE_STAGES.ORDER_CONFIRMED, PIPELINE_STAGES.ON_HOLD],
  [PIPELINE_STAGES.ORDER_CONFIRMED]: [PIPELINE_STAGES.JOB_CREATED],
  
  [PIPELINE_STAGES.JOB_CREATED]: [PIPELINE_STAGES.JOB_BOM_MATCHED],
  [PIPELINE_STAGES.JOB_BOM_MATCHED]: [PIPELINE_STAGES.JOB_SCHEDULED],
  [PIPELINE_STAGES.JOB_SCHEDULED]: [PIPELINE_STAGES.JOB_DISPATCHED],
  [PIPELINE_STAGES.JOB_DISPATCHED]: [PIPELINE_STAGES.JOB_IN_PROGRESS],
  [PIPELINE_STAGES.JOB_IN_PROGRESS]: [PIPELINE_STAGES.JOB_QC_CHECK, PIPELINE_STAGES.JOB_REWORK, PIPELINE_STAGES.ON_HOLD],
  [PIPELINE_STAGES.JOB_QC_CHECK]: [PIPELINE_STAGES.JOB_COMPLETED, PIPELINE_STAGES.JOB_REWORK],
  [PIPELINE_STAGES.JOB_REWORK]: [PIPELINE_STAGES.JOB_IN_PROGRESS],
  [PIPELINE_STAGES.JOB_COMPLETED]: [PIPELINE_STAGES.PACK_CREATED],
  
  [PIPELINE_STAGES.PACK_CREATED]: [PIPELINE_STAGES.PACK_LABELED],
  [PIPELINE_STAGES.PACK_LABELED]: [PIPELINE_STAGES.SHIP_READY],
  [PIPELINE_STAGES.SHIP_READY]: [PIPELINE_STAGES.SHIP_DISPATCHED],
  [PIPELINE_STAGES.SHIP_DISPATCHED]: [PIPELINE_STAGES.SHIP_IN_TRANSIT],
  [PIPELINE_STAGES.SHIP_IN_TRANSIT]: [PIPELINE_STAGES.SHIP_DELIVERED],
  [PIPELINE_STAGES.SHIP_DELIVERED]: [PIPELINE_STAGES.INVOICE_CREATED],
  
  [PIPELINE_STAGES.INVOICE_CREATED]: [PIPELINE_STAGES.INVOICE_SENT],
  [PIPELINE_STAGES.INVOICE_SENT]: [PIPELINE_STAGES.INVOICE_PAID],
  [PIPELINE_STAGES.INVOICE_PAID]: [PIPELINE_STAGES.COMPLETED],
  
  [PIPELINE_STAGES.COMPLETED]: [],
  [PIPELINE_STAGES.CANCELLED]: [],
  [PIPELINE_STAGES.ON_HOLD]: Object.values(PIPELINE_STAGES),
};

// ============================================================================
// INPUT CHANNELS
// ============================================================================

export const INPUT_CHANNELS = {
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  WEB_PORTAL: 'WEB_PORTAL',
  EDI: 'EDI',
  MARKETPLACE: 'MARKETPLACE',
  ECOMMERCE: 'ECOMMERCE',
  INTERNAL_REORDER: 'INTERNAL_REORDER',
  SIMULATION: 'SIMULATION',
};

// ============================================================================
// ROLES & PERMISSIONS
// ============================================================================

export const ROLES = {
  EXECUTIVE: 'EXECUTIVE',
  SALES: 'SALES',
  CSR: 'CSR',
  OPS_MANAGER: 'OPS_MANAGER',
  INVENTORY: 'INVENTORY',
  OPERATOR: 'OPERATOR',
  QC: 'QC',
  PACKAGING: 'PACKAGING',
  FINANCE: 'FINANCE',
  ADMIN: 'ADMIN',
};

export const ROLE_PERMISSIONS = {
  [ROLES.EXECUTIVE]: ['PRICING', 'COSTING', 'ANALYTICS', 'REPORTS', 'OVERRIDE_ALL'],
  [ROLES.SALES]: ['RFQ', 'QUOTE', 'CUSTOMER', 'MARGIN', 'NEGOTIATION'],
  [ROLES.CSR]: ['RFQ', 'QUOTE', 'ORDER', 'CONTACT'],
  [ROLES.OPS_MANAGER]: ['DISPATCH', 'CAPACITY', 'WIP', 'WORK_CENTERS', 'SCHEDULING'],
  [ROLES.INVENTORY]: ['STOCK', 'REPLENISHMENT', 'TRANSFERS', 'RECEIVING'],
  [ROLES.OPERATOR]: ['QUEUE', 'START', 'PAUSE', 'COMPLETE', 'RFID'],
  [ROLES.QC]: ['DISPOSITION', 'REWORK', 'SCRAP', 'HOLD'],
  [ROLES.PACKAGING]: ['LABEL', 'PACKAGE', 'SHIP', 'ASN'],
  [ROLES.FINANCE]: ['INVOICE', 'MARGIN', 'FREIGHT', 'PRICING'],
  [ROLES.ADMIN]: ['*'],
};

// ============================================================================
// PRIORITY LEVELS
// ============================================================================

export const PRIORITY = {
  HOT: { level: 1, label: 'HOT', multiplier: 1.5 },
  RUSH: { level: 2, label: 'RUSH', multiplier: 1.25 },
  VIP: { level: 3, label: 'VIP', multiplier: 1.15 },
  STANDARD: { level: 4, label: 'STANDARD', multiplier: 1.0 },
  LOW: { level: 5, label: 'LOW', multiplier: 0.9 },
};

// ============================================================================
// PIPELINE CONTEXT (TRACKS STATE THROUGH ENTIRE FLOW)
// ============================================================================

export class PipelineContext {
  constructor(input = {}) {
    this.id = uuidv4();
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    this.channel = input.channel || INPUT_CHANNELS.EMAIL;
    this.priority = input.priority || PRIORITY.STANDARD;
    this.currentStage = PIPELINE_STAGES.LEAD_CAPTURE;
    this.stageHistory = [];
    this.errors = [];
    this.warnings = [];
    this.aiRecommendations = [];
    this.humanApprovalRequired = false;
    this.humanApprovalReason = null;
    
    // Entity References
    this.contactId = null;
    this.rfqId = null;
    this.quoteId = null;
    this.orderId = null;
    this.jobIds = [];
    this.packageIds = [];
    this.shipmentId = null;
    this.invoiceId = null;
    
    // Domain Data
    this.contact = null;
    this.rfq = null;
    this.quote = null;
    this.order = null;
    this.jobs = [];
    this.packages = [];
    this.shipment = null;
    this.invoice = null;
    
    // Inventory & Allocation
    this.inventoryAllocations = [];
    this.substitutions = [];
    this.stockWarnings = [];
    
    // Production
    this.bomRecipes = [];
    this.workCenterAssignments = [];
    this.operatorAssignments = [];
    
    // Analytics
    this.metrics = {
      totalValue: 0,
      marginPercent: 0,
      estimatedLeadTime: 0,
      actualLeadTime: 0,
    };
  }
  
  transitionTo(nextStage, reason = null) {
    const validTransitions = STAGE_TRANSITIONS[this.currentStage] || [];
    if (!validTransitions.includes(nextStage)) {
      throw new Error(`Invalid transition from ${this.currentStage} to ${nextStage}`);
    }
    
    this.stageHistory.push({
      from: this.currentStage,
      to: nextStage,
      timestamp: new Date().toISOString(),
      reason,
    });
    
    this.currentStage = nextStage;
    this.updatedAt = new Date().toISOString();
    return this;
  }
  
  addError(error) {
    this.errors.push({ message: error, timestamp: new Date().toISOString() });
  }
  
  addWarning(warning) {
    this.warnings.push({ message: warning, timestamp: new Date().toISOString() });
  }
  
  addAiRecommendation(recommendation) {
    this.aiRecommendations.push({
      ...recommendation,
      timestamp: new Date().toISOString(),
    });
  }
  
  requireHumanApproval(reason) {
    this.humanApprovalRequired = true;
    this.humanApprovalReason = reason;
  }
  
  toJSON() {
    return {
      id: this.id,
      currentStage: this.currentStage,
      channel: this.channel,
      priority: this.priority,
      stageHistory: this.stageHistory,
      errors: this.errors,
      warnings: this.warnings,
      aiRecommendations: this.aiRecommendations,
      humanApprovalRequired: this.humanApprovalRequired,
      humanApprovalReason: this.humanApprovalReason,
      entities: {
        contactId: this.contactId,
        rfqId: this.rfqId,
        quoteId: this.quoteId,
        orderId: this.orderId,
        jobIds: this.jobIds,
        packageIds: this.packageIds,
        shipmentId: this.shipmentId,
        invoiceId: this.invoiceId,
      },
      metrics: this.metrics,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

// ============================================================================
// PIPELINE ORCHESTRATOR (MAIN ENGINE)
// ============================================================================

export class PipelineOrchestrator {
  constructor() {
    this.activePipelines = new Map();
    this.domainHandlers = {};
  }
  
  /**
   * Register a domain handler for a specific stage
   */
  registerHandler(stage, handler) {
    this.domainHandlers[stage] = handler;
  }
  
  /**
   * Create a new pipeline from an input event
   */
  async createPipeline(input) {
    const ctx = new PipelineContext(input);
    this.activePipelines.set(ctx.id, ctx);
    return ctx;
  }
  
  /**
   * Get pipeline by ID
   */
  getPipeline(id) {
    return this.activePipelines.get(id);
  }
  
  /**
   * Advance pipeline to next stage
   */
  async advancePipeline(pipelineId, targetStage = null, payload = {}) {
    const ctx = this.activePipelines.get(pipelineId);
    if (!ctx) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }
    
    // Determine next stage
    const validNextStages = STAGE_TRANSITIONS[ctx.currentStage] || [];
    if (validNextStages.length === 0) {
      return {
        success: false,
        error: `Pipeline is in terminal state: ${ctx.currentStage}`,
        context: ctx.toJSON(),
      };
    }
    
    const nextStage = targetStage || validNextStages[0];
    
    // Execute handler if registered
    const handler = this.domainHandlers[nextStage];
    if (handler) {
      try {
        await handler(ctx, payload);
      } catch (error) {
        ctx.addError(error.message);
        return {
          success: false,
          error: error.message,
          context: ctx.toJSON(),
        };
      }
    }
    
    // Transition
    ctx.transitionTo(nextStage, payload.reason || 'Auto-advance');
    
    return {
      success: true,
      previousStage: ctx.stageHistory[ctx.stageHistory.length - 1]?.from,
      currentStage: ctx.currentStage,
      nextValidStages: STAGE_TRANSITIONS[ctx.currentStage],
      context: ctx.toJSON(),
    };
  }
  
  /**
   * Auto-advance pipeline through all stages until blocked
   */
  async autoAdvance(pipelineId, payload = {}) {
    const results = [];
    let continueAdvancing = true;
    let maxIterations = 50; // Safety limit
    
    while (continueAdvancing && maxIterations > 0) {
      const ctx = this.activePipelines.get(pipelineId);
      if (!ctx) break;
      
      const validNextStages = STAGE_TRANSITIONS[ctx.currentStage] || [];
      
      // Stop if terminal state or requires human approval
      if (validNextStages.length === 0 || ctx.humanApprovalRequired) {
        continueAdvancing = false;
        break;
      }
      
      const result = await this.advancePipeline(pipelineId, validNextStages[0], payload);
      results.push(result);
      
      if (!result.success) {
        continueAdvancing = false;
      }
      
      maxIterations--;
    }
    
    return {
      stagesProcessed: results.length,
      results,
      finalContext: this.activePipelines.get(pipelineId)?.toJSON(),
    };
  }
  
  /**
   * Get pipeline status summary
   */
  getStatus(pipelineId) {
    const ctx = this.activePipelines.get(pipelineId);
    if (!ctx) return null;
    
    return {
      id: ctx.id,
      currentStage: ctx.currentStage,
      nextValidStages: STAGE_TRANSITIONS[ctx.currentStage],
      humanApprovalRequired: ctx.humanApprovalRequired,
      humanApprovalReason: ctx.humanApprovalReason,
      errorsCount: ctx.errors.length,
      warningsCount: ctx.warnings.length,
      aiRecommendationsCount: ctx.aiRecommendations.length,
      entities: {
        contactId: ctx.contactId,
        rfqId: ctx.rfqId,
        quoteId: ctx.quoteId,
        orderId: ctx.orderId,
        jobIds: ctx.jobIds,
      },
    };
  }
  
  /**
   * List all active pipelines
   */
  listPipelines(filters = {}) {
    const pipelines = Array.from(this.activePipelines.values());
    
    return pipelines
      .filter(p => {
        if (filters.stage && p.currentStage !== filters.stage) return false;
        if (filters.channel && p.channel !== filters.channel) return false;
        return true;
      })
      .map(p => this.getStatus(p.id));
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const orchestrator = new PipelineOrchestrator();

// ============================================================================
// PIPELINE OUTPUT FORMAT
// ============================================================================

export function formatPipelineOutput(ctx, action = 'STATUS') {
  return {
    action,
    timestamp: new Date().toISOString(),
    pipeline: {
      id: ctx.id,
      currentStage: ctx.currentStage,
      nextStage: STAGE_TRANSITIONS[ctx.currentStage]?.[0] || null,
    },
    systemActions: ctx.stageHistory.slice(-5).map(h => ({
      stage: h.to,
      timestamp: h.timestamp,
      reason: h.reason,
    })),
    dataObjectsModified: {
      contact: ctx.contactId ? 'LINKED' : null,
      rfq: ctx.rfqId ? 'LINKED' : null,
      quote: ctx.quoteId ? 'LINKED' : null,
      order: ctx.orderId ? 'LINKED' : null,
      jobs: ctx.jobIds.length > 0 ? `${ctx.jobIds.length} CREATED` : null,
    },
    roleImpacts: determineRoleImpacts(ctx.currentStage),
    aiRecommendations: ctx.aiRecommendations,
    risks: ctx.warnings.map(w => ({ type: 'WARNING', message: w.message })),
    flags: ctx.errors.map(e => ({ type: 'ERROR', message: e.message })),
    humanApprovalPoint: ctx.humanApprovalRequired ? {
      required: true,
      reason: ctx.humanApprovalReason,
    } : null,
    metrics: ctx.metrics,
  };
}

function determineRoleImpacts(stage) {
  const impacts = {
    [PIPELINE_STAGES.LEAD_CAPTURE]: [ROLES.SALES, ROLES.CSR],
    [PIPELINE_STAGES.RFQ_RECEIVED]: [ROLES.CSR],
    [PIPELINE_STAGES.RFQ_PARSING]: [ROLES.CSR],
    [PIPELINE_STAGES.RFQ_CSR_REVIEW]: [ROLES.CSR, ROLES.SALES],
    [PIPELINE_STAGES.QUOTE_BUILDING]: [ROLES.CSR, ROLES.SALES],
    [PIPELINE_STAGES.QUOTE_PRICING]: [ROLES.SALES, ROLES.EXECUTIVE],
    [PIPELINE_STAGES.QUOTE_NEGOTIATION]: [ROLES.SALES],
    [PIPELINE_STAGES.ORDER_CREATED]: [ROLES.CSR],
    [PIPELINE_STAGES.ORDER_PLANNING]: [ROLES.OPS_MANAGER, ROLES.INVENTORY],
    [PIPELINE_STAGES.ORDER_INVENTORY_CHECK]: [ROLES.INVENTORY],
    [PIPELINE_STAGES.ORDER_ALLOCATION]: [ROLES.INVENTORY, ROLES.OPS_MANAGER],
    [PIPELINE_STAGES.JOB_CREATED]: [ROLES.OPS_MANAGER],
    [PIPELINE_STAGES.JOB_DISPATCHED]: [ROLES.OPS_MANAGER, ROLES.OPERATOR],
    [PIPELINE_STAGES.JOB_IN_PROGRESS]: [ROLES.OPERATOR],
    [PIPELINE_STAGES.JOB_QC_CHECK]: [ROLES.QC],
    [PIPELINE_STAGES.PACK_CREATED]: [ROLES.PACKAGING],
    [PIPELINE_STAGES.SHIP_READY]: [ROLES.PACKAGING],
    [PIPELINE_STAGES.INVOICE_CREATED]: [ROLES.FINANCE],
  };
  
  return impacts[stage] || [];
}

export default orchestrator;
