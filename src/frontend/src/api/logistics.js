import client from './client'

export const getShipments = (params) => client.get('/shipments', { params }).then(r => r.data)

export const getShipment = (id) => client.get(`/shipments/${id}`).then(r => r.data)

export const createShipment = (data) => client.post('/shipments', data).then(r => r.data)

export const updateShipment = (id, data) => client.put(`/shipments/${id}`, data).then(r => r.data)

export const dispatchShipment = (id, data) => client.put(`/shipments/${id}/dispatch`, data).then(r => r.data)

export const deliverShipment = (id, data) => client.put(`/shipments/${id}/deliver`, data).then(r => r.data)

export const getShipmentItems = (id) => client.get(`/shipments/${id}/items`).then(r => r.data)

export const addShipmentItem = (id, data) => client.post(`/shipments/${id}/items`, data).then(r => r.data)

export const removeShipmentItem = (id, itemId) => client.delete(`/shipments/${id}/items/${itemId}`).then(r => r.data)

export const getCarriers = () => client.get('/logistics/carriers').then(r => r.data)

export const getRoutes = (params) => client.get('/logistics/routes', { params }).then(r => r.data)

export const calculateRoute = (data) => client.post('/logistics/routes/calculate', data).then(r => r.data)

export const getShipmentTracking = (id) => client.get(`/shipments/${id}/tracking`).then(r => r.data)

export default {
  getShipments,
  getShipment,
  createShipment,
  updateShipment,
  dispatchShipment,
  deliverShipment,
  getShipmentItems,
  addShipmentItem,
  removeShipmentItem,
  getCarriers,
  getRoutes,
  calculateRoute,
  getShipmentTracking,
}
