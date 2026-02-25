/**
 * Inventory API Service
 * Handles all inventory-related API calls
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const V1_BASE = `${API_BASE}/v1/inventory`;

/**
 * Get inventory list with optional filters
 */
export async function getInventory(params = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.materialCode) queryParams.append('materialCode', params.materialCode);
  if (params.locationId) queryParams.append('locationId', params.locationId);
  if (params.division) queryParams.append('division', params.division);
  if (params.isRemnant !== undefined) queryParams.append('isRemnant', params.isRemnant);
  if (params.status) queryParams.append('status', params.status);
  
  const url = `${V1_BASE}?${queryParams.toString()}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch inventory');
  }
  
  return response.json();
}

/**
 * Get single inventory unit by ID
 */
export async function getInventoryById(id) {
  const response = await fetch(`${V1_BASE}/${id}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch inventory unit');
  }
  
  return response.json();
}

/**
 * Get inventory summary statistics
 */
export async function getInventorySummary() {
  const response = await fetch(`${V1_BASE}/summary`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch inventory summary');
  }
  
  return response.json();
}

/**
 * Get all locations
 */
export async function getLocations() {
  const response = await fetch(`${V1_BASE}/locations`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch locations');
  }
  
  return response.json();
}

/**
 * Get catalog items
 */
export async function getCatalog() {
  const response = await fetch(`${V1_BASE}/catalog`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch catalog');
  }
  
  return response.json();
}

/**
 * Adjust inventory quantity
 */
export async function adjustInventory(payload) {
  const response = await fetch(`${V1_BASE}/adjust`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to adjust inventory');
  }
  
  return response.json();
}

/**
 * Create a new transfer request
 */
export async function createTransfer(payload) {
  const response = await fetch(`${V1_BASE}/transfers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create transfer');
  }
  
  return response.json();
}

/**
 * Update transfer status
 */
export async function updateTransferStatus(id, payload) {
  const response = await fetch(`${V1_BASE}/transfers/${id}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update transfer status');
  }
  
  return response.json();
}

/**
 * Record an RFID scan event
 * @param {Object} payload - { rfidTagId, locationId, timestamp?, eventType? }
 */
export async function rfidScan(payload) {
  const response = await fetch(`${V1_BASE}/rfid-scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to process RFID scan');
  }
  
  return response.json();
}

/**
 * Lookup inventory by RFID tag
 * @param {string} rfidTagId - The RFID tag ID to look up
 */
export async function getByRfid(rfidTagId) {
  const response = await fetch(`${V1_BASE}/rfid/${encodeURIComponent(rfidTagId)}`);
  
  if (!response.ok) {
    throw new Error('Failed to lookup by RFID');
  }
  
  return response.json();
}

/**
 * Lookup inventory by etched ID
 * @param {string} etchedId - The etched ID to look up
 */
export async function getByEtched(etchedId) {
  const response = await fetch(`${V1_BASE}/etched/${encodeURIComponent(etchedId)}`);
  
  if (!response.ok) {
    throw new Error('Failed to lookup by etched ID');
  }
  
  return response.json();
}

/**
 * Get inventory risk analysis
 */
export async function getInventoryRisk(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.locationId) queryParams.append('locationId', params.locationId);
  if (params.division) queryParams.append('division', params.division);
  
  try {
    const response = await fetch(`${API_BASE}/v1/analytics/inventory/risk?${queryParams.toString()}`);
    if (!response.ok) return getMockInventoryRisk(params);
    return response.json();
  } catch (error) {
    return getMockInventoryRisk(params);
  }
}

/**
 * Get inventory transfers
 */
export async function getTransfers(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.locationId) queryParams.append('locationId', params.locationId);
  if (params.direction) queryParams.append('direction', params.direction);
  
  try {
    const response = await fetch(`${V1_BASE}/transfers?${queryParams.toString()}`);
    if (!response.ok) return getMockTransfers(params);
    return response.json();
  } catch (error) {
    return getMockTransfers(params);
  }
}

// Mock data fallbacks
function getMockInventoryRisk(params) {
  const loc = params.locationId || 'FWA';
  return {
    summary: { critical: 2, low: 3, ok: 15 },
    items: [
      { id: 'INV-002', materialCode: 'HR-A36-0250', description: 'Hot Rolled A36 0.25"', locationId: loc, status: 'LOW', availableQty: 180, reorderPoint: 300 },
      { id: 'INV-003', materialCode: 'SS-304-0125', description: 'Stainless 304 0.125"', locationId: loc, status: 'CRITICAL', availableQty: 45, reorderPoint: 200 },
      { id: 'INV-005', materialCode: 'BRASS-360-0500', description: 'Brass 360 0.5"', locationId: loc, status: 'LOW', availableQty: 95, reorderPoint: 150 },
    ],
  };
}

function getMockTransfers(params) {
  const loc = params.locationId || 'FWA';
  return [
    { id: 'TRF-001', fromLocationId: 'DET-WH', toLocationId: loc, status: 'IN_TRANSIT', eta: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), items: 12, carrier: 'Internal' },
    { id: 'TRF-002', fromLocationId: loc, toLocationId: 'JAX', status: 'PENDING', eta: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), items: 5, carrier: 'FedEx' },
    { id: 'TRF-003', fromLocationId: 'CHI-WH', toLocationId: loc, status: 'DELIVERED', eta: null, items: 8, carrier: 'Internal' },
  ];
}

