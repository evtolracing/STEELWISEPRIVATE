/**
 * Decision Service
 * Manages executive decision logging, tracking, and outcome analysis
 */

import prisma from '../lib/db.js';

/**
 * Log a new executive decision
 */
export async function logDecision(decisionData) {
  const decision = {
    id: `DEC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    timestamp: new Date().toISOString(),
    type: decisionData.type,
    title: decisionData.title,
    description: decisionData.description,
    decisionMaker: decisionData.decisionMaker,
    role: decisionData.role,
    status: 'PENDING',
    scenarioId: decisionData.scenarioId || null,
    predictedOutcome: decisionData.predictedOutcome,
    actualOutcome: null,
    variance: null,
    conditions: decisionData.conditions || [],
    aiRecommendation: decisionData.aiRecommendation,
    aiConfidence: decisionData.aiConfidence,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };

  // In production, save to database
  // await prisma.executiveDecision.create({ data: decision });

  return decision;
}

/**
 * Get decision by ID
 */
export async function getDecision(decisionId) {
  // In production, query database
  // return await prisma.executiveDecision.findUnique({ where: { id: decisionId } });
  
  // Mock return
  return getMockDecisions().find(d => d.id === decisionId);
}

/**
 * Get all decisions with filters
 */
export async function getDecisions(filters = {}) {
  let decisions = getMockDecisions();

  // Apply filters
  if (filters.type && filters.type !== 'ALL') {
    decisions = decisions.filter(d => d.type === filters.type);
  }

  if (filters.status) {
    decisions = decisions.filter(d => d.status === filters.status);
  }

  if (filters.decisionMaker) {
    decisions = decisions.filter(d => 
      d.decisionMaker.toLowerCase().includes(filters.decisionMaker.toLowerCase())
    );
  }

  if (filters.fromDate) {
    const fromDate = new Date(filters.fromDate);
    decisions = decisions.filter(d => new Date(d.timestamp) >= fromDate);
  }

  if (filters.toDate) {
    const toDate = new Date(filters.toDate);
    decisions = decisions.filter(d => new Date(d.timestamp) <= toDate);
  }

  // Sort by timestamp descending
  decisions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Apply pagination
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  return {
    data: decisions.slice(offset, offset + limit),
    pagination: {
      page,
      limit,
      total: decisions.length,
      totalPages: Math.ceil(decisions.length / limit),
    },
  };
}

/**
 * Update decision status
 */
export async function updateDecisionStatus(decisionId, status) {
  // In production, update database
  return {
    id: decisionId,
    status,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Record actual outcome for a decision
 */
export async function recordOutcome(decisionId, actualOutcome) {
  const decision = await getDecision(decisionId);
  
  if (!decision) {
    throw new Error(`Decision ${decisionId} not found`);
  }

  // Calculate variance
  const variance = calculateVariance(decision.predictedOutcome, actualOutcome);

  // In production, update database
  return {
    id: decisionId,
    status: 'EXECUTED',
    actualOutcome,
    variance,
    outcomeRecordedAt: new Date().toISOString(),
  };
}

/**
 * Calculate variance between predicted and actual outcomes
 */
function calculateVariance(predicted, actual) {
  const variances = {};
  let overallScore = 0;
  let metricCount = 0;

  for (const key of Object.keys(predicted)) {
    if (actual[key] !== undefined) {
      const predVal = parseNumericValue(predicted[key]);
      const actVal = parseNumericValue(actual[key]);
      
      if (predVal !== null && actVal !== null) {
        const pctDiff = ((actVal - predVal) / Math.abs(predVal)) * 100;
        variances[key] = `${pctDiff >= 0 ? '+' : ''}${pctDiff.toFixed(0)}%`;
        
        // Higher actual is better for margin/revenue, worse for risk/cost
        if (key.includes('margin') || key.includes('revenue')) {
          overallScore += pctDiff > 0 ? 1 : pctDiff < 0 ? -1 : 0;
        } else if (key.includes('risk') || key.includes('cost')) {
          overallScore += pctDiff < 0 ? 1 : pctDiff > 0 ? -1 : 0;
        }
        metricCount++;
      }
    }
  }

  const avgScore = metricCount > 0 ? overallScore / metricCount : 0;
  let overall = 'AS_EXPECTED';
  if (avgScore > 0.3) overall = 'BETTER_THAN_EXPECTED';
  if (avgScore < -0.3) overall = 'WORSE_THAN_EXPECTED';

  return {
    ...variances,
    overall,
  };
}

function parseNumericValue(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  
  // Extract numeric value from strings like "$18,500", "+7%", "96%"
  const match = value.match(/[-+]?[\d,]+\.?\d*/);
  if (match) {
    return parseFloat(match[0].replace(/,/g, ''));
  }
  return null;
}

/**
 * Get decision statistics
 */
export async function getDecisionStats(dateRange = 30) {
  const decisions = getMockDecisions();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - dateRange);

  const recentDecisions = decisions.filter(d => new Date(d.timestamp) >= cutoffDate);

  const executed = recentDecisions.filter(d => d.status === 'EXECUTED');
  const betterThanExpected = executed.filter(d => 
    d.variance?.overall === 'BETTER_THAN_EXPECTED'
  );
  const asExpected = executed.filter(d => 
    d.variance?.overall === 'AS_EXPECTED'
  );

  const avgConfidence = recentDecisions.reduce((sum, d) => sum + d.aiConfidence, 0) / 
    (recentDecisions.length || 1);

  return {
    total: recentDecisions.length,
    executed: executed.length,
    pending: recentDecisions.filter(d => d.status === 'PENDING_OUTCOME').length,
    closed: recentDecisions.filter(d => d.status === 'CLOSED').length,
    betterThanExpected: betterThanExpected.length,
    asExpected: asExpected.length,
    worseThanExpected: executed.length - betterThanExpected.length - asExpected.length,
    successRate: executed.length > 0 
      ? Math.round(((betterThanExpected.length + asExpected.length) / executed.length) * 100)
      : 0,
    avgAiConfidence: Math.round(avgConfidence),
    byType: getDecisionsByType(recentDecisions),
  };
}

function getDecisionsByType(decisions) {
  const types = {};
  for (const d of decisions) {
    types[d.type] = (types[d.type] || 0) + 1;
  }
  return types;
}

/**
 * Compare decisions to find patterns
 */
export async function compareDecisions(decisionIds) {
  const decisions = [];
  for (const id of decisionIds) {
    const decision = await getDecision(id);
    if (decision) {
      decisions.push(decision);
    }
  }

  return {
    decisions,
    patterns: analyzePatterns(decisions),
  };
}

function analyzePatterns(decisions) {
  // Analyze patterns in decisions
  const patterns = [];

  // Check for common conditions
  const allConditions = decisions.flatMap(d => d.conditions);
  const conditionCounts = {};
  for (const c of allConditions) {
    conditionCounts[c] = (conditionCounts[c] || 0) + 1;
  }
  
  for (const [condition, count] of Object.entries(conditionCounts)) {
    if (count >= 2) {
      patterns.push({
        type: 'COMMON_CONDITION',
        description: `"${condition}" appears in ${count} decisions`,
      });
    }
  }

  return patterns;
}

/**
 * Generate decision report for board
 */
export async function generateBoardReport(dateRange = 30) {
  const stats = await getDecisionStats(dateRange);
  const decisions = (await getDecisions({ limit: 10 })).data;

  return {
    period: `Last ${dateRange} days`,
    generatedAt: new Date().toISOString(),
    summary: stats,
    recentDecisions: decisions.map(d => ({
      id: d.id,
      title: d.title,
      type: d.type,
      date: d.timestamp,
      decisionMaker: d.decisionMaker,
      outcome: d.variance?.overall || 'PENDING',
    })),
    insights: generateInsights(stats),
  };
}

function generateInsights(stats) {
  const insights = [];

  if (stats.successRate >= 90) {
    insights.push({
      type: 'POSITIVE',
      message: `${stats.successRate}% of decisions met or exceeded expectations`,
    });
  } else if (stats.successRate < 70) {
    insights.push({
      type: 'ATTENTION',
      message: `Only ${stats.successRate}% of decisions met expectations - review decision criteria`,
    });
  }

  if (stats.avgAiConfidence < 70) {
    insights.push({
      type: 'INFO',
      message: `Average AI confidence (${stats.avgAiConfidence}%) is below threshold - scenarios may need more data`,
    });
  }

  return insights;
}

/**
 * Mock decisions data
 */
function getMockDecisions() {
  return [
    {
      id: 'DEC-2026-0047',
      timestamp: '2026-02-04T11:30:00Z',
      type: 'RFQ_ACCEPT',
      title: 'Accepted RFQ-2026-089 with Conditions',
      description: 'Accepted 15,000 lbs 4140 Round Bar order from Acme Manufacturing',
      decisionMaker: 'Sarah Chen',
      role: 'VP Sales',
      status: 'EXECUTED',
      scenarioId: 'SCENARIO-001',
      predictedOutcome: {
        margin: '+$18,500',
        capacity: '+7% utilization',
        delivery: '95% on-time probability',
      },
      actualOutcome: {
        margin: '+$17,200',
        capacity: '+6.5% utilization',
        delivery: '100% on-time (delivered Feb 6)',
      },
      variance: {
        margin: '-7%',
        overall: 'BETTER_THAN_EXPECTED',
      },
      conditions: [
        'Cleveland capacity confirmed',
        'Extended ship date by 2 days (approved by customer)',
        'Expedited 4140 raw material (arrived Feb 5)',
      ],
      aiRecommendation: 'ACCEPT_WITH_CONDITIONS',
      aiConfidence: 78,
    },
    {
      id: 'DEC-2026-0046',
      timestamp: '2026-02-03T16:45:00Z',
      type: 'CAPACITY_TRANSFER',
      title: 'Transferred 3 Jobs from Detroit to Cleveland',
      description: 'Moved SAW cutting jobs to reduce Detroit utilization from 97% to 82%',
      decisionMaker: 'Mike Rodriguez',
      role: 'COO',
      status: 'EXECUTED',
      scenarioId: 'SCENARIO-002',
      predictedOutcome: {
        capacity: '-15% Detroit, +15% Cleveland',
        delivery: 'Maintain 96% on-time',
        cost: '+$1,200 freight adjustment',
      },
      actualOutcome: {
        capacity: '-14% Detroit, +14% Cleveland',
        delivery: '97% on-time maintained',
        cost: '+$980 freight',
      },
      variance: {
        cost: '+18% better than expected',
        overall: 'AS_EXPECTED',
      },
      conditions: [],
      aiRecommendation: 'ACCEPT',
      aiConfidence: 92,
    },
    {
      id: 'DEC-2026-0044',
      timestamp: '2026-02-01T14:30:00Z',
      type: 'MAINTENANCE_DEFER',
      title: 'Deferred LAT-03 Maintenance by 1 Week',
      description: 'Postponed scheduled lathe maintenance to complete priority orders',
      decisionMaker: 'Mike Rodriguez',
      role: 'COO',
      status: 'PENDING_OUTCOME',
      scenarioId: 'SCENARIO-003',
      predictedOutcome: {
        capacity: '+40 hours available',
        risk: '15% increased breakdown probability',
        delivery: 'Complete 4 priority orders on time',
      },
      actualOutcome: null,
      variance: null,
      conditions: [
        'Reschedule maintenance by Feb 8',
        'Daily equipment inspection required',
      ],
      aiRecommendation: 'CAUTION',
      aiConfidence: 58,
    },
  ];
}

export default {
  logDecision,
  getDecision,
  getDecisions,
  updateDecisionStatus,
  recordOutcome,
  getDecisionStats,
  compareDecisions,
  generateBoardReport,
};
