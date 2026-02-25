/**
 * Forecast Service
 * Generates probabilistic forecasts with confidence intervals
 */

import prisma from '../lib/db.js';

/**
 * Get forecast for a specific category and horizon
 * @param {string} category - DEMAND, CAPACITY, INVENTORY, MARGIN, CASH
 * @param {string} horizon - 1W, 1M, 3M, 12M
 * @returns {Object} Forecast with P10, P50, P90 bands
 */
export async function getForecast(category, horizon = '1M') {
  const horizonConfig = getHorizonConfig(horizon);
  const periods = generatePeriods(horizonConfig);
  
  // Get historical data for model
  const historicalData = await getHistoricalData(category, horizonConfig);
  
  // Generate forecast with confidence bands
  const forecast = generateForecast(category, periods, historicalData);
  
  // Calculate accuracy metrics
  const accuracy = await getAccuracyMetrics(category);
  
  // Get drivers
  const drivers = getDrivers(category);
  
  return {
    category,
    horizon,
    title: getForecastTitle(category),
    unit: getUnit(category),
    current: getCurrentValue(category),
    periods: forecast,
    drivers,
    accuracy,
  };
}

/**
 * Get all forecasts for executive dashboard
 */
export async function getAllForecasts(horizon = '1M') {
  const categories = ['DEMAND', 'CAPACITY', 'INVENTORY', 'MARGIN', 'CASH'];
  const forecasts = {};
  
  for (const category of categories) {
    forecasts[category] = await getForecast(category, horizon);
  }
  
  return forecasts;
}

/**
 * Get horizon configuration
 */
function getHorizonConfig(horizon) {
  const configs = {
    '1W': { periodType: 'day', periodCount: 7, label: 'Day' },
    '1M': { periodType: 'week', periodCount: 4, label: 'Week' },
    '3M': { periodType: 'week', periodCount: 12, label: 'Week' },
    '12M': { periodType: 'month', periodCount: 12, label: 'Month' },
  };
  return configs[horizon] || configs['1M'];
}

/**
 * Generate period labels
 */
function generatePeriods(config) {
  const periods = [];
  const now = new Date();
  
  for (let i = 0; i < config.periodCount; i++) {
    let label;
    if (config.periodType === 'day') {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } else if (config.periodType === 'week') {
      label = `${config.label} ${Math.ceil((now.getDate() + i * 7) / 7) + Math.floor(now.getMonth() * 4.3)}`;
    } else {
      const date = new Date(now);
      date.setMonth(date.getMonth() + i);
      label = date.toLocaleDateString('en-US', { month: 'short' });
    }
    periods.push({ index: i, label });
  }
  
  return periods;
}

/**
 * Get historical data for forecasting
 */
async function getHistoricalData(category, config) {
  // In production, query actual historical data
  // For now, return mock data
  return {
    trend: 0.02, // 2% growth trend
    seasonality: [1.0, 1.05, 1.02, 0.98, 0.95, 1.0, 1.03, 1.08],
    volatility: 0.15,
    lastValue: getCurrentValue(category),
  };
}

/**
 * Generate forecast with confidence bands
 */
function generateForecast(category, periods, historical) {
  const baseValue = historical.lastValue;
  const trend = historical.trend;
  const volatility = historical.volatility;
  
  return periods.map((period, idx) => {
    // Apply trend
    const trendFactor = 1 + (trend * idx);
    
    // Apply seasonality
    const seasonalityFactor = historical.seasonality[idx % historical.seasonality.length];
    
    // Calculate P50 (expected value)
    const p50 = Math.round(baseValue * trendFactor * seasonalityFactor);
    
    // Calculate confidence bands based on volatility
    const uncertainty = volatility * Math.sqrt(idx + 1);
    const p10 = Math.round(p50 * (1 - uncertainty));
    const p90 = Math.round(p50 * (1 + uncertainty));
    
    return {
      period: period.label,
      p10,
      p50,
      p90,
    };
  });
}

/**
 * Get current value for category
 */
function getCurrentValue(category) {
  const values = {
    DEMAND: 185000,
    CAPACITY: 78,
    INVENTORY: 4200000,
    MARGIN: 22.1,
    CASH: 1250000,
  };
  return values[category] || 0;
}

/**
 * Get forecast title
 */
function getForecastTitle(category) {
  const titles = {
    DEMAND: 'Demand Forecast',
    CAPACITY: 'Capacity Utilization Forecast',
    INVENTORY: 'Inventory Level Forecast',
    MARGIN: 'Gross Margin Forecast',
    CASH: 'Cash Flow Forecast',
  };
  return titles[category] || 'Forecast';
}

