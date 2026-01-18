import client from './client';

// Get all jobs with optional filters
export const getJobs = async (params = {}) => {
  const response = await client.get('/jobs', { params });
  return response.data; // Now returns array directly
};

// Get job by ID
export const getJob = async (jobId) => {
  const response = await client.get(`/jobs/${jobId}`);
  return response.data;
};

// Create a new job
export const createJob = async (jobData) => {
  const response = await client.post('/jobs', jobData);
  return response.data;
};

// Update job status
export const updateJobStatus = async (jobId, status, note = null) => {
  const response = await client.post(`/jobs/${jobId}/status`, { status, note });
  return response.data;
};

// Update job details
export const updateJob = async (jobId, updateData) => {
  const response = await client.patch(`/jobs/${jobId}`, updateData);
  return response.data;
};

// Assign job to operator
export const assignJob = async (jobId, userId) => {
  const response = await client.post(`/jobs/${jobId}/assign`, { userId });
  return response.data;
};

// Get work centers
export const getWorkCenters = async (params = {}) => {
  const response = await client.get('/work-centers', { params });
  return response.data?.data || response.data || [];
};

// Get work center schedule
export const getWorkCenterSchedule = async (workCenterId, startDate, endDate) => {
  const response = await client.get(`/work-centers/${workCenterId}/schedule`, {
    params: { startDate, endDate }
  });
  return response.data;
};

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
