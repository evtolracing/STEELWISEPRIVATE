import client from './client'

export const getHeats = (params) => client.get('/heats', { params }).then(r => r.data)

export const getHeat = (id) => client.get(`/heats/${id}`).then(r => r.data)

export const createHeat = (data) => client.post('/heats', data).then(r => r.data)

export const updateHeat = (id, data) => client.put(`/heats/${id}`, data).then(r => r.data)

export const traceHeat = (heatNumber) => client.get(`/heats/${heatNumber}/trace`).then(r => r.data)

export default {
  getHeats,
  getHeat,
  createHeat,
  updateHeat,
  traceHeat,
}
