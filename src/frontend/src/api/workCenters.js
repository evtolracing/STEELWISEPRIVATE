import client from './client'

// Work Centers API - Operations for managing work centers/machines

// Get all work centers
export const getWorkCenters = (params) => client.get('/work-centers', { params }).then(r => r.data)

// Get single work center
export const getWorkCenter = (id) => client.get(`/work-centers/${id}`).then(r => r.data)

// Get work centers by location
export const getWorkCentersByLocation = (locationId) => 
  client.get('/work-centers', { params: { locationId } }).then(r => r.data)

// Create work center
export const createWorkCenter = (data) => client.post('/work-centers', data).then(r => r.data)

// Update work center
export const updateWorkCenter = (id, data) => client.put(`/work-centers/${id}`, data).then(r => r.data)

// Delete work center
export const deleteWorkCenter = (id) => client.delete(`/work-centers/${id}`).then(r => r.data)

// Get work center capacity
export const getWorkCenterCapacity = (id) => client.get(`/work-centers/${id}/capacity`).then(r => r.data)

// Set work center status (ACTIVE, MAINTENANCE, DOWN, etc.)
export const setWorkCenterStatus = (id, status, reason) => 
  client.patch(`/work-centers/${id}/status`, { status, reason }).then(r => r.data)

// Get work center schedule for date range
export const getWorkCenterSchedule = (id, startDate, endDate) => 
  client.get(`/work-centers/${id}/schedule`, { params: { startDate, endDate } }).then(r => r.data)

// Get all work center schedules
export const getAllSchedules = (startDate, endDate) => 
  client.get('/work-centers/schedules', { params: { startDate, endDate } }).then(r => r.data)

// Get work center queue
export const getWorkCenterQueue = (id) => client.get(`/work-centers/${id}/queue`).then(r => r.data)

// Reorder queue
export const reorderQueue = (id, jobIds) => 
  client.put(`/work-centers/${id}/queue`, { jobIds }).then(r => r.data)

// Get work center efficiency metrics
export const getWorkCenterMetrics = (id, params) => 
  client.get(`/work-centers/${id}/metrics`, { params }).then(r => r.data)

// Get work center downtime logs
export const getDowntimeLogs = (id, params) => 
  client.get(`/work-centers/${id}/downtime`, { params }).then(r => r.data)

// Log downtime event
export const logDowntime = (id, data) => 
  client.post(`/work-centers/${id}/downtime`, data).then(r => r.data)

// End downtime event
export const endDowntime = (id, downtimeId) => 
  client.post(`/work-centers/${id}/downtime/${downtimeId}/end`).then(r => r.data)

// Get work center capabilities
export const getCapabilities = (id) => client.get(`/work-centers/${id}/capabilities`).then(r => r.data)

// Update capabilities
export const updateCapabilities = (id, capabilities) => 
  client.put(`/work-centers/${id}/capabilities`, { capabilities }).then(r => r.data)

// Get operators assigned to work center
export const getWorkCenterOperators = (id) => 
  client.get(`/work-centers/${id}/operators`).then(r => r.data)

// Assign operator to work center
export const assignOperatorToWorkCenter = (id, operatorId) => 
  client.post(`/work-centers/${id}/operators`, { operatorId }).then(r => r.data)

// Remove operator from work center
export const removeOperatorFromWorkCenter = (id, operatorId) => 
  client.delete(`/work-centers/${id}/operators/${operatorId}`).then(r => r.data)

// Get current job on work center
export const getCurrentJob = (id) => client.get(`/work-centers/${id}/current-job`).then(r => r.data)

// Get work center utilization
export const getUtilization = (id, params) => 
  client.get(`/work-centers/${id}/utilization`, { params }).then(r => r.data)

// Get maintenance schedule
export const getMaintenanceSchedule = (id) => 
  client.get(`/work-centers/${id}/maintenance`).then(r => r.data)

// Schedule maintenance
export const scheduleMaintenance = (id, data) => 
  client.post(`/work-centers/${id}/maintenance`, data).then(r => r.data)

// Complete maintenance
export const completeMaintenance = (id, maintenanceId, notes) => 
  client.post(`/work-centers/${id}/maintenance/${maintenanceId}/complete`, { notes }).then(r => r.data)

// Get live status of all work centers
export const getLiveStatus = () => client.get('/work-centers/live-status').then(r => r.data)

export default {
  getWorkCenters,
  getWorkCenter,
  getWorkCentersByLocation,
  createWorkCenter,
  updateWorkCenter,
  deleteWorkCenter,
  getWorkCenterCapacity,
  setWorkCenterStatus,
  getWorkCenterSchedule,
  getAllSchedules,
  getWorkCenterQueue,
  reorderQueue,
  getWorkCenterMetrics,
  getDowntimeLogs,
  logDowntime,
  endDowntime,
  getCapabilities,
  updateCapabilities,
  getWorkCenterOperators,
  assignOperatorToWorkCenter,
  removeOperatorFromWorkCenter,
  getCurrentJob,
  getUtilization,
  getMaintenanceSchedule,
  scheduleMaintenance,
  completeMaintenance,
  getLiveStatus,
}
