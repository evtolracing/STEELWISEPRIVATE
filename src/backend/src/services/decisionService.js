/**
 * Decision Service
 * Manages executive decision logging, tracking, and outcome analysis
 */

import prisma from '../lib/db.js';
import { ci } from '../lib/dbText.js';

function requireDb() {
  if (!prisma) throw new Error('Database is not configured');
  return prisma;
}

// Shape returned by the API: `id` is the human decision number (DEC-2026-0047)
// and `timestamp` is when the decision was made.
function toApi(row) {
  if (!row) return null;
  return {
    id: row.decisionNumber,
    timestamp: row.decidedAt.toISOString(),
    type: row.type,
    title: row.title,
    description: row.description,
    decisionMaker: row.decisionMaker,
    role: row.role,
    status: row.status,
    scenarioId: row.scenarioId,
    predictedOutcome: row.predictedOutcome,
    actualOutcome: row.actualOutcome,
    variance: row.variance,
    conditions: Array.isArray(row.conditions) ? row.conditions : [],
    aiRecommendation: row.aiRecommendation,
    aiConfidence: row.aiConfidence,
    outcomeRecordedAt: row.outcomeRecordedAt ? row.outcomeRecordedAt.toISOString() : null,
    metadata: { createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() },
  };
}

async function nextDecisionNumber(db) {
  const year = new Date().getFullYear();
  const prefix = `DEC-${year}-`;
  const last = await db.executiveDecision.findFirst({
    where: { decisionNumber: { startsWith: prefix } },
    orderBy: { decisionNumber: 'desc' },
    select: { decisionNumber: true },
  });
  const next = last ? Number(last.decisionNumber.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
}

async function findRow(db, decisionId) {
  return db.executiveDecision.findFirst({
    where: { OR: [{ decisionNumber: decisionId }, { id: decisionId }] },
  });
}

/**
 * Log a new executive decision
 */
export async function logDecision(decisionData) {
  const db = requireDb();
  const data = {
    type: decisionData.type,
    title: decisionData.title,
    description: decisionData.description,
    decisionMaker: decisionData.decisionMaker,
    role: decisionData.role,
    status: 'PENDING',
    scenarioId: decisionData.scenarioId || null,
    predictedOutcome: decisionData.predictedOutcome ?? undefined,
    conditions: Array.isArray(decisionData.conditions) ? decisionData.conditions : [],
    aiRecommendation: decisionData.aiRecommendation,
    aiConfidence: Number.isFinite(Number(decisionData.aiConfidence)) ? Math.round(Number(decisionData.aiConfidence)) : null,
  };

  // Two requests can pick the same number; retry on the unique clash.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const row = await db.executiveDecision.create({
        data: { ...data, decisionNumber: await nextDecisionNumber(db) },
      });
      return toApi(row);
    } catch (error) {
      if (error.code !== 'P2002' || attempt === 2) throw error;
    }
  }
}

/**
 * Get decision by ID (decision number or internal id)
 */
export async function getDecision(decisionId) {
  return toApi(await findRow(requireDb(), decisionId));
}

/**
 * Get all decisions with filters
 */
export async function getDecisions(filters = {}) {
  const db = requireDb();
  const where = {};
  if (filters.type && filters.type !== 'ALL') where.type = filters.type;
  if (filters.status) where.status = filters.status;
  if (filters.decisionMaker) where.decisionMaker = { contains: filters.decisionMaker, ...ci };
  if (filters.fromDate || filters.toDate) {
    where.decidedAt = {};
    if (filters.fromDate) where.decidedAt.gte = new Date(filters.fromDate);
    if (filters.toDate) where.decidedAt.lte = new Date(filters.toDate);
  }

  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 20));

  const [rows, total] = await Promise.all([
    db.executiveDecision.findMany({
      where,
      orderBy: { decidedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.executiveDecision.count({ where }),
  ]);

  return {
    data: rows.map(toApi),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Update decision status
 */
export async function updateDecisionStatus(decisionId, status) {
  const db = requireDb();
  const row = await findRow(db, decisionId);
  if (!row) throw new Error(`Decision ${decisionId} not found`);
  return toApi(await db.executiveDecision.update({ where: { id: row.id }, data: { status } }));
}

/**
 * Record actual outcome for a decision
 */
export async function recordOutcome(decisionId, actualOutcome) {
  const db = requireDb();
  const row = await findRow(db, decisionId);
  if (!row) throw new Error(`Decision ${decisionId} not found`);

  const variance = calculateVariance(row.predictedOutcome || {}, actualOutcome || {});
  const updated = await db.executiveDecision.update({
    where: { id: row.id },
    data: { status: 'EXECUTED', actualOutcome, variance, outcomeRecordedAt: new Date() },
  });
  return toApi(updated);
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
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - dateRange);

  const recentDecisions = (await requireDb().executiveDecision.findMany({
    where: { decidedAt: { gte: cutoffDate } },
  })).map(toApi);

  const executed = recentDecisions.filter(d => d.status === 'EXECUTED');
  const betterThanExpected = executed.filter(d => 
    d.variance?.overall === 'BETTER_THAN_EXPECTED'
  );
  const asExpected = executed.filter(d => 
    d.variance?.overall === 'AS_EXPECTED'
  );

  const avgConfidence = recentDecisions.reduce((sum, d) => sum + (d.aiConfidence || 0), 0) / 
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
  const allConditions = decisions.flatMap(d => d.conditions || []);
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
