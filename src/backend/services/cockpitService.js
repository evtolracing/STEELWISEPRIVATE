/**
 * Executive Cockpit Service
 * Aggregates data from all operational systems for executive dashboard
 */

const prisma = require('../db/prisma');

/**
 * Get aggregated cockpit data for executive dashboard
 * @returns {Object} Complete cockpit state with all 7 tiles
 */
async function getCockpitData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Aggregate data from multiple sources
  const [
    ordersToday,
    capacityData,
    inventoryData,
    safetyData,
    marginData,
    pendingApprovals,
  ] = await Promise.all([
    getServiceCommitments(today, tomorrow),
    getCapacityUtilization(),
    getInventoryExposure(),
    getSafetyQualityStatus(),
    getMarginCashImpact(),
    getPendingApprovals(),
  ]);

  // Calculate overall risk score
  const riskFactors = [
    { weight: 0.25, score: calculateCapacityRisk(capacityData) },
    { weight: 0.20, score: calculateServiceRisk(ordersToday) },
    { weight: 0.20, score: calculateInventoryRisk(inventoryData) },
    { weight: 0.15, score: calculateSafetyRisk(safetyData) },
    { weight: 0.10, score: calculateMarginRisk(marginData) },
    { weight: 0.10, score: calculateApprovalRisk(pendingApprovals) },
  ];

  const overallRiskScore = Math.round(
    riskFactors.reduce((sum, f) => sum + (f.weight * f.score), 0)
  );

  const riskLevel = overallRiskScore >= 75 ? 'HIGH' :
                    overallRiskScore >= 50 ? 'MEDIUM' : 'LOW';

  // Get top risks
  const topRisks = await getTopRisks();

  // Get suggested actions
  const suggestedActions = await getSuggestedActions();

  return {
    timestamp: new Date().toISOString(),
    overallRisk: {
      score: overallRiskScore,
      level: riskLevel,
      trend: await getRiskTrend(),
    },
    tiles: {
      risk: {
        score: overallRiskScore,
        level: riskLevel,
        topRisks,
      },
      service: ordersToday,
      capacity: capacityData,
      inventory: inventoryData,
      safetyQuality: safetyData,
      margin: marginData,
      approvals: pendingApprovals,
    },
    suggestedActions,
  };
}

/**
 * Get service commitments for today
 */
async function getServiceCommitments(today, tomorrow) {
  // Mock implementation - replace with actual database queries
  const ordersToday = await prisma.job?.findMany({
    where: {
      requestedDate: {
        gte: today,
        lt: tomorrow,
      },
      status: {
        in: ['SCHEDULED', 'IN_PROGRESS', 'READY_TO_SHIP'],
      },
    },
  }) || [];

  const total = ordersToday.length || 47;
  const onTrack = Math.floor(total * 0.96);
  const atRisk = Math.floor(total * 0.04);

  return {
    ordersShippingToday: total,
    onTrackPct: 96,
    atRiskCount: atRisk,
    lateCount: 0,
    valueAtRisk: 45000,
    trend: 2,
  };
}

/**
 * Get capacity utilization across all locations
 */
async function getCapacityUtilization() {
  // Mock implementation - integrate with scheduling engine
  const locations = [
    { code: 'DET', name: 'Detroit', capacity: 480, utilized: 466, status: 'CRITICAL' },
    { code: 'CLE', name: 'Cleveland', capacity: 400, utilized: 232, status: 'LOW' },
    { code: 'CHI', name: 'Chicago', capacity: 560, utilized: 459, status: 'OPTIMAL' },
  ];

  const totalCapacity = locations.reduce((sum, l) => sum + l.capacity, 0);
  const totalUtilized = locations.reduce((sum, l) => sum + l.utilized, 0);
  const overallUtilization = Math.round((totalUtilized / totalCapacity) * 100);

  const constrainedCount = locations.filter(l => l.status === 'CRITICAL').length;
  const idleHours = totalCapacity - totalUtilized;

  return {
    overallUtilization,
    constrainedCount,
    idleHours,
    overtimeScheduled: 8,
    trend: -3,
    byLocation: locations.map(l => ({
      code: l.code,
      utilization: Math.round((l.utilized / l.capacity) * 100),
      status: l.status,
    })),
  };
}

