import client from './client'

// Bill of Materials (BOM) API
export const getBOMs = (params) => client.get('/boms', { params }).then(r => r.data)

export const getBOM = (id) => client.get(`/boms/${id}`).then(r => r.data)

export const getBOMBySku = (sku) => client.get('/boms', { params: { sku } }).then(r => r.data)

export const createBOM = (data) => client.post('/boms', data).then(r => r.data)

export const updateBOM = (id, data) => client.put(`/boms/${id}`, data).then(r => r.data)

export const deleteBOM = (id) => client.delete(`/boms/${id}`).then(r => r.data)

export const getBOMItems = (id) => client.get(`/boms/${id}/items`).then(r => r.data)

export const addBOMItem = (id, data) => client.post(`/boms/${id}/items`, data).then(r => r.data)

export const updateBOMItem = (id, itemId, data) => client.put(`/boms/${id}/items/${itemId}`, data).then(r => r.data)

export const removeBOMItem = (id, itemId) => client.delete(`/boms/${id}/items/${itemId}`).then(r => r.data)

export const getBOMVersions = (id) => client.get(`/boms/${id}/versions`).then(r => r.data)

export const createBOMVersion = (id, data) => client.post(`/boms/${id}/versions`, data).then(r => r.data)

export default {
  getBOMs,
  getBOM,
  getBOMBySku,
  createBOM,
  updateBOM,
  deleteBOM,
  getBOMItems,
  addBOMItem,
  updateBOMItem,
  removeBOMItem,
  getBOMVersions,
  createBOMVersion,
}
