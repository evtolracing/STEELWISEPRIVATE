// src/services/forecastApi.js
/**
 * Operations Forecast API Service
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function getOpsForecast(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.locationId) queryParams.append('locationId', params.locationId);
  if (params.division) queryParams.append('division', params.division);
  if (params.horizonDays) queryParams.append('horizonDays', params.horizonDays);
  
  try {
    const response = await fetch(`${API_BASE}/v1/analytics/ops-forecast?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Not available right now. The server did not answer.');
    return response.json();
  } catch (error) {
    throw new Error('Not available right now. The server did not answer.');
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

