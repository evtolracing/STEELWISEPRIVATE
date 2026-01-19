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
      return getMockWorkCenters(params);
    }
    return response.json();
  } catch (error) {
    return getMockWorkCenters(params);
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
      return getMockUtilization(params);
    }
    return response.json();
  } catch (error) {
    return getMockUtilization(params);
  }
}

// Mock data fallbacks
function getMockWorkCenters(params) {
  return [
    { id: 'WC-SAW-01', code: 'SAW-01', name: 'Saw Line 1', workCenterType: 'SAW', locationId: params.locationId || 'FWA', isOnline: true },
    { id: 'WC-SAW-02', code: 'SAW-02', name: 'Saw Line 2', workCenterType: 'SAW', locationId: params.locationId || 'FWA', isOnline: true },
    { id: 'WC-SHEAR-01', code: 'SHEAR-01', name: 'Shear 1', workCenterType: 'SHEAR', locationId: params.locationId || 'FWA', isOnline: true },
    { id: 'WC-ROUTER-01', code: 'RTR-01', name: 'CNC Router', workCenterType: 'ROUTER', locationId: params.locationId || 'FWA', isOnline: true },
    { id: 'WC-WATERJET-01', code: 'WJ-01', name: 'Waterjet', workCenterType: 'WATERJET', locationId: params.locationId || 'FWA', isOnline: false },
    { id: 'WC-PACK-01', code: 'PACK-01', name: 'Packaging', workCenterType: 'PACK', locationId: params.locationId || 'FWA', isOnline: true },
  ];
}

function getMockUtilization(params) {
  return [
    { id: 'WC-SAW-01', workCenterId: 'WC-SAW-01', name: 'Saw Line 1', utilizationPercent: 94, activeJobs: 4, status: 'CRITICAL' },
    { id: 'WC-SAW-02', workCenterId: 'WC-SAW-02', name: 'Saw Line 2', utilizationPercent: 72, activeJobs: 2, status: 'NORMAL' },
    { id: 'WC-SHEAR-01', workCenterId: 'WC-SHEAR-01', name: 'Shear 1', utilizationPercent: 88, activeJobs: 3, status: 'WARNING' },
    { id: 'WC-ROUTER-01', workCenterId: 'WC-ROUTER-01', name: 'CNC Router', utilizationPercent: 65, activeJobs: 2, status: 'NORMAL' },
    { id: 'WC-WATERJET-01', workCenterId: 'WC-WATERJET-01', name: 'Waterjet', utilizationPercent: 45, activeJobs: 1, status: 'NORMAL' },
    { id: 'WC-PACK-01', workCenterId: 'WC-PACK-01', name: 'Packaging', utilizationPercent: 55, activeJobs: 2, status: 'NORMAL' },
  ];
}
