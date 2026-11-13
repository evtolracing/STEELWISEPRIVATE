// src/services/exceptionsApi.js
/**
 * Exceptions/Events Feed API Service
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function getExceptionsFeed(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.locationId) queryParams.append('locationId', params.locationId);
  if (params.workCenterId) queryParams.append('workCenterId', params.workCenterId);
  if (params.type) queryParams.append('type', params.type);
  if (params.limit) queryParams.append('limit', params.limit);
  
  try {
    const response = await fetch(`${API_BASE}/v1/events/exceptions?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Not available right now. The server did not answer.');
    return response.json();
  } catch (error) {
    throw new Error('Not available right now. The server did not answer.');
  }
}

export async function acknowledgeException(id) {
  try {
    const response = await fetch(`${API_BASE}/v1/events/exceptions/${id}/acknowledge`, {
      method: 'POST',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

