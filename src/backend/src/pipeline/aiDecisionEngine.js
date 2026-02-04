/**
 * AI DECISION ENGINE
 * ===================
 * Provides intelligent recommendations, risk assessment, and automated decisions
 * for the pipeline orchestrator.
 */

import { PRIORITY, PIPELINE_STAGES } from './orchestrator.js';

// ============================================================================
// DECISION TYPES
// ============================================================================

export const DECISION_TYPES = {
  PRICING: 'PRICING',
  INVENTORY: 'INVENTORY',
  SCHEDULING: 'SCHEDULING',
  ROUTING: 'ROUTING',
  CARRIER: 'CARRIER',
  SUBSTITUTION: 'SUBSTITUTION',
  RISK: 'RISK',
  MARGIN: 'MARGIN',
  CAPACITY: 'CAPACITY',
};

// ============================================================================
// RISK LEVELS
// ============================================================================

export const RISK_LEVELS = {
  LOW: { level: 1, label: 'LOW', color: 'green' },
  MEDIUM: { level: 2, label: 'MEDIUM', color: 'yellow' },
  HIGH: { level: 3, label: 'HIGH', color: 'orange' },
  CRITICAL: { level: 4, label: 'CRITICAL', color: 'red' },
};

// ============================================================================
// AI DECISION ENGINE
// ============================================================================

export class AIDecisionEngine {
  constructor() {
    this.decisionHistory = [];
    this.riskThresholds = {
      marginWarning: 0.15,     // Warn if margin < 15%
      marginCritical: 0.10,    // Critical if margin < 10%
      leadTimeWarning: 7,      // Warn if lead time > 7 days
      leadTimeCritical: 14,    // Critical if lead time > 14 days
      stockWarning: 0.2,       // Warn if stock coverage < 20%
      capacityWarning: 0.85,   // Warn if capacity > 85%
    };
  }
  
  /**
   * Analyze pipeline context and generate comprehensive recommendations
   */
  analyzeContext(ctx) {
    const analysis = {
      timestamp: new Date().toISOString(),
      pipelineId: ctx.id,
      currentStage: ctx.currentStage,
      overallRisk: RISK_LEVELS.LOW,
      decisions: [],
      recommendations: [],
      risks: [],
      alternatives: [],
      blockers: [],
    };
    
    // Analyze based on current stage
    switch (ctx.currentStage) {
      case PIPELINE_STAGES.RFQ_RECEIVED:
        this._analyzeRfq(ctx, analysis);
        break;
      case PIPELINE_STAGES.QUOTE_BUILDING:
      case PIPELINE_STAGES.QUOTE_PRICING:
        this._analyzePricing(ctx, analysis);
        break;
      case PIPELINE_STAGES.ORDER_INVENTORY_CHECK:
        this._analyzeInventory(ctx, analysis);
        break;
      case PIPELINE_STAGES.JOB_SCHEDULED:
        this._analyzeScheduling(ctx, analysis);
        break;
      case PIPELINE_STAGES.SHIP_READY:
        this._analyzeShipping(ctx, analysis);
        break;
      default:
        this._analyzeGeneral(ctx, analysis);
    }
    
    // Calculate overall risk
    analysis.overallRisk = this._calculateOverallRisk(analysis.risks);
    
    // Store in history
    this.decisionHistory.push(analysis);
    
    return analysis;
  }
  
