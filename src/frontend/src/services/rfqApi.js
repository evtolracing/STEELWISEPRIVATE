// src/services/rfqApi.js
/**
 * RFQ/Quote Funnel API Service
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const ORDERHUB_BASE = '/api/v1';

// ============================================================================
// OrderHub RFQ API Functions
// ============================================================================

export async function createRfq(payload) {
  const res = await fetch(`${ORDERHUB_BASE}/rfq`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create RFQ');
  }
  return res.json();
}

export async function getRfq(id) {
  const res = await fetch(`${ORDERHUB_BASE}/rfq/${id}`);
  if (!res.ok) {
    throw new Error('Failed to get RFQ');
  }
  return res.json();
}

export async function listRfqs(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${ORDERHUB_BASE}/rfq?${query}` : `${ORDERHUB_BASE}/rfq`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to list RFQs');
  }
  return res.json();
}

export async function updateRfqStatus(id, status) {
  const res = await fetch(`${ORDERHUB_BASE}/rfq/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    throw new Error('Failed to update RFQ status');
  }
  return res.json();
}

// ============================================================================
// Analytics/Funnel API Functions
// ============================================================================

export async function getRfqFunnelStats(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.locationId) queryParams.append('locationId', params.locationId);
  if (params.division) queryParams.append('division', params.division);
  if (params.dateRange) queryParams.append('dateRange', params.dateRange);
  
  try {
    const response = await fetch(`${API_BASE}/v1/analytics/rfq-funnel?${queryParams.toString()}`);
    if (!response.ok) return getMockRfqFunnel(params);
    return response.json();
  } catch (error) {
    return getMockRfqFunnel(params);
  }
}

export async function getRfqs(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.locationId) queryParams.append('locationId', params.locationId);
  if (params.status) queryParams.append('status', params.status);
  
  try {
    const response = await fetch(`${API_BASE}/v1/rfqs?${queryParams.toString()}`);
    if (!response.ok) return [];
    return response.json();
  } catch (error) {
    return [];
  }
}

// Mock data fallback
function getMockRfqFunnel(params) {
  return {
    rfqCount: 45,
    quotedCount: 32,
    orderedCount: 18,
    rfqToQuoteRate: 71,
    quoteToOrderRate: 56,
    avgQuoteValue: 4500,
    totalPipelineValue: 144000,
    avgResponseTime: 4.2, // hours
    topCustomers: [
      { name: 'Acme Corp', rfqs: 8, converted: 6 },
      { name: 'BuildRight', rfqs: 5, converted: 4 },
      { name: 'Metro Fab', rfqs: 4, converted: 2 },
    ],
  };
}
