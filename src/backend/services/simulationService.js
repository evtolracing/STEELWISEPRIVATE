/**
 * Simulation Engine Service
 * Models what-if scenarios and calculates impact on operations
 */

const prisma = require('../db/prisma');

/**
 * Create a new simulation scenario
 */
async function createScenario(userId, scenarioData) {
  const scenario = {
    id: `SCENARIO-${Date.now()}`,
    name: scenarioData.name,
    description: scenarioData.description || '',
    createdBy: userId,
    createdAt: new Date().toISOString(),
    status: 'DRAFT',
    changes: scenarioData.changes || [],
    baseline: null,
    results: null,
  };

  // In production, save to database
  // await prisma.simulationScenario.create({ data: scenario });

  return scenario;
}

/**
 * Run simulation for a scenario
 * @param {string} scenarioId - Scenario to simulate
 * @param {Array} changes - Array of change objects
 * @returns {Object} Simulation results with baseline vs simulated values
 */
async function runSimulation(scenarioId, changes) {
  // Get current baseline from operational systems
  const baseline = await getBaselineMetrics();

  // Apply each change and calculate cumulative impact
  const impacts = calculateImpacts(changes, baseline);

  // Generate simulated state
  const simulated = applyImpacts(baseline, impacts);

  // Generate recommendation
  const recommendation = generateRecommendation(baseline, simulated, impacts);

  // Document assumptions
  const assumptions = extractAssumptions(changes);

  return {
    scenarioId,
    timestamp: new Date().toISOString(),
    baseline,
    simulated,
    impacts: formatImpacts(baseline, simulated),
    recommendation,
    assumptions,
  };
}

/**
 * Get current baseline metrics from operational systems
 */
async function getBaselineMetrics() {
  // In production, aggregate from real-time systems
  return {
    onTimeDelivery: 96,
    grossMargin: 22.1,
    backlogDays: 12.5,
    utilization: 78,
    riskScore: 62,
    cashPosition: 1250000,
    revenueAtRisk: 45000,
    capacityHoursAvailable: 156,
  };
}

/**
 * Calculate impacts of proposed changes
 */
function calculateImpacts(changes, baseline) {
  const impacts = {
    onTimeDelivery: 0,
    grossMargin: 0,
    backlogDays: 0,
    utilization: 0,
    riskScore: 0,
    cashPosition: 0,
  };

  for (const change of changes) {
    switch (change.type) {
      case 'DEMAND':
        // Adding demand increases utilization, backlog, margin, and risk
        const demandImpact = parseDemandChange(change);
        impacts.utilization += demandImpact.utilizationDelta;
        impacts.backlogDays += demandImpact.backlogDelta;
        impacts.grossMargin += demandImpact.marginDelta;
        impacts.onTimeDelivery += demandImpact.otdDelta;
        impacts.riskScore += demandImpact.riskDelta;
        impacts.cashPosition += demandImpact.cashDelta;
        break;

      case 'CAPACITY':
        // Capacity changes affect utilization and OTD
        const capacityImpact = parseCapacityChange(change);
        impacts.utilization += capacityImpact.utilizationDelta;
        impacts.onTimeDelivery += capacityImpact.otdDelta;
        impacts.riskScore += capacityImpact.riskDelta;
        break;

      case 'PRICING':
        // Pricing changes affect margin
        const pricingImpact = parsePricingChange(change);
        impacts.grossMargin += pricingImpact.marginDelta;
        impacts.cashPosition += pricingImpact.cashDelta;
        break;

      case 'MAINTENANCE':
        // Maintenance deferral affects capacity and risk
        const maintImpact = parseMaintenanceChange(change);
        impacts.utilization += maintImpact.utilizationDelta;
        impacts.riskScore += maintImpact.riskDelta;
        break;

      case 'LOGISTICS':
        // Logistics changes affect OTD and costs
        const logisticsImpact = parseLogisticsChange(change);
        impacts.onTimeDelivery += logisticsImpact.otdDelta;
        impacts.grossMargin += logisticsImpact.marginDelta;
        break;

      case 'INVENTORY':
        // Inventory changes affect risk and cash
        const inventoryImpact = parseInventoryChange(change);
        impacts.riskScore += inventoryImpact.riskDelta;
        impacts.cashPosition += inventoryImpact.cashDelta;
        break;
    }
  }

  return impacts;
}