/**
 * Get unit for category
 */
function getUnit(category) {
  const units = {
    DEMAND: 'lbs',
    CAPACITY: '%',
    INVENTORY: '$',
    MARGIN: '%',
    CASH: '$',
  };
  return units[category] || '';
}

/**
 * Get key drivers for forecast
 */
function getDrivers(category) {
  const allDrivers = {
    DEMAND: [
      { factor: 'Seasonal pattern', contribution: '+12%', direction: 'up' },
      { factor: 'Pipeline conversion', contribution: '+8%', direction: 'up' },
      { factor: 'Customer churn', contribution: '-3%', direction: 'down' },
    ],
    CAPACITY: [
      { factor: 'Demand increase', contribution: '+7%', direction: 'up' },
      { factor: 'Planned maintenance', contribution: '-4%', direction: 'down' },
      { factor: 'New hire ramp-up', contribution: '+2%', direction: 'up' },
    ],
    MARGIN: [
      { factor: 'Price increases', contribution: '+1.2%', direction: 'up' },
      { factor: 'Raw material costs', contribution: '-0.5%', direction: 'down' },
      { factor: 'Efficiency gains', contribution: '+0.4%', direction: 'up' },
    ],
    INVENTORY: [
      { factor: 'Demand reduction', contribution: '-5%', direction: 'down' },
      { factor: 'Supplier lead times', contribution: '+3%', direction: 'up' },
    ],
    CASH: [
      { factor: 'Revenue growth', contribution: '+8%', direction: 'up' },
      { factor: 'AR collections', contribution: '+5%', direction: 'up' },
      { factor: 'Capital spending', contribution: '-10%', direction: 'down' },
    ],
  };
  return allDrivers[category] || [];
}

/**
 * Get accuracy metrics for forecast model
 */
async function getAccuracyMetrics(category) {
  // In production, calculate from historical forecast vs actuals
  const metrics = {
    DEMAND: { mape: 8.2, trend: 'improving' },
    CAPACITY: { mape: 5.4, trend: 'stable' },
    INVENTORY: { mape: 6.8, trend: 'stable' },
    MARGIN: { mape: 6.1, trend: 'improving' },
    CASH: { mape: 9.5, trend: 'stable' },
  };
  
  return {
    ...metrics[category],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get forecast assumptions for transparency
 */
export async function getForecastAssumptions() {
  return [
    { category: 'Economic', assumption: 'No recession in forecast period', impact: 'HIGH' },
    { category: 'Commodity', assumption: 'Steel prices +/- 5% from current', impact: 'MEDIUM' },
    { category: 'Customer', assumption: 'Top 10 customers maintain volumes', impact: 'HIGH' },
    { category: 'Operations', assumption: 'No major equipment failures', impact: 'MEDIUM' },
    { category: 'Competition', assumption: 'Market share stable', impact: 'LOW' },
  ];
}

/**
 * Run sensitivity analysis on forecast
 */
export async function runSensitivityAnalysis(category, variableName, rangeMin, rangeMax) {
  const steps = 5;
  const stepSize = (rangeMax - rangeMin) / (steps - 1);
  
  const results = [];
  for (let i = 0; i < steps; i++) {
    const value = rangeMin + (i * stepSize);
    const forecast = await getForecast(category, '1M');
    
    // Apply sensitivity adjustment
    const adjustedP50 = forecast.periods.map(p => ({
      ...p,
      p50: Math.round(p.p50 * (1 + (value / 100))),
    }));
    
    results.push({
      variable: variableName,
      value: `${value.toFixed(1)}%`,
      impactOnP50: adjustedP50[adjustedP50.length - 1].p50 - forecast.periods[forecast.periods.length - 1].p50,
    });
  }
  
  return {
    category,
    variable: variableName,
    range: { min: rangeMin, max: rangeMax },
    results,
  };
}

/**
 * Save forecast snapshot for audit trail
 */
export async function saveForecastSnapshot(userId, category, horizon) {
  const forecast = await getForecast(category, horizon);
  
  const snapshot = {
    id: `FCST-${Date.now()}`,
    category,
    horizon,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    data: forecast,
  };
  
  // In production, save to database
  // await prisma.forecastSnapshot.create({ data: snapshot });
  
  return snapshot;
}

export default {
  getForecast,
  getAllForecasts,
  getForecastAssumptions,
  runSensitivityAnalysis,
  saveForecastSnapshot,
};
