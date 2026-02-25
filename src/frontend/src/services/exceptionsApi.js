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
    if (!response.ok) return getMockExceptions(params);
    return response.json();
  } catch (error) {
    return getMockExceptions(params);
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

// Mock data fallback
function getMockExceptions(params) {
  const loc = params.locationId || 'FWA';
  return [
    { id: 'EXC-001', type: 'SCRAP', message: 'Material scrap on JOB-2026-003 - 15 lbs aluminum', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), severity: 'WARNING', locationId: loc, workCenterId: 'SAW-01', acknowledged: false },
    { id: 'EXC-002', type: 'QC_HOLD', message: 'QC hold on JOB-2026-005 - dimension check required', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), severity: 'CRITICAL', locationId: loc, workCenterId: 'SHEAR-01', acknowledged: false },
    { id: 'EXC-003', type: 'DOWNTIME', message: 'Saw Line 1 blade change - 20 min delay', timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), severity: 'WARNING', locationId: loc, workCenterId: 'SAW-01', acknowledged: true },
    { id: 'EXC-004', type: 'REWORK', message: 'Rework needed on JOB-2026-002 - edge finish issue', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), severity: 'INFO', locationId: loc, workCenterId: 'RTR-01', acknowledged: false },
    { id: 'EXC-005', type: 'LATE_MATERIAL', message: 'Material late for JOB-2026-008 - ETA 2 hours', timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(), severity: 'WARNING', locationId: loc, workCenterId: null, acknowledged: false },
    { id: 'EXC-006', type: 'MACHINE_ALERT', message: 'Router spindle temp elevated - monitoring', timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(), severity: 'INFO', locationId: loc, workCenterId: 'RTR-01', acknowledged: true },
  ];
}
