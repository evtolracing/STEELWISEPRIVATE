import client from './client'

// Jobs API - Core operations for service center jobs/work orders

// Get all jobs with filters
export const getJobs = (params) => client.get('/jobs', { params }).then(r => r.data)

// Get single job by ID
export const getJob = (id) => client.get(`/jobs/${id}`).then(r => r.data)

// Create new job/work order
export const createJob = (data) => client.post('/jobs', data).then(r => r.data)

// Update job
export const updateJob = (id, data) => client.put(`/jobs/${id}`, data).then(r => r.data)

// Status transitions
export const updateJobStatus = (id, status, data = {}) => 
  client.patch(`/jobs/${id}/status`, { status, ...data }).then(r => r.data)

// Start job processing
export const startJob = (id, operatorId, workCenterId) => 
  client.post(`/jobs/${id}/start`, { operatorId, workCenterId }).then(r => r.data)

// Complete job
export const completeJob = (id, data) => 
  client.post(`/jobs/${id}/complete`, data).then(r => r.data)

// Get jobs by status (for kanban board)
export const getJobsByStatus = (statuses) => 
  client.get('/jobs', { params: { status: statuses.join(',') } }).then(r => r.data)

export default {
  getJobs,
  getJob,
  createJob,
  updateJob,
  updateJobStatus,
  startJob,
  completeJob,
  getJobsByStatus,
}
