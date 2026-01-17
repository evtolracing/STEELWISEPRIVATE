// API Module Exports
export { default as client } from './client'
export * from './heats'
export * from './units'
export * from './workOrders'
export * from './inventory'
export * from './pricing'
export * from './logistics'
export * from './provenance'

// Dashboard API
import client from './client'

export const getDashboard = () => client.get('/dashboard').then(r => r.data)
export const getKPIs = () => client.get('/dashboard/kpis').then(r => r.data)

// Orders API
export const getOrders = (params) => client.get('/orders', { params }).then(r => r.data)
export const getOrder = (id) => client.get(`/orders/${id}`).then(r => r.data)
export const createOrder = (data) => client.post('/orders', data).then(r => r.data)
export const updateOrder = (id, data) => client.put(`/orders/${id}`, data).then(r => r.data)
export const allocateOrder = (id, data) => client.post(`/orders/${id}/allocate`, data).then(r => r.data)

// Grades API
export const getGrades = () => client.get('/grades').then(r => r.data)
export const getGrade = (id) => client.get(`/grades/${id}`).then(r => r.data)
export const createGrade = (data) => client.post('/grades', data).then(r => r.data)

// Products API
export const getProducts = () => client.get('/products').then(r => r.data)
export const getProduct = (id) => client.get(`/products/${id}`).then(r => r.data)
export const createProduct = (data) => client.post('/products', data).then(r => r.data)
