// src/services/workCentersApi.js
/**
 * Work Centers API Service
 */

const API_BASE = '/api/v1';

export async function getWorkCenters(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.locationId) queryParams.append('locationId', params.locationId);
  if (params.division) queryParams.append('division', params.division);
  
  const url = `${API_BASE}/work-centers${queryParams.toString() ? `?${queryParams}` : ''}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Return mock data if API not available
      throw new Error('Not available right now. The server did not answer.');
    }
    return response.json();
  } catch (error) {
    throw new Error('Not available right now. The server did not answer.');
  }
}

export async function getWorkCenterUtilization(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.locationId) queryParams.append('locationId', params.locationId);
  if (params.division) queryParams.append('division', params.division);
  
  const url = `${API_BASE}/analytics/work-centers/utilization${queryParams.toString() ? `?${queryParams}` : ''}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Not available right now. The server did not answer.');
    }
    return response.json();
  } catch (error) {
    throw new Error('Not available right now. The server did not answer.');
  }
}