/**
 * Apply calculated impacts to baseline
 */
function applyImpacts(baseline, impacts) {
  return {
    onTimeDelivery: Math.max(0, Math.min(100, baseline.onTimeDelivery + impacts.onTimeDelivery)),
    grossMargin: Math.max(0, baseline.grossMargin + impacts.grossMargin),
    backlogDays: Math.max(0, baseline.backlogDays + impacts.backlogDays),
    utilization: Math.max(0, Math.min(100, baseline.utilization + impacts.utilization)),
    riskScore: Math.max(0, Math.min(100, baseline.riskScore + impacts.riskScore)),
    cashPosition: baseline.cashPosition + impacts.cashPosition,
  };
}

/**
 * Format impacts for display
 */
function formatImpacts(baseline, simulated) {
  const metrics = [
    { key: 'grossMargin', label: 'Gross Margin', format: '%' },
    { key: 'onTimeDelivery', label: 'On-Time Delivery', format: '%' },
    { key: 'utilization', label: 'Capacity Utilization', format: '%' },
    { key: 'backlogDays', label: 'Backlog Days', format: '' },
    { key: 'riskScore', label: 'Risk Score', format: '' },
    { key: 'cashPosition', label: 'Cash Position', format: '$' },
  ];

  return metrics.map(m => {
    const baseVal = baseline[m.key];
    const simVal = simulated[m.key];
    const delta = simVal - baseVal;

    let status = 'neutral';
    if (m.key === 'grossMargin' || m.key === 'onTimeDelivery' || m.key === 'cashPosition') {
      status = delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral';
    } else if (m.key === 'riskScore') {
      status = delta < 0 ? 'positive' : delta > 0 ? 'negative' : 'neutral';
    } else if (m.key === 'utilization') {
      status = simVal > 90 ? 'negative' : simVal > 85 ? 'warning' : 'neutral';
    }

    return {
      metric: m.label,
      baseline: formatValue(baseVal, m.format),
      simulated: formatValue(simVal, m.format),
      delta: formatDelta(delta, m.format),
      status,
    };
  });
}

function formatValue(value, format) {
  if (format === '$') return `$${(value / 1000000).toFixed(2)}M`;
  if (format === '%') return `${value.toFixed(1)}%`;
  return value.toFixed(1);
}

function formatDelta(delta, format) {
  const sign = delta >= 0 ? '+' : '';
  if (format === '$') return `${sign}$${Math.abs(delta / 1000).toFixed(0)}K`;
  if (format === '%') return `${sign}${delta.toFixed(1)}%`;
  return `${sign}${delta.toFixed(1)}`;
}

/**
 * Generate AI recommendation based on simulation results
 */
function generateRecommendation(baseline, simulated, impacts) {
  // Determine decision based on trade-offs
  const marginImprovement = simulated.grossMargin - baseline.grossMargin;
  const otdDecline = baseline.onTimeDelivery - simulated.onTimeDelivery;
  const riskIncrease = simulated.riskScore - baseline.riskScore;
  const utilizationCritical = simulated.utilization > 90;

  let decision = 'ACCEPT';
  let confidence = 90;
  const conditions = [];
  const risks = [];

  // Evaluate trade-offs
  if (marginImprovement > 0 && otdDecline > 3) {
    decision = 'ACCEPT_WITH_CONDITIONS';
    confidence -= 15;
    conditions.push('Negotiate extended delivery timeline with customer');
  }

  if (utilizationCritical) {
    decision = 'ACCEPT_WITH_CONDITIONS';
    confidence -= 10;
    conditions.push('Confirm overflow capacity at alternate location');
    risks.push({
      description: 'Capacity may exceed safe threshold',
      probability: 65,
      impact: 'HIGH',
    });
  }

  if (riskIncrease > 15) {
    decision = 'CAUTION';
    confidence -= 20;
    risks.push({
      description: 'Significant increase in operational risk',
      probability: 70,
      impact: 'HIGH',
    });
  }

  if (marginImprovement < -2) {
    decision = 'REJECT';
    confidence = 85;
  }

  const rationale = generateRationale(marginImprovement, otdDecline, riskIncrease, utilizationCritical);

  return {
    decision,
    confidence,
    rationale,
    conditions,
    risks,
  };
}

