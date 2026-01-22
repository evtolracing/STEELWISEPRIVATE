// src/services/forecastApi.js
/**
 * Operations Forecast API Service
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function getOpsForecast(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.locationId) queryParams.append('locationId', params.locationId);
  if (params.division) queryParams.append('division', params.division);
  if (params.horizonDays) queryParams.append('horizonDays', params.horizonDays);
  
  try {
    const response = await fetch(`${API_BASE}/v1/analytics/ops-forecast?${queryParams.toString()}`);
    if (!response.ok) return getMockForecast(params);
    return response.json();
  } catch (error) {
    return getMockForecast(params);
  }
}

export async function getCapacityForecast(params = {}) {
  try {
    const response = await fetch(`${API_BASE}/v1/analytics/capacity-forecast`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    return null;
  }
}

// Mock data fallback
function getMockForecast(params) {
  const horizonDays = params.horizonDays || 7;
  
  return {
    today: {
      date: new Date().toISOString().split('T')[0],
      load: 420,
      capacity: 480,
      utilizationPercent: 87.5,
      jobsPlanned: 18,
      hotJobs: 4,
      atRiskJobs: 3,
    },
    tomorrow: {
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      load: 380,
      capacity: 480,
      utilizationPercent: 79.2,
      jobsPlanned: 15,
      hotJobs: 2,
      atRiskJobs: 2,
    },
    weekAhead: horizonDays >= 7 ? [
      { day: 'Mon', load: 420, capacity: 480 },
      { day: 'Tue', load: 380, capacity: 480 },
      { day: 'Wed', load: 450, capacity: 480 },
      { day: 'Thu', load: 390, capacity: 480 },
      { day: 'Fri', load: 360, capacity: 480 },
    ] : null,
    trend: 'STABLE',
    alerts: [
      { type: 'CAPACITY', message: 'Wednesday load at 94% - consider overtime', severity: 'WARNING' },
    ],
  };
}
