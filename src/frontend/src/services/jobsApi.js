// Jobs API service
const API_BASE = '/api';

/**
 * Get jobs with optional filters
 * @param {Object} filters - Optional filters (workCenterId, status, locationId, orderId)
 * @returns {Promise<Array>} Array of jobs
 */
export async function getJobs(filters = {}) {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  
  const queryString = params.toString();
  const url = `${API_BASE}/jobs${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch jobs: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get a single job by ID
 * @param {string} id - Job ID
 * @returns {Promise<Object>} Job object
 */
export async function getJob(id) {
  const response = await fetch(`${API_BASE}/jobs/${id}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch job: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Update job status
 * @param {string} id - Job ID
 * @param {Object} data - Status update data (status, scrapWeightLb, note)
 * @returns {Promise<Object>} Updated job object
 */
export async function updateJobStatus(id, data) {
  const response = await fetch(`${API_BASE}/jobs/${id}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update job status: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Create a new job
 * @param {Object} jobData - Job data
 * @returns {Promise<Object>} Created job object
 */
export async function createJob(jobData) {
  const response = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(jobData),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create job: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Update a job
 * @param {string} id - Job ID
 * @param {Object} jobData - Job data to update
 * @returns {Promise<Object>} Updated job object
 */
export async function updateJob(id, jobData) {
  const response = await fetch(`${API_BASE}/jobs/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(jobData),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update job: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Plan a job - defines routing operations and moves to SCHEDULED status.
 * This also creates the job + operations in the dispatch engine for shop floor.
 * @param {string} id - Job ID
 * @param {Object} planData - Planning data
 * @param {Array} planData.operations - Array of { workCenterType, name, skillLevel }
 * @param {string} planData.division - Division (METALS/PLASTICS)
 * @param {string} planData.dueDate - Due date ISO string
 * @param {string} planData.materialCode - Material code
 * @param {string} planData.commodity - Commodity type
 * @param {number} planData.thickness - Material thickness in inches
 * @param {string} planData.locationId - Location ID (FWA, IND, CHI)
 * @returns {Promise<Object>} { success, job, dispatchJob, operations }
 */
export async function planJob(id, planData) {
  const response = await fetch(`${API_BASE}/jobs/${id}/plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(planData),
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to plan job: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Assign a job to a user
 * @param {string} id - Job ID
 * @param {string} userId - User ID to assign
 * @returns {Promise<Object>} Updated job object
 */
export async function assignJob(id, userId) {
  const response = await fetch(`${API_BASE}/jobs/${id}/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ userId }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to assign job: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get SLA risk analysis for jobs
 * @param {Object} params - Optional filters (locationId, division)
 * @returns {Promise<Object>} SLA risk summary with grouped jobs
 */
export async function getSlaRiskJobs(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.locationId) queryParams.append('locationId', params.locationId);
  if (params.division) queryParams.append('division', params.division);
  
  try {
    const response = await fetch(`${API_BASE}/v1/jobs/sla-risk?${queryParams.toString()}`);
    if (!response.ok) return getMockSlaRisk(params);
    return response.json();
  } catch (error) {
    console.warn('SLA risk API unavailable, using mock data');
    return getMockSlaRisk(params);
  }
}

// Mock SLA risk data
function getMockSlaRisk(params) {
  const now = Date.now();
  const jobs = [
    { id: 'JOB-001', jobNumber: 'J-2026-001', customerName: 'Acme Corp', priority: 'HOT', status: 'IN_PROCESS', dueDate: new Date(now + 4 * 60 * 60 * 1000).toISOString(), hoursUntilDue: 4, risk: 'HOT' },
    { id: 'JOB-002', jobNumber: 'J-2026-002', customerName: 'BuildRight', priority: 'RUSH', status: 'SCHEDULED', dueDate: new Date(now + 8 * 60 * 60 * 1000).toISOString(), hoursUntilDue: 8, risk: 'AT_RISK' },
    { id: 'JOB-003', jobNumber: 'J-2026-003', customerName: 'Steel Masters', priority: 'HOT', status: 'PACKAGING', dueDate: new Date(now + 2 * 60 * 60 * 1000).toISOString(), hoursUntilDue: 2, risk: 'HOT' },
    { id: 'JOB-004', jobNumber: 'J-2026-004', customerName: 'Metro Fab', priority: 'NORMAL', status: 'IN_PROCESS', dueDate: new Date(now + 10 * 60 * 60 * 1000).toISOString(), hoursUntilDue: 10, risk: 'AT_RISK' },
    { id: 'JOB-005', jobNumber: 'J-2026-005', customerName: 'QuickParts', priority: 'NORMAL', status: 'SCHEDULED', dueDate: new Date(now + 48 * 60 * 60 * 1000).toISOString(), hoursUntilDue: 48, risk: 'SAFE' },
  ];
  
  return {
    summary: {
      hot: jobs.filter(j => j.risk === 'HOT').length,
      atRisk: jobs.filter(j => j.risk === 'AT_RISK').length,
      safe: jobs.filter(j => j.risk === 'SAFE').length,
    },
    jobs,
  };
}

