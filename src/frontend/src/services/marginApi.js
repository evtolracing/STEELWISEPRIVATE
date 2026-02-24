// src/services/marginApi.js
/**
 * Margin Insights API Service
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function getMarginInsights(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.locationId) queryParams.append('locationId', params.locationId);
  if (params.division) queryParams.append('division', params.division);
  if (params.dateRange) queryParams.append('dateRange', params.dateRange);
  
  try {
    const response = await fetch(`${API_BASE}/v1/analytics/margin?${queryParams.toString()}`);
    if (!response.ok) return getMockMarginInsights(params);
    return response.json();
  } catch (error) {
    return getMockMarginInsights(params);
  }
}

export async function getMarginByCustomer(params = {}) {
  try {
    const response = await fetch(`${API_BASE}/v1/analytics/margin/by-customer`);
    if (!response.ok) return [];
    return response.json();
  } catch (error) {
    return [];
  }
}

// Mock data fallback
function getMockMarginInsights(params) {
  return {
    avgMargin: 28.5,
    marginTrend: 'UP',
    marginChange: 2.3,
    discountedOrdersPercent: 15,
    avgDiscount: 8.2,
    topMarginCustomer: 'Acme Corp',
    lowMarginAlert: 2,
    revenueToday: 85400,
    marginToday: 24320,
    byDivision: [
      { division: 'METALS', margin: 29.2 },
      { division: 'PLASTICS', margin: 26.8 },
    ],
  };
}
