import client from './client'

// ── QC Queue ────────────────────────────────────────────────────────────────
export const getQCQueue = () =>
  client.get('/qc/queue').then(r => r.data)

// ── QC Stats ────────────────────────────────────────────────────────────────
export const getQCStats = () =>
  client.get('/qc/stats').then(r => r.data)

// ── Inspections CRUD ────────────────────────────────────────────────────────
export const getInspections = (params) =>
  client.get('/qc/inspections', { params }).then(r => r.data)

export const getInspection = (id) =>
  client.get(`/qc/inspections/${id}`).then(r => r.data)

export const createInspection = (data) =>
  client.post('/qc/inspections', data).then(r => r.data)

export const updateInspection = (id, data) =>
  client.patch(`/qc/inspections/${id}`, data).then(r => r.data)

// ── Inspection Actions ──────────────────────────────────────────────────────
export const passInspection = (id, data = {}) =>
  client.post(`/qc/inspections/${id}/pass`, data).then(r => r.data)

export const failInspection = (id, data = {}) =>
  client.post(`/qc/inspections/${id}/fail`, data).then(r => r.data)

export const reworkInspection = (id, data = {}) =>
  client.post(`/qc/inspections/${id}/rework`, data).then(r => r.data)

export const conditionalPassInspection = (id, data = {}) =>
  client.post(`/qc/inspections/${id}/conditional`, data).then(r => r.data)

// ── Inspectors ──────────────────────────────────────────────────────────────
export const getInspectors = () =>
  client.get('/qc/inspectors').then(r => r.data)
