import client from './client'

export const getMaintenanceOrders = (params) =>
  client.get('/maintenance-orders', { params }).then(r => r.data)

export const getMaintenanceOrderStats = () =>
  client.get('/maintenance-orders/stats').then(r => r.data)

export const getMaintenanceOrder = (id) =>
  client.get(`/maintenance-orders/${id}`).then(r => r.data)

export const createMaintenanceOrder = (data) =>
  client.post('/maintenance-orders', data).then(r => r.data)

export const updateMaintenanceOrder = (id, data) =>
  client.patch(`/maintenance-orders/${id}`, data).then(r => r.data)

export const startMaintenanceOrder = (id) =>
  client.put(`/maintenance-orders/${id}/start`).then(r => r.data)

export const completeMaintenanceOrder = (id, data) =>
  client.put(`/maintenance-orders/${id}/complete`, data).then(r => r.data)

export const cancelMaintenanceOrder = (id) =>
  client.delete(`/maintenance-orders/${id}`).then(r => r.data)

export const getMaintenanceAssets = () =>
  client.get('/maintenance-orders/assets/list').then(r => r.data)
