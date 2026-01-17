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

// Delete job
export const deleteJob = (id) => client.delete(`/jobs/${id}`).then(r => r.data)

// Status transitions
export const updateJobStatus = (id, status, data = {}) => 
  client.patch(`/jobs/${id}/status`, { status, ...data }).then(r => r.data)

// Start job processing
export const startJob = (id, operatorId, workCenterId) => 
  client.post(`/jobs/${id}/start`, { operatorId, workCenterId }).then(r => r.data)

// Pause job
export const pauseJob = (id, reason) => 
  client.post(`/jobs/${id}/pause`, { reason }).then(r => r.data)

// Resume job
export const resumeJob = (id) => 
  client.post(`/jobs/${id}/resume`).then(r => r.data)

// Complete job
export const completeJob = (id, data) => 
  client.post(`/jobs/${id}/complete`, data).then(r => r.data)

// Cancel job
export const cancelJob = (id, reason) => 
  client.post(`/jobs/${id}/cancel`, { reason }).then(r => r.data)

// Assign operator
export const assignOperator = (id, operatorId) => 
  client.post(`/jobs/${id}/assign`, { operatorId }).then(r => r.data)

// Unassign operator
export const unassignOperator = (id, operatorId) => 
  client.post(`/jobs/${id}/unassign`, { operatorId }).then(r => r.data)

// Schedule job to work center
export const scheduleJob = (id, data) => 
  client.post(`/jobs/${id}/schedule`, data).then(r => r.data)

// Reschedule job
export const rescheduleJob = (id, data) => 
  client.put(`/jobs/${id}/schedule`, data).then(r => r.data)

// Set priority
export const setJobPriority = (id, priority) => 
  client.patch(`/jobs/${id}/priority`, { priority }).then(r => r.data)

// Get job timeline/history
export const getJobTimeline = (id) => client.get(`/jobs/${id}/timeline`).then(r => r.data)

// Get job documents
export const getJobDocuments = (id) => client.get(`/jobs/${id}/documents`).then(r => r.data)

// Upload document to job
export const uploadJobDocument = (id, file, type) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  return client.post(`/jobs/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)
}

// Record scrap/yield
export const recordScrap = (id, data) => 
  client.post(`/jobs/${id}/scrap`, data).then(r => r.data)

// Record measurements
export const recordMeasurements = (id, measurements) => 
  client.post(`/jobs/${id}/measurements`, { measurements }).then(r => r.data)

// Get job notes
export const getJobNotes = (id) => client.get(`/jobs/${id}/notes`).then(r => r.data)

// Add note to job
export const addJobNote = (id, note) => 
  client.post(`/jobs/${id}/notes`, { note }).then(r => r.data)

// Get jobs by status (for kanban board)
export const getJobsByStatus = (statuses) => 
  client.get('/jobs', { params: { status: statuses.join(',') } }).then(r => r.data)

// Get jobs for work center
export const getJobsForWorkCenter = (workCenterId, date) => 
  client.get(`/work-centers/${workCenterId}/jobs`, { params: { date } }).then(r => r.data)

// Get operator's assigned jobs
export const getOperatorJobs = (operatorId) => 
  client.get('/jobs', { params: { operatorId, status: 'IN_PROCESS,SCHEDULED' } }).then(r => r.data)

// Bulk status update
export const bulkUpdateStatus = (jobIds, status) => 
  client.post('/jobs/bulk/status', { jobIds, status }).then(r => r.data)

// Split job (partial completion)
export const splitJob = (id, splitData) => 
  client.post(`/jobs/${id}/split`, splitData).then(r => r.data)

// Merge jobs
export const mergeJobs = (jobIds, mergeData) => 
  client.post('/jobs/merge', { jobIds, ...mergeData }).then(r => r.data)

export default {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  updateJobStatus,
  startJob,
  pauseJob,
  resumeJob,
  completeJob,
  cancelJob,
  assignOperator,
  unassignOperator,
  scheduleJob,
  rescheduleJob,
  setJobPriority,
  getJobTimeline,
  getJobDocuments,
  uploadJobDocument,
  recordScrap,
  recordMeasurements,
  getJobNotes,
  addJobNote,
  getJobsByStatus,
  getJobsForWorkCenter,
  getOperatorJobs,
  bulkUpdateStatus,
  splitJob,
  mergeJobs,
}
