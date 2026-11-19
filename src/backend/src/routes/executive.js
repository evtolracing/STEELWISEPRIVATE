/**
 * Executive Ops Cockpit & Digital Twin API Routes
 * Provides endpoints for executive dashboard, simulations, forecasts, and decisions
 */

import express from 'express';
const router = express.Router();

// Import services
import * as cockpitService from '../services/cockpitService.js';
import * as simulationService from '../services/simulationService.js';
import * as forecastService from '../services/forecastService.js';
import * as decisionService from '../services/decisionService.js';

/**
 * The cockpit, the simulations and the forecasts are a design sample: their figures are worked out from
 * fixed example values, not from this company's records. Every answer says so, in the body and in a
 * header, so no screen or script can take them for real figures (Phase 12, AA-002). The decision log
 * below is real records and is not marked.
 */
export const SAMPLE_NOTICE = 'Sample data. These figures are examples from the design of this screen, not your company\'s records.';
router.use(['/cockpit', '/simulation', '/forecast'], (req, res, next) => {
  res.set('X-Sample-Data', 'true');
  const send = res.json.bind(res);
  res.json = (body) => send(body && typeof body === 'object' && !Array.isArray(body) && !body.error ? { sample: true, sampleNotice: SAMPLE_NOTICE, ...body } : body);
  next();
});

// =====================
// COCKPIT ENDPOINTS
// =====================

/**
 * GET /api/executive/cockpit
 * Get complete cockpit data with all 7 tiles
 */
router.get('/cockpit', async (req, res) => {
  try {
    const cockpitData = await cockpitService.getCockpitData();
    res.json(cockpitData);
  } catch (error) {
    console.error('Error fetching cockpit data:', error);
    res.status(500).json({ error: 'Failed to fetch cockpit data', message: error.message });
  }
});

/**
 * GET /api/executive/cockpit/tile/:tileId
 * Get specific tile data with drill-down details
 */
router.get('/cockpit/tile/:tileId', async (req, res) => {
  try {
    const { tileId } = req.params;
    
    let tileData;
    switch (tileId) {
      case 'risk':
        tileData = {
          ...(await cockpitService.getTopRisks()),
          suggestedActions: await cockpitService.getSuggestedActions(),
        };
        break;
      case 'service':
        tileData = await cockpitService.getServiceCommitments(new Date(), new Date());
        break;
      case 'capacity':
        tileData = await cockpitService.getCapacityUtilization();
        break;
      case 'inventory':
        tileData = await cockpitService.getInventoryExposure();
        break;
      case 'safetyQuality':
        tileData = await cockpitService.getSafetyQualityStatus();
        break;
      case 'margin':
        tileData = await cockpitService.getMarginCashImpact();
        break;
      case 'approvals':
        tileData = await cockpitService.getPendingApprovals();
        break;
      default:
        return res.status(404).json({ error: `Unknown tile: ${tileId}` });
    }
    
    res.json(tileData);
  } catch (error) {
    console.error('Error fetching tile data:', error);
    res.status(500).json({ error: 'Failed to fetch tile data', message: error.message });
  }
});

// =====================
// SIMULATION ENDPOINTS
// =====================

/**
 * GET /api/executive/simulation/scenarios
 * Get all simulation scenarios for current user
 */
router.get('/simulation/scenarios', async (req, res) => {
  try {
    const userId = req.user?.id || 'anonymous';
    const scenarios = await simulationService.getScenarios(userId);
    res.json(scenarios);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    res.status(500).json({ error: 'Failed to fetch scenarios', message: error.message });
  }
});

/**
 * POST /api/executive/simulation/scenarios
 * Create a new simulation scenario
 */
router.post('/simulation/scenarios', async (req, res) => {
  try {
    const userId = req.user?.id || 'anonymous';
    if (typeof req.body?.name !== 'string' || !req.body.name.trim()) return res.status(400).json({ error: 'A scenario needs a name' });
    const scenario = await simulationService.createScenario(userId, req.body);
    res.status(201).json(scenario);
  } catch (error) {
    console.error('Error creating scenario:', error);
    res.status(500).json({ error: 'Failed to create scenario', message: error.message });
  }
});

/**
 * POST /api/executive/simulation/run
 * Run simulation for a scenario
 */
