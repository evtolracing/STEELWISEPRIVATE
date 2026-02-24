/**
 * Jobs API Service
 * Client-side service for production workflow operations
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Fetch all jobs with optional filters
 */
export async function fetchJobs(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.locationId) params.append('locationId', filters.locationId);
  if (filters.workCenterId) params.append('workCenterId', filters.workCenterId);
  if (filters.divisionId) params.append('divisionId', filters.divisionId);

  const response = await fetch(`${API_BASE_URL}/jobs?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch jobs');
  }
  
  return response.json();
}

/**
 * Fetch single job by ID
 */
export async function fetchJob(jobId) {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch job');
  }
  
  return response.json();
}

/**
 * Update job status
 */
export async function updateJobStatus(jobId, status, notes = '', userId = 'system') {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status, notes, userId })
  });
  
  if (!response.ok) {
    throw new Error('Failed to update job status');
  }
  
  return response.json();
}

/**
 * Start a job
 */
export async function startJob(jobId, userId = 'system') {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId })
  });
  
  if (!response.ok) {
    throw new Error('Failed to start job');
  }
  
  return response.json();
}

/**
 * Complete a job
 */
export async function completeJob(jobId, notes = '', userId = 'system') {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId, notes })
  });
  
  if (!response.ok) {
    throw new Error('Failed to complete job');
  }
  
  return response.json();
}

/**
 * Ship a job
 */
export async function shipJob(jobId, trackingNumber, carrier, notes = '', userId = 'system') {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/ship`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId, trackingNumber, carrier, notes })
  });
  
  if (!response.ok) {
    throw new Error('Failed to ship job');
  }
  
  return response.json();
}

/**
 * Fetch job status history
 */
export async function fetchJobHistory(jobId) {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/history`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch job history');
  }
  
  return response.json();
}

/**
 * Fetch job statistics
 */
export async function fetchJobStats(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.locationId) params.append('locationId', filters.locationId);
  if (filters.workCenterId) params.append('workCenterId', filters.workCenterId);

  const response = await fetch(`${API_BASE_URL}/jobs/stats/summary?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch job stats');
  }
  
  return response.json();
}
