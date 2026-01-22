const API_BASE = '/api';

// Get all jobs with optional filters
export async function getJobs(params) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
  }

  const res = await fetch(`${API_BASE}/jobs?${searchParams.toString()}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to load jobs');
  return res.json();
}

// Get job by ID
export async function getJob(jobId) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to load job');
  return res.json();
}

// Create a new job
export async function createJob(jobData) {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(jobData),
  });
  if (!res.ok) throw new Error('Failed to create job');
  return res.json();
}

// Update job status
export async function updateJobStatus(jobId, payload) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update job status');
  return res.json();
}

// Update job details
export async function updateJob(jobId, updateData) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updateData),
  });
  if (!res.ok) throw new Error('Failed to update job');
  return res.json();
}

// Assign job to operator
export async function assignJob(jobId, userId) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Failed to assign job');
  return res.json();
}

// Get work centers
export async function getWorkCenters(params) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
  }

  const res = await fetch(`${API_BASE}/work-centers?${searchParams.toString()}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to load work centers');
  return res.json();
}

// Get work center schedule
export async function getWorkCenterSchedule(workCenterId, startDate, endDate) {
  const searchParams = new URLSearchParams();
  if (startDate) searchParams.append('startDate', startDate);
  if (endDate) searchParams.append('endDate', endDate);

  const res = await fetch(`${API_BASE}/work-centers/${workCenterId}/schedule?${searchParams.toString()}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to load work center schedule');
  return res.json();
}

export default {
  getJobs,
  getJob,
  createJob,
  updateJobStatus,
  updateJob,
  assignJob,
  getWorkCenters,
  getWorkCenterSchedule,
};
