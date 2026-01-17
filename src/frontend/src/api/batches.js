import client from './client'

export const getBatches = (params) => client.get('/batches', { params }).then(r => r.data)

export const getBatch = (id) => client.get(`/batches/${id}`).then(r => r.data)

export const getBatchesByHeat = (heatId) => client.get('/batches', { params: { heatId } }).then(r => r.data)

export const createBatch = (data) => client.post('/batches', data).then(r => r.data)

export const updateBatch = (id, data) => client.put(`/batches/${id}`, data).then(r => r.data)

export const deleteBatch = (id) => client.delete(`/batches/${id}`).then(r => r.data)

export default {
  getBatches,
  getBatch,
  getBatchesByHeat,
  createBatch,
  updateBatch,
  deleteBatch,
}
