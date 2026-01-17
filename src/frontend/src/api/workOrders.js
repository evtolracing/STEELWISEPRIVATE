import client from './client'

export const getWorkOrders = (params) => client.get('/work-orders', { params }).then(r => r.data)

export const getWorkOrder = (id) => client.get(`/work-orders/${id}`).then(r => r.data)

export const createWorkOrder = (data) => client.post('/work-orders', data).then(r => r.data)

export const updateWorkOrder = (id, data) => client.put(`/work-orders/${id}`, data).then(r => r.data)

export const startWorkOrder = (id) => client.put(`/work-orders/${id}/start`).then(r => r.data)

export const completeWorkOrder = (id, data) => client.put(`/work-orders/${id}/complete`, data).then(r => r.data)

export const cancelWorkOrder = (id, reason) => client.put(`/work-orders/${id}/cancel`, { reason }).then(r => r.data)

export const getWorkOrderOutputs = (id) => client.get(`/work-orders/${id}/outputs`).then(r => r.data)

export const addWorkOrderOutput = (id, data) => client.post(`/work-orders/${id}/outputs`, data).then(r => r.data)

// Work Order Status
export const updateWorkOrderStatus = (id, status, mesStage) => 
  client.patch(`/work-orders/${id}/status`, { status, mesStage }).then(r => r.data)

export const pauseWorkOrder = (id, reason) => 
  client.patch(`/work-orders/${id}/status`, { status: 'PAUSED', reason }).then(r => r.data)

// Work Order Steps
export const getWorkOrderSteps = (id) => client.get(`/work-orders/${id}/steps`).then(r => r.data)

export const addWorkOrderStep = (id, data) => client.post(`/work-orders/${id}/steps`, data).then(r => r.data)

export const updateWorkOrderStep = (id, stepId, data) => 
  client.put(`/work-orders/${id}/steps/${stepId}`, data).then(r => r.data)

export const updateWorkOrderStepStatus = (id, stepId, data) => 
  client.patch(`/work-orders/${id}/steps/${stepId}/status`, data).then(r => r.data)

export default {
  getWorkOrders,
  getWorkOrder,
  createWorkOrder,
  updateWorkOrder,
  startWorkOrder,
  completeWorkOrder,
  cancelWorkOrder,
  getWorkOrderOutputs,
  addWorkOrderOutput,
}
