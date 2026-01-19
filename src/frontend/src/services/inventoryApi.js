/**
 * Inventory API Service
 * Handles all inventory-related API calls
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
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
 * Get all transfers
 */
export async function getTransfers(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  
  const url = `${V1_BASE}/transfers?${queryParams.toString()}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch transfers');
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
