import client from './client'

export const getAssets = (params) =>
  client.get('/assets', { params }).then(r => r.data)

export const getAssetStats = () =>
  client.get('/assets/stats').then(r => r.data)

export const getAssetTypes = () =>
  client.get('/assets/types').then(r => r.data)

export const getAsset = (id) =>
  client.get(`/assets/${id}`).then(r => r.data)

export const createAsset = (data) =>
  client.post('/assets', data).then(r => r.data)

export const updateAsset = (id, data) =>
  client.patch(`/assets/${id}`, data).then(r => r.data)

export const deleteAsset = (id) =>
  client.delete(`/assets/${id}`).then(r => r.data)

export const seedAssetsFromWorkCenters = () =>
  client.post('/assets/seed-from-work-centers').then(r => r.data)
