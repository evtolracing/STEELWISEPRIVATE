import axios from 'axios'
import { needsRequestKey, requestKeyFor } from './requestKey'

const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // A request that creates a business document carries a key, so a repeat is not run twice.
    const path = `/api${config.url?.startsWith('/') ? '' : '/'}${config.url || ''}`
    if (needsRequestKey(config.method, path) && !config.headers['Idempotency-Key']) {
      config.requestKey = requestKeyFor(String(config.method).toUpperCase(), path, config.data ?? null)
      config.headers['Idempotency-Key'] = config.requestKey.key
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
client.interceptors.response.use(
  (response) => {
    response.config?.requestKey?.settle(true, true)
    return response
  },
  (error) => {
    const status = error.response?.status
    error.config?.requestKey?.settle(Boolean(status) && status < 500 && status !== 409, false)
    // An expired or invalid session sends the user back to the login page.
    // A failed login or password check is a normal 401 and is shown on the
    // form instead.
    const url = error.config?.url || ''
    const isCredentialCheck = url.includes('/auth/login') || url.includes('/auth/password')
    if (error.response?.status === 401 && !isCredentialCheck && window.location.pathname !== '/login') {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export { client as apiClient }
export default client