  /**
   * Get pricing recommendation
   */
  getPricingRecommendation(ctx, options = {}) {
    const { targetMargin = 0.25, competitorPrice, customerType, volume } = options;
    
    const recommendation = {
      type: DECISION_TYPES.PRICING,
      confidence: 0.85,
      suggestedMargin: targetMargin,
      reasoning: [],
      alternatives: [],
    };
    
    // Adjust based on customer type
    if (ctx.priority.label === 'VIP') {
      recommendation.suggestedMargin = targetMargin - 0.03;
      recommendation.reasoning.push('VIP customer: 3% margin reduction applied');
    }
    
    // Volume discount
    if (volume && volume > 10000) {
      recommendation.suggestedMargin = recommendation.suggestedMargin - 0.02;
      recommendation.reasoning.push('High volume: 2% volume discount applied');
    } else if (volume && volume > 5000) {
      recommendation.suggestedMargin = recommendation.suggestedMargin - 0.01;
      recommendation.reasoning.push('Medium volume: 1% volume discount applied');
    }
    
    // Competitor pricing
    if (competitorPrice) {
      recommendation.alternatives.push({
        strategy: 'MATCH_COMPETITOR',
        price: competitorPrice,
        margin: 'Variable',
      });
    }
    
    // Market-based alternatives
    recommendation.alternatives.push(
      { strategy: 'PREMIUM', marginAdjust: +0.05, description: 'Premium service + quality' },
      { strategy: 'STANDARD', marginAdjust: 0, description: 'Standard pricing' },
      { strategy: 'COMPETITIVE', marginAdjust: -0.03, description: 'Competitive pricing' },
      { strategy: 'VOLUME_LOCK', marginAdjust: -0.05, description: 'Volume commitment discount' }
    );
    
    return recommendation;
  }
  
  /**
   * Get inventory recommendation
   */
  getInventoryRecommendation(ctx, shortages = []) {
    const recommendation = {
      type: DECISION_TYPES.INVENTORY,
      confidence: 0.9,
      actions: [],
      alternatives: [],
    };
    
    for (const shortage of shortages) {
      const actions = [];
      
      // Check other locations
      actions.push({
        type: 'CHECK_ALTERNATE_LOCATION',
        description: 'Check other branch locations for stock',
        priority: 1,
      });
      
      // Substitution
      if (ctx.substitutions?.find(s => s.lineId === shortage.lineId)) {
        actions.push({
          type: 'APPLY_SUBSTITUTION',
          description: 'Use alternate material/grade',
          priority: 2,
        });
      }
      
      // Supplier RFQ
      actions.push({
        type: 'SUPPLIER_RFQ',
        description: 'Request quote from supplier for rush delivery',
        priority: 3,
      });
      
      // Branch transfer
      actions.push({
        type: 'BRANCH_TRANSFER',
        description: 'Initiate transfer from another branch',
        priority: 4,
      });
      
      // Split shipment
      actions.push({
        type: 'SPLIT_SHIPMENT',
        description: 'Ship available now, backorder remainder',
        priority: 5,
      });
      
      recommendation.actions.push({
        lineId: shortage.lineId,
        shortage: shortage.shortage,
        suggestedActions: actions,
      });
    }
    
    return recommendation;
  }
  
  /**
   * Get scheduling recommendation
   */
  getSchedulingRecommendation(ctx, jobs = []) {
    const recommendation = {
      type: DECISION_TYPES.SCHEDULING,
      confidence: 0.88,
      strategy: 'FIFO',
      suggestedSequence: [],
      capacityWarnings: [],
      conflicts: [],
    };
    
    // Sort jobs by priority and due date
    const sortedJobs = [...jobs].sort((a, b) => {
      // Priority first
      const priorityDiff = (ctx.priority?.level || 4) - 4;
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by due date
      const dueA = new Date(a.dueDate || Date.now());
      const dueB = new Date(b.dueDate || Date.now());
      return dueA - dueB;
    });
    
    recommendation.suggestedSequence = sortedJobs.map((job, idx) => ({
      jobId: job.id,
      sequence: idx + 1,
      priority: ctx.priority?.label || 'STANDARD',
    }));
    
    // Check for capacity issues
    if (jobs.length > 10) {
      recommendation.capacityWarnings.push({
        type: 'HIGH_VOLUME',
        message: 'High job volume may impact lead times',
        suggestion: 'Consider overtime or outsourcing',
      });
    }
    
    // Check for HOT/RUSH jobs
    if (ctx.priority?.level <= 2) {
      recommendation.strategy = 'PRIORITY_FIRST';
      recommendation.capacityWarnings.push({
        type: 'PRIORITY_OVERRIDE',
        message: 'Priority job - may need to reschedule other work',
        suggestion: 'Review queue for conflicts',
      });
    }
    
    return recommendation;
  }
  