router.post('/simulation/run', async (req, res) => {
  try {
    const { scenarioId, changes } = req.body;
    
    if (!scenarioId || !changes) {
      return res.status(400).json({ error: 'scenarioId and changes are required' });
    }
    
    const result = await simulationService.runSimulation(scenarioId, changes);
    res.json(result);
  } catch (error) {
    console.error('Error running simulation:', error);
    res.status(500).json({ error: 'Failed to run simulation', message: error.message });
  }
});

/**
 * GET /api/executive/simulation/baseline
 * Get current baseline metrics
 */
router.get('/simulation/baseline', async (req, res) => {
  try {
    const baseline = await simulationService.getBaselineMetrics();
    res.json(baseline);
  } catch (error) {
    console.error('Error fetching baseline:', error);
    res.status(500).json({ error: 'Failed to fetch baseline', message: error.message });
  }
});

/**
 * POST /api/executive/simulation/compare
 * Compare multiple scenarios
 */
router.post('/simulation/compare', async (req, res) => {
  try {
    const { scenarioIds } = req.body;
    
    if (!scenarioIds || !Array.isArray(scenarioIds)) {
      return res.status(400).json({ error: 'scenarioIds array is required' });
    }
    
    const comparison = await simulationService.compareScenarios(scenarioIds);
    res.json(comparison);
  } catch (error) {
    console.error('Error comparing scenarios:', error);
    res.status(500).json({ error: 'Failed to compare scenarios', message: error.message });
  }
});

// =====================
// FORECAST ENDPOINTS
// =====================

/**
 * GET /api/executive/forecast
 * Get all forecasts for specified horizon
 */
router.get('/forecast', async (req, res) => {
  try {
    const { horizon = '1M' } = req.query;
    const forecasts = await forecastService.getAllForecasts(horizon);
    res.json(forecasts);
  } catch (error) {
    console.error('Error fetching forecasts:', error);
    res.status(500).json({ error: 'Failed to fetch forecasts', message: error.message });
  }
});

/**
 * GET /api/executive/forecast/assumptions
 * Get forecast assumptions for transparency
 */
router.get('/forecast/assumptions', async (req, res) => {
  try {
    const assumptions = await forecastService.getForecastAssumptions();
    res.json(assumptions);
  } catch (error) {
    console.error('Error fetching assumptions:', error);
    res.status(500).json({ error: 'Failed to fetch assumptions', message: error.message });
  }
});

/**
 * GET /api/executive/forecast/:category
 * Get forecast for specific category
 */
router.get('/forecast/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { horizon = '1M' } = req.query;
    
    const validCategories = ['DEMAND', 'CAPACITY', 'INVENTORY', 'MARGIN', 'CASH'];
    if (!validCategories.includes(category.toUpperCase())) {
      return res.status(400).json({ 
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
      });
    }
    
    const forecast = await forecastService.getForecast(category.toUpperCase(), horizon);
    res.json(forecast);
  } catch (error) {
    console.error('Error fetching forecast:', error);
    res.status(500).json({ error: 'Failed to fetch forecast', message: error.message });
  }
});

/**
 * POST /api/executive/forecast/sensitivity
 * Run sensitivity analysis
 */
router.post('/forecast/sensitivity', async (req, res) => {
  try {
    const { category, variable, rangeMin, rangeMax } = req.body;
    
    if (!category || !variable) {
      return res.status(400).json({ error: 'category and variable are required' });
    }
    
    const analysis = await forecastService.runSensitivityAnalysis(
      category.toUpperCase(),
      variable,
      rangeMin || -10,
      rangeMax || 10
    );
    res.json(analysis);
  } catch (error) {
    console.error('Error running sensitivity analysis:', error);
    res.status(500).json({ error: 'Failed to run sensitivity analysis', message: error.message });
  }
});

/**
 * POST /api/executive/forecast/snapshot
 * Save forecast snapshot for audit trail
 */
router.post('/forecast/snapshot', async (req, res) => {
  try {
    const userId = req.user?.id || 'anonymous';
    const { category, horizon } = req.body;
    
    const snapshot = await forecastService.saveForecastSnapshot(userId, category, horizon);
    res.status(201).json(snapshot);
  } catch (error) {
    console.error('Error saving snapshot:', error);
    res.status(500).json({ error: 'Failed to save snapshot', message: error.message });
  }
});

// =====================
// DECISION ENDPOINTS
// =====================

