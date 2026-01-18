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