  /**
   * Get carrier recommendation
   */
  getCarrierRecommendation(ctx, options = {}) {
    const { weight, destination, urgency, fragile } = options;
    
    const recommendation = {
      type: DECISION_TYPES.CARRIER,
      confidence: 0.92,
      suggestedCarrier: null,
      alternatives: [],
      reasoning: [],
    };
    
    // Logic for carrier selection
    if (urgency === 'HOT' || ctx.priority?.level === 1) {
      recommendation.suggestedCarrier = 'EXPRESS_FREIGHT';
      recommendation.reasoning.push('Priority shipment requires expedited carrier');
    } else if (weight > 1000) {
      recommendation.suggestedCarrier = 'FLATBED_TRUCK';
      recommendation.reasoning.push('Heavy shipment requires flatbed');
    } else if (weight < 100) {
      recommendation.suggestedCarrier = 'GROUND_SMALL_PACKAGE';
      recommendation.reasoning.push('Light shipment suitable for small package');
    } else {
      recommendation.suggestedCarrier = 'LTL_FREIGHT';
      recommendation.reasoning.push('Standard LTL for medium shipments');
    }
    
    if (fragile) {
      recommendation.reasoning.push('Fragile goods - select carrier with good handling record');
    }
    
    recommendation.alternatives = [
      { carrier: 'UPS_FREIGHT', costIndex: 1.0, transitDays: 5 },
      { carrier: 'FEDEX_LTL', costIndex: 1.15, transitDays: 4 },
      { carrier: 'LOCAL_TRUCK', costIndex: 0.8, transitDays: 1 },
      { carrier: 'FLATBED', costIndex: 0.9, transitDays: 4 },
    ];
    
    return recommendation;
  }
  
  /**
   * Assess overall risk for pipeline
   */
  assessRisk(ctx) {
    const risks = [];
    
    // Margin risk
    if (ctx.metrics?.marginPercent < this.riskThresholds.marginCritical * 100) {
      risks.push({
        type: 'MARGIN',
        level: RISK_LEVELS.CRITICAL,
        message: `Margin ${ctx.metrics.marginPercent}% below critical threshold`,
        mitigation: 'Review pricing or negotiate surcharges',
      });
    } else if (ctx.metrics?.marginPercent < this.riskThresholds.marginWarning * 100) {
      risks.push({
        type: 'MARGIN',
        level: RISK_LEVELS.MEDIUM,
        message: `Margin ${ctx.metrics.marginPercent}% below target`,
        mitigation: 'Consider pricing adjustments',
      });
    }
    
    // Lead time risk
    if (ctx.metrics?.estimatedLeadTime > this.riskThresholds.leadTimeCritical) {
      risks.push({
        type: 'LEAD_TIME',
        level: RISK_LEVELS.HIGH,
        message: `Lead time ${ctx.metrics.estimatedLeadTime} days exceeds threshold`,
        mitigation: 'Expedite production or negotiate delivery',
      });
    }
    
    // Stock risk
    if (ctx.stockWarnings?.length > 0) {
      risks.push({
        type: 'INVENTORY',
        level: RISK_LEVELS.MEDIUM,
        message: `Stock shortage on ${ctx.stockWarnings.length} items`,
        mitigation: 'Apply substitutions or order from supplier',
      });
    }
    
    // Error risk
    if (ctx.errors?.length > 0) {
      risks.push({
        type: 'PROCESS',
        level: RISK_LEVELS.HIGH,
        message: `${ctx.errors.length} errors in pipeline`,
        mitigation: 'Review and resolve errors before proceeding',
      });
    }
    
    return risks;
  }
  
  // ============================================================================
  // PRIVATE ANALYSIS METHODS
  // ============================================================================
  
  _analyzeRfq(ctx, analysis) {
    if (!ctx.rfq) return;
    
    // Check for missing data
    if (!ctx.rfq.lines || ctx.rfq.lines.length === 0) {
      analysis.blockers.push({
        type: 'MISSING_DATA',
        message: 'RFQ has no line items',
        resolution: 'Parse email or manual entry required',
      });
    }
    
    // Check for urgent request
    if (ctx.rfq.requestedDueDate) {
      const dueDate = new Date(ctx.rfq.requestedDueDate);
      const daysUntilDue = (dueDate - new Date()) / (24 * 60 * 60 * 1000);
      
      if (daysUntilDue < 3) {
        analysis.risks.push({
          type: 'TIGHT_DEADLINE',
          level: RISK_LEVELS.HIGH,
          message: 'Customer requested delivery in less than 3 days',
        });
        
        analysis.recommendations.push({
          type: 'PRIORITY_UPGRADE',
          message: 'Consider upgrading to RUSH or HOT priority',
          confidence: 0.9,
        });
      }
    }
  }
  
