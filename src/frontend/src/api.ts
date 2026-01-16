import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Dashboard
export const getDashboard = () => api.get('/dashboard').then(r => r.data)
export const getKPIs = () => api.get('/dashboard/kpis').then(r => r.data)

// Inventory
export const getInventory = (params?: any) => api.get('/inventory', { params }).then(r => r.data)
export const getInventorySummary = () => api.get('/inventory/summary').then(r => r.data)
export const receiveInventory = (data: any) => api.post('/inventory/receive', data).then(r => r.data)
export const transferInventory = (data: any) => api.post('/inventory/transfer', data).then(r => r.data)
export const getLocations = () => api.get('/inventory/locations').then(r => r.data)

// Coils
export const getCoils = (params?: any) => api.get('/coils', { params }).then(r => r.data)
export const getCoil = (id: string) => api.get(`/coils/${id}`).then(r => r.data)
export const getCoilByNumber = (num: string) => api.get(`/coils/number/${num}`).then(r => r.data)
export const createCoil = (data: any) => api.post('/coils', data).then(r => r.data)
export const updateCoil = (id: string, data: any) => api.put(`/coils/${id}`, data).then(r => r.data)
export const placeHold = (id: string, data: any) => api.post(`/coils/${id}/hold`, data).then(r => r.data)

// Heats
export const getHeats = (params?: any) => api.get('/heats', { params }).then(r => r.data)
export const getHeat = (id: string) => api.get(`/heats/${id}`).then(r => r.data)
export const traceHeat = (heatNumber: string) => api.get(`/heats/${heatNumber}/trace`).then(r => r.data)

// Orders
export const getOrders = (params?: any) => api.get('/orders', { params }).then(r => r.data)
export const getOrder = (id: string) => api.get(`/orders/${id}`).then(r => r.data)
export const createOrder = (data: any) => api.post('/orders', data).then(r => r.data)
export const updateOrder = (id: string, data: any) => api.put(`/orders/${id}`, data).then(r => r.data)
export const allocateOrder = (id: string, data: any) => api.post(`/orders/${id}/allocate`, data).then(r => r.data)

// Work Orders
export const getWorkOrders = (params?: any) => api.get('/work-orders', { params }).then(r => r.data)
export const getWorkOrder = (id: string) => api.get(`/work-orders/${id}`).then(r => r.data)
export const createWorkOrder = (data: any) => api.post('/work-orders', data).then(r => r.data)
export const startWorkOrder = (id: string) => api.put(`/work-orders/${id}/start`).then(r => r.data)
export const completeWorkOrder = (id: string, data: any) => api.put(`/work-orders/${id}/complete`, data).then(r => r.data)

// Shipments
export const getShipments = (params?: any) => api.get('/shipments', { params }).then(r => r.data)
export const getShipment = (id: string) => api.get(`/shipments/${id}`).then(r => r.data)
export const createShipment = (data: any) => api.post('/shipments', data).then(r => r.data)
export const dispatchShipment = (id: string, data: any) => api.put(`/shipments/${id}/dispatch`, data).then(r => r.data)
export const deliverShipment = (id: string, data: any) => api.put(`/shipments/${id}/deliver`, data).then(r => r.data)

// Grades & Products
export const getGrades = () => api.get('/grades').then(r => r.data)
export const getProducts = () => api.get('/products').then(r => r.data)

export default api
