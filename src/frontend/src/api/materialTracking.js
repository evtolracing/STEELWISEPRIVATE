import client from './client'

// ─── Material Tracking API ──────────────────────────────────────────────────

// Dashboard stats
export const getTrackingStats = () =>
  client.get('/material-tracking/stats').then(r => r.data)

// ─── Custody / Traceability Log ─────────────────────────────────────────────

export const getCustodyLog = (params) =>
  client.get('/material-tracking/custody-log', { params }).then(r => r.data)

export const createCustodyEntry = (data) =>
  client.post('/material-tracking/custody-log', data).then(r => r.data)

// ─── Job Timeline / Tags / Packages ────────────────────────────────────────

export const getJobTimeline = (jobId) =>
  client.get(`/material-tracking/jobs/${jobId}/timeline`).then(r => r.data)

export const getJobTags = (jobId) =>
  client.get(`/material-tracking/jobs/${jobId}/tags`).then(r => r.data)

export const getJobPackages = (jobId) =>
  client.get(`/material-tracking/jobs/${jobId}/packages`).then(r => r.data)

// ─── Staging / Loading ─────────────────────────────────────────────────────

export const getStagingData = () =>
  client.get('/material-tracking/staging').then(r => r.data)

export const shipJob = (jobId, data) =>
  client.patch(`/material-tracking/staging/${jobId}/ship`, data).then(r => r.data)

// ─── Drop Tags (proxied to existing drop-tags API) ────────────────────────

export const getDropTags = (params) =>
  client.get('/drop-tags', { params }).then(r => r.data)

export const getDropTag = (id) =>
  client.get(`/drop-tags/${id}`).then(r => r.data)

export const generateDropTag = (data) =>
  client.post('/drop-tags', data).then(r => r.data)

export const printDropTag = (id, data) =>
  client.post(`/drop-tags/${id}/print`, data).then(r => r.data)

export const applyDropTag = (id, data) =>
  client.post(`/drop-tags/${id}/apply`, data).then(r => r.data)

export const voidDropTag = (id, data) =>
  client.post(`/drop-tags/${id}/void`, data).then(r => r.data)

export const getTagsReadyToPrint = () =>
  client.get('/drop-tags/ready-to-print').then(r => r.data)

// ─── Packages ──────────────────────────────────────────────────────────────

export const createPackage = (data) =>
  client.post('/drop-tags/packages', data).then(r => r.data)

export const getPackagesReady = () =>
  client.get('/drop-tags/packages/ready').then(r => r.data)

export const sealPackage = (id, data) =>
  client.post(`/drop-tags/packages/${id}/seal`, data).then(r => r.data)

export const qcReleasePackage = (id, data) =>
  client.post(`/drop-tags/packages/${id}/qc-release`, data).then(r => r.data)

// ─── Scan ──────────────────────────────────────────────────────────────────

export const processScan = (data) =>
  client.post('/drop-tags/scans', data).then(r => r.data)
