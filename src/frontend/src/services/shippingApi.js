// src/services/shippingApi.js
/**
 * Shipping API Service
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function getShippingSummary(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.locationId) queryParams.append('locationId', params.locationId);
  if (params.date) queryParams.append('date', params.date);
  
  try {
    const response = await fetch(`${API_BASE}/v1/shipping/summary?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Not available right now. The server did not answer.');
    return response.json();
  } catch (error) {
    throw new Error('Not available right now. The server did not answer.');
  }
}

export async function getShipments(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.locationId) queryParams.append('locationId', params.locationId);
  if (params.status) queryParams.append('status', params.status);
  if (params.date) queryParams.append('date', params.date);
  
  try {
    const response = await fetch(`${API_BASE}/v1/shipments?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Not available right now. The server did not answer.');
    return response.json();
  } catch (error) {
    throw new Error('Not available right now. The server did not answer.');
  }
}


