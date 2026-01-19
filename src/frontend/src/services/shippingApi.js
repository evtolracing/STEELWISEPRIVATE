// src/services/shippingApi.js
/**
 * Shipping API Service
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function getShippingSummary(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.locationId) queryParams.append('locationId', params.locationId);
  if (params.date) queryParams.append('date', params.date);
  
  try {
    const response = await fetch(`${API_BASE}/v1/shipping/summary?${queryParams.toString()}`);
    if (!response.ok) return getMockShippingSummary(params);
    return response.json();
  } catch (error) {
    return getMockShippingSummary(params);
  }
}

export async function getShipments(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.locationId) queryParams.append('locationId', params.locationId);
  if (params.status) queryParams.append('status', params.status);
  if (params.date) queryParams.append('date', params.date);
  
  try {
    const response = await fetch(`${API_BASE}/v1/shipments?${queryParams.toString()}`);
    if (!response.ok) return getMockShipments(params);
    return response.json();
  } catch (error) {
    return getMockShipments(params);
  }
}

// Mock data fallbacks
function getMockShippingSummary(params) {
  return {
    staged: 5,
    readyToShip: 8,
    dispatched: 12,
    lateRisk: 2,
    todayTotal: 25,
    locationId: params.locationId || 'FWA',
  };
}

function getMockShipments(params) {
  return [
    { id: 'SHP-001', customerName: 'Acme Corp', orderNumber: 'ORD-2026-001', status: 'READY', carrier: 'FedEx', scheduledTime: '2:00 PM', weight: 450, pieces: 12 },
    { id: 'SHP-002', customerName: 'BuildRight Inc', orderNumber: 'ORD-2026-002', status: 'STAGED', carrier: 'UPS', scheduledTime: '3:30 PM', weight: 280, pieces: 8 },
    { id: 'SHP-003', customerName: 'Metro Fabrication', orderNumber: 'ORD-2026-003', status: 'DISPATCHED', carrier: 'Customer Pickup', scheduledTime: '1:00 PM', weight: 1200, pieces: 25 },
    { id: 'SHP-004', customerName: 'QuickParts LLC', orderNumber: 'ORD-2026-004', status: 'READY', carrier: 'FedEx', scheduledTime: '4:00 PM', weight: 180, pieces: 5 },
    { id: 'SHP-005', customerName: 'Steel Masters', orderNumber: 'ORD-2026-005', status: 'STAGED', carrier: 'LTL Freight', scheduledTime: '5:00 PM', weight: 2500, pieces: 40 },
  ];
}