  _analyzePricing(ctx, analysis) {
    if (!ctx.quote) return;
    
    const margin = ctx.metrics?.marginPercent || 25;
    
    if (margin < 15) {
      analysis.risks.push({
        type: 'LOW_MARGIN',
        level: RISK_LEVELS.MEDIUM,
        message: `Quote margin ${margin}% is below target`,
      });
      
      analysis.alternatives.push({
        action: 'ADD_SURCHARGES',
        description: 'Add processing or handling surcharges',
      });
    }
    
    // Large order opportunity
    if (ctx.quote.totalPrice > 10000) {
      analysis.recommendations.push({
        type: 'LARGE_ORDER',
        message: 'Large order - consider volume discount to secure',
        confidence: 0.85,
      });
    }
  }
  
  _analyzeInventory(ctx, analysis) {
    if (ctx.stockWarnings?.length > 0) {
      analysis.risks.push({
        type: 'STOCK_SHORTAGE',
        level: RISK_LEVELS.MEDIUM,
        message: `${ctx.stockWarnings.length} items with insufficient stock`,
      });
      
      if (ctx.substitutions?.length > 0) {
        analysis.alternatives.push({
          action: 'USE_SUBSTITUTIONS',
          description: `${ctx.substitutions.length} substitutions available`,
        });
      }
      
      analysis.alternatives.push({
        action: 'SUPPLIER_RUSH',
        description: 'Request rush delivery from supplier',
      });
    }
  }
  
  _analyzeScheduling(ctx, analysis) {
    if (ctx.jobs?.length > 5) {
      analysis.recommendations.push({
        type: 'BATCH_PROCESSING',
        message: 'Consider batching similar operations for efficiency',
        confidence: 0.8,
      });
    }
    
    // Check work center utilization
    if (ctx.workCenterAssignments?.length > 10) {
      analysis.risks.push({
        type: 'CAPACITY',
        level: RISK_LEVELS.MEDIUM,
        message: 'High work center utilization',
      });
    }
  }
  
  _analyzeShipping(ctx, analysis) {
    if (ctx.shipment?.estimatedCost > 500) {
      analysis.recommendations.push({
        type: 'FREIGHT_OPTIMIZATION',
        message: 'High freight cost - consider consolidation',
        confidence: 0.75,
      });
    }
    
    // Customer pickup option
    analysis.alternatives.push({
      action: 'CUSTOMER_PICKUP',
      description: 'Offer customer pickup to save freight',
    });
  }
  
  _analyzeGeneral(ctx, analysis) {
    // General pipeline health checks
    if (ctx.stageHistory?.length > 20) {
      analysis.risks.push({
        type: 'LONG_RUNNING',
        level: RISK_LEVELS.LOW,
        message: 'Pipeline has many stage transitions - review for efficiency',
      });
    }
    
    if (ctx.warnings?.length > 5) {
      analysis.risks.push({
        type: 'MULTIPLE_WARNINGS',
        level: RISK_LEVELS.MEDIUM,
        message: `${ctx.warnings.length} warnings accumulated`,
      });
    }
  }
  
  _calculateOverallRisk(risks) {
    if (risks.length === 0) return RISK_LEVELS.LOW;
    
    const maxLevel = Math.max(...risks.map(r => r.level?.level || 1));
    
    if (maxLevel >= 4) return RISK_LEVELS.CRITICAL;
    if (maxLevel >= 3) return RISK_LEVELS.HIGH;
    if (maxLevel >= 2) return RISK_LEVELS.MEDIUM;
    return RISK_LEVELS.LOW;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const aiDecisionEngine = new AIDecisionEngine();

export default aiDecisionEngine;
