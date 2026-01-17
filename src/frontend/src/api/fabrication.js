import client from './client'

// Fabrication Work Orders API
export const getFabricationWorkOrders = (params) => client.get('/fabrication-work-orders', { params }).then(r => r.data)

export const getFabricationWorkOrder = (id) => client.get(`/fabrication-work-orders/${id}`).then(r => r.data)

export const createFabricationWorkOrder = (data) => client.post('/fabrication-work-orders', data).then(r => r.data)

export const updateFabricationWorkOrder = (id, data) => client.put(`/fabrication-work-orders/${id}`, data).then(r => r.data)

export const deleteFabricationWorkOrder = (id) => client.delete(`/fabrication-work-orders/${id}`).then(r => r.data)

export const startFabricationWorkOrder = (id) => 
  client.patch(`/fabrication-work-orders/${id}/status`, { status: 'IN_PROGRESS' }).then(r => r.data)

export const completeFabricationWorkOrder = (id, data) => 
  client.patch(`/fabrication-work-orders/${id}/status`, { status: 'COMPLETED', ...data }).then(r => r.data)

export const cancelFabricationWorkOrder = (id, reason) => 
  client.patch(`/fabrication-work-orders/${id}/status`, { status: 'CANCELLED', reason }).then(r => r.data)

export const getFabricationOutputs = (id) => client.get(`/fabrication-work-orders/${id}/outputs`).then(r => r.data)

export const addFabricationOutput = (id, data) => client.post(`/fabrication-work-orders/${id}/outputs`, data).then(r => r.data)

export const getFabricationMaterials = (id) => client.get(`/fabrication-work-orders/${id}/materials`).then(r => r.data)

export default {
  getFabricationWorkOrders,
  getFabricationWorkOrder,
  createFabricationWorkOrder,
  updateFabricationWorkOrder,
  deleteFabricationWorkOrder,
  startFabricationWorkOrder,
  completeFabricationWorkOrder,
  cancelFabricationWorkOrder,
  getFabricationOutputs,
  addFabricationOutput,
  getFabricationMaterials,
}