/**
 * Get inventory exposure metrics
 */
async function getInventoryExposure() {
  // Mock implementation
  return {
    totalValue: 4200000,
    excessValue: 336000,
    excessPct: 8,
    shortageRiskItems: 4,
    daysOfCoverage: 38,
    trend: -2,
  };
}

/**
 * Get safety and quality status
 */
async function getSafetyQualityStatus() {
  // Mock implementation - integrate with safety module
  return {
    stopWorkOrders: 0,
    openIncidents: 0,
    openNCRs: 2,
    customerClaims: 1,
    qualityHolds: 3,
    daysSinceIncident: 142,
  };
}

/**
 * Get margin and cash impact metrics
 */
async function getMarginCashImpact() {
  // Mock implementation - integrate with financial module
  return {
    mtdMarginPct: 22.1,
    vsTarget: 0.3,
    mtdRevenue: 1850000,
    marginAtRisk: 28000,
    arOverdue: 125000,
    trend: 1.2,
  };
}

/**
 * Get pending approvals requiring executive action
 */
async function getPendingApprovals() {
  // Mock implementation
  return {
    pricingOverrides: 2,
    creditExceptions: 1,
    maintenanceDefers: 0,
    qualityWaivers: 1,
    largeOrderApprovals: 1,
    total: 5,
    oldestHours: 4,
  };
}

/**
 * Get top risks sorted by impact
 */
async function getTopRisks() {
  // Mock implementation - should aggregate from all risk sources
  return [
    { category: 'CAPACITY', description: 'Detroit at 97% utilization', impact: 'HIGH' },
    { category: 'INVENTORY', description: '4140 stock below reorder point', impact: 'MEDIUM' },
    { category: 'QUALITY', description: 'NCR blocking 3 shipments', impact: 'MEDIUM' },
  ];
}

/**
 * Get AI-suggested actions based on current state
 */
async function getSuggestedActions() {
  return [
    { priority: 1, action: 'Transfer 2 jobs to Cleveland', impact: 'Reduce Detroit to 82%', category: 'CAPACITY' },
    { priority: 2, action: 'Expedite PO-2026-1234', impact: 'Restore 4140 coverage to 7 days', category: 'INVENTORY' },
    { priority: 3, action: 'Review NCR-2026-089 by 2pm', impact: 'Unblock 3 pending shipments', category: 'QUALITY' },
  ];
}

/**
 * Get risk trend vs yesterday
 */
async function getRiskTrend() {
  return 7; // Points increase from yesterday
}

// Risk calculation helpers
function calculateCapacityRisk(data) {
  if (data.overallUtilization >= 95) return 100;
  if (data.overallUtilization >= 90) return 80;
  if (data.overallUtilization >= 85) return 60;
  if (data.overallUtilization >= 75) return 40;
  return 20;
}

function calculateServiceRisk(data) {
  if (data.onTrackPct < 90) return 100;
  if (data.onTrackPct < 95) return 60;
  return 20;
}

function calculateInventoryRisk(data) {
  if (data.shortageRiskItems > 10) return 100;
  if (data.shortageRiskItems > 5) return 70;
  if (data.shortageRiskItems > 0) return 40;
  return 10;
}

function calculateSafetyRisk(data) {
  if (data.stopWorkOrders > 0) return 100;
  if (data.openIncidents > 0) return 80;
  if (data.openNCRs > 5) return 60;
  return 10;
}

function calculateMarginRisk(data) {
  if (data.vsTarget < -3) return 100;
  if (data.vsTarget < -1) return 60;
  if (data.vsTarget < 0) return 40;
  return 10;
}

function calculateApprovalRisk(data) {
  if (data.oldestHours > 48) return 100;
  if (data.oldestHours > 24) return 60;
  if (data.total > 10) return 50;
  return 20;
}

module.exports = {
  getCockpitData,
  getServiceCommitments,
  getCapacityUtilization,
  getInventoryExposure,
  getSafetyQualityStatus,
  getMarginCashImpact,
  getPendingApprovals,
  getTopRisks,
  getSuggestedActions,
};