/**
 * GET /api/executive/decisions
 * Get decision log with filters
 */
router.get('/decisions', async (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      status: req.query.status,
      decisionMaker: req.query.decisionMaker,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    };
    
    const decisions = await decisionService.getDecisions(filters);
    res.json(decisions);
  } catch (error) {
    console.error('Error fetching decisions:', error);
    res.status(500).json({ error: 'Failed to fetch decisions', message: error.message });
  }
});

/**
 * GET /api/executive/decisions/stats
 * Get decision statistics
 */
router.get('/decisions/stats', async (req, res) => {
  try {
    const dateRange = parseInt(req.query.dateRange) || 30;
    const stats = await decisionService.getDecisionStats(dateRange);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching decision stats:', error);
    res.status(500).json({ error: 'Failed to fetch decision stats', message: error.message });
  }
});

/**
 * GET /api/executive/decisions/report
 * Generate board report
 */
router.get('/decisions/report', async (req, res) => {
  try {
    const dateRange = parseInt(req.query.dateRange) || 30;
    const report = await decisionService.generateBoardReport(dateRange);
    res.json(report);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report', message: error.message });
  }
});

/**
 * GET /api/executive/decisions/:id
 * Get specific decision by ID
 */
router.get('/decisions/:id', async (req, res) => {
  try {
    const decision = await decisionService.getDecision(req.params.id);
    
    if (!decision) {
      return res.status(404).json({ error: `Decision ${req.params.id} not found` });
    }
    
    res.json(decision);
  } catch (error) {
    console.error('Error fetching decision:', error);
    res.status(500).json({ error: 'Failed to fetch decision', message: error.message });
  }
});

/**
 * POST /api/executive/decisions
 * Log a new executive decision
 */
router.post('/decisions', async (req, res) => {
  try {
    const decisionData = {
      ...req.body,
      // The signed-in person, never a name typed into the request.
      decisionMaker: [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ') || req.user?.email,
      role: req.user?.role,
    };
    
    const decision = await decisionService.logDecision(decisionData);
    res.status(201).json(decision);
  } catch (error) {
    console.error('Error logging decision:', error);
    res.status(500).json({ error: 'Failed to log decision', message: error.message });
  }
});

/**
 * PUT /api/executive/decisions/:id/status
 * Update decision status
 */
router.put('/decisions/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }
    
    const result = await decisionService.updateDecisionStatus(req.params.id, status);
    res.json(result);
  } catch (error) {
    console.error('Error updating decision status:', error);
    res.status(500).json({ error: 'Failed to update decision status', message: error.message });
  }
});

/**
 * POST /api/executive/decisions/:id/outcome
 * Record actual outcome for a decision
 */
router.post('/decisions/:id/outcome', async (req, res) => {
  try {
    const { actualOutcome } = req.body;
    
    if (!actualOutcome) {
      return res.status(400).json({ error: 'actualOutcome is required' });
    }
    
    const result = await decisionService.recordOutcome(req.params.id, actualOutcome);
    res.json(result);
  } catch (error) {
    console.error('Error recording outcome:', error);
    res.status(500).json({ error: 'Failed to record outcome', message: error.message });
  }
});

/**
 * POST /api/executive/decisions/compare
 * Compare multiple decisions
 */
router.post('/decisions/compare', async (req, res) => {
  try {
    const { decisionIds } = req.body;
    
    if (!decisionIds || !Array.isArray(decisionIds)) {
      return res.status(400).json({ error: 'decisionIds array is required' });
    }
    
    const comparison = await decisionService.compareDecisions(decisionIds);
    res.json(comparison);
  } catch (error) {
    console.error('Error comparing decisions:', error);
    res.status(500).json({ error: 'Failed to compare decisions', message: error.message });
  }
});

// =====================
// AI ASSISTANT ENDPOINTS
// =====================

/**
 * POST /api/executive/ai/query
 * Process natural language query for executive AI assistant
 */
router.post('/ai/query', (req, res) => {
  // No analysis engine is built behind this box. It answers that plainly and gives no figures (Phase 12, AA-002).
  res.status(501).json({
    error: 'The executive question box is not built. It gives no analysis and no figures.',
    sample: true,
    useInstead: 'Ask the assistant in the top bar: it answers from your company\'s records and says when it has none.',
  });
});

export default router;