function generateRationale(marginDelta, otdDelta, riskDelta, criticalUtil) {
  const parts = [];

  if (marginDelta > 0) {
    parts.push(`Order improves margin by ${marginDelta.toFixed(1)}%`);
  } else if (marginDelta < 0) {
    parts.push(`Order reduces margin by ${Math.abs(marginDelta).toFixed(1)}%`);
  }

  if (otdDelta > 0) {
    parts.push(`creates delivery risk (${otdDelta.toFixed(0)}% OTD decline)`);
  }

  if (criticalUtil) {
    parts.push('pushes capacity above recommended threshold');
  }

  if (parts.length === 0) {
    return 'No significant trade-offs identified.';
  }

  return parts.join(', but ') + '.';
}

/**
 * Extract assumptions from changes for documentation
 */
function extractAssumptions(changes) {
  const assumptions = [
    { category: 'Demand', assumption: 'No other RFQs accepted this week', sensitivity: 'HIGH' },
    { category: 'Capacity', assumption: 'Equipment runs at rated speed', sensitivity: 'MEDIUM' },
    { category: 'Logistics', assumption: 'Standard carrier rates apply', sensitivity: 'LOW' },
  ];

  // Add change-specific assumptions
  for (const change of changes) {
    if (change.type === 'DEMAND') {
      assumptions.push({
        category: 'Material',
        assumption: 'Raw material available or arrives on time',
        sensitivity: 'HIGH',
      });
    }
  }

  return assumptions;
}

// Change parsing helpers
function parseDemandChange(change) {
  // Parse demand change and return impact deltas
  return {
    utilizationDelta: 7,
    backlogDelta: 1.7,
    marginDelta: 1.3,
    otdDelta: -3,
    riskDelta: 6,
    cashDelta: 60000,
  };
}

function parseCapacityChange(change) {
  return {
    utilizationDelta: -15,
    otdDelta: 1,
    riskDelta: -5,
  };
}

function parsePricingChange(change) {
  return {
    marginDelta: -3.5,
    cashDelta: 425000,
  };
}

function parseMaintenanceChange(change) {
  return {
    utilizationDelta: 5,
    riskDelta: 10,
  };
}

function parseLogisticsChange(change) {
  return {
    otdDelta: 2,
    marginDelta: -0.5,
  };
}

function parseInventoryChange(change) {
  return {
    riskDelta: -5,
    cashDelta: -50000,
  };
}

/**
 * Get all scenarios for a user
 */
async function getScenarios(userId) {
  // In production, query database
  return [
    {
      id: 'SCENARIO-001',
      name: 'Accept RFQ-2026-089',
      status: 'READY',
      changes: [
        { type: 'DEMAND', description: 'Add 15,000 lbs 4140 Round Bar order', value: '+15000 lbs' },
      ],
      createdAt: '2026-02-04T10:30:00Z',
    },
  ];
}

/**
 * Compare multiple scenarios
 */
async function compareScenarios(scenarioIds) {
  const results = [];
  
  for (const id of scenarioIds) {
    // Get scenario and run simulation
    const scenario = await getScenarios(id);
    if (scenario) {
      const result = await runSimulation(id, scenario.changes || []);
      results.push({ scenarioId: id, ...result });
    }
  }

  return {
    scenarios: results,
    comparison: generateComparison(results),
  };
}

function generateComparison(results) {
  // Generate side-by-side comparison
  return results.map(r => ({
    id: r.scenarioId,
    margin: r.simulated?.grossMargin,
    otd: r.simulated?.onTimeDelivery,
    risk: r.simulated?.riskScore,
    recommendation: r.recommendation?.decision,
  }));
}

module.exports = {
  createScenario,
  runSimulation,
  getScenarios,
  compareScenarios,
  getBaselineMetrics,
};
