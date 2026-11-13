import client from './client'

// Work Centers API - Operations for managing work centers/machines

// Get all work centers
export const getWorkCenters = (params) => client.get('/work-centers', { params }).then(r => r.data)

// Create work center
export const createWorkCenter = (data) => client.post('/work-centers', data).then(r => r.data)

// Update work center
export const updateWorkCenter = (id, data) => client.put(`/work-centers/${id}`, data).then(r => r.data)

// Delete work center
export const deleteWorkCenter = (id) => client.delete(`/work-centers/${id}`).then(r => r.data)

// Get work center schedule for date range
export const getWorkCenterSchedule = (id, startDate, endDate) => 
  client.get(`/work-centers/${id}/schedule`, { params: { startDate, endDate } }).then(r => r.data)

export default {
  getWorkCenters,
  createWorkCenter,
  updateWorkCenter,
  deleteWorkCenter,
  getWorkCenterSchedule,
}
