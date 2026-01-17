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
