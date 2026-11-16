// API Module Exports
export { default as client } from './client'
export * from './heats'
export * from './units'
export * from './workOrders'
export * from './inventory'
export * from './pricing'
export * from './logistics'
export * from './provenance'
export * from './workCenters'
export * from './fabrication'
export * from './qaqc'
export * from './jobs'
export * from './users'
export * from './documents'
export * from './staff'

// Dashboard API
import client from './client'

export const getDashboard = () => client.get('/dashboard').then(r => r.data)
export const getKPIs = () => client.get('/dashboard/kpis').then(r => r.data)
export const getDashboardStats = () => client.get('/dashboard').then(r => r.data)
export const getRecentOrders = (params) => client.get('/orders', { params }).then(r => r.data)

// Orders API
export const getOrders = (params) => client.get('/orders', { params }).then(r => r.data)
export const getOrder = (id) => client.get(`/orders/${id}`).then(r => r.data)
export const createOrder = (data) => client.post('/orders', data).then(r => r.data)
// An edit says which saved version of the order it was made from (the order's updatedAt as it was
// read). If someone else has saved since, the server answers 409 STALE_EDIT instead of overwriting (G-020).
export const updateOrder = (id, data, readAt) => client.put(`/orders/${id}`, readAt ? { ...data, expectedUpdatedAt: readAt } : data).then(r => r.data)
export const allocateOrder = (id, data) => client.post(`/orders/${id}/allocate`, data).then(r => r.data)
// A status change is a PUT with { status } (routes/orders.js); the PATCH /status helpers that were here had no route (S-026).

// Grades API
export const getGrades = () => client.get('/grades').then(r => r.data)
export const getGrade = (id) => client.get(`/grades/${id}`).then(r => r.data)
export const createGrade = (data) => client.post('/grades', data).then(r => r.data)

// Products API
export const getProducts = () => client.get('/products').then(r => r.data)
export const getProduct = (id) => client.get(`/products/${id}`).then(r => r.data)
export const createProduct = (data) => client.post('/products', data).then(r => r.data)
