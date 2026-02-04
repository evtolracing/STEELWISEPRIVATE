import client from './client'

export const getInventory = (params) => client.get('/inventory', { params }).then(r => r.data)

export const getInventorySummary = () => client.get('/inventory/summary').then(r => r.data)

export const getLocations = () => client.get('/inventory/locations').then(r => r.data)

export const getLocation = (id) => client.get(`/inventory/locations/${id}`).then(r => r.data)

export const createLocation = (data) => client.post('/inventory/locations', data).then(r => r.data)

export const receiveInventory = (data) => client.post('/inventory/receive', data).then(r => r.data)

export const transferInventory = (data) => client.post('/inventory/transfer', data).then(r => r.data)

export const adjustInventory = (data) => client.post('/inventory/adjust', data).then(r => r.data)

export const getMovements = (params) => client.get('/inventory/movements', { params }).then(r => r.data)

export const getStockByLocation = (locationId) => client.get(`/inventory/locations/${locationId}/stock`).then(r => r.data)

// Inventory by Location (aggregated view)
export const getInventoryByLocation = (locationId, params) => 
  client.get('/inventory', { params: { locationId, ...params } }).then(r => r.data)

// Inventory Aggregation
export const getInventoryAggregation = (params) => client.get('/inventory/aggregate', { params }).then(r => r.data)

// Bulk Upload
export const bulkUploadInventory = (data) => client.post('/inventory/bulk-upload', data).then(r => r.data)

// Get template URL
export const getTemplateUrl = (type) => `/api/inventory/templates/${type}`

export default {
  getInventory,
  getInventorySummary,
  getLocations,
  getLocation,
  createLocation,
  receiveInventory,
  transferInventory,
  adjustInventory,
  getMovements,
  getStockByLocation,
  getInventoryByLocation,
  getInventoryAggregation,
  bulkUploadInventory,
  getTemplateUrl,
}
