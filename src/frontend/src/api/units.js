import client from './client'

// Units are the primary inventory items (coils, sheets, blanks, etc.)
export const getUnits = (params) => client.get('/coils', { params }).then(r => r.data)

export const getUnit = (id) => client.get(`/coils/${id}`).then(r => r.data)

export const getUnitByNumber = (unitNumber) => client.get(`/coils/number/${unitNumber}`).then(r => r.data)

export const createUnit = (data) => client.post('/coils', data).then(r => r.data)

export const updateUnit = (id, data) => client.put(`/coils/${id}`, data).then(r => r.data)

export const placeHold = (id, data) => client.post(`/coils/${id}/hold`, data).then(r => r.data)

export const releaseHold = (id) => client.post(`/coils/${id}/release`).then(r => r.data)

export const getUnitHistory = (id) => client.get(`/coils/${id}/history`).then(r => r.data)

export const getUnitGenealogy = (id) => client.get(`/coils/${id}/genealogy`).then(r => r.data)

export default {
  getUnits,
  getUnit,
  getUnitByNumber,
  createUnit,
  updateUnit,
  placeHold,
  releaseHold,
  getUnitHistory,
  getUnitGenealogy,
}
