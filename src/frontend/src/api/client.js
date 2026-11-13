import axios from 'axios'
import { needsRequestKey, requestKeyFor } from './requestKey'

// No request waits for ever. A request that gets no answer in this time fails with a message
// the screen can show, and a request that created something keeps its key so that sending it
// again cannot create it twice.
export const REQUEST_TIMEOUT_MS = 60_000

const client = axios.create({
  baseURL: '/api',
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
})

/** A sentence for the person at the screen, for a failure that carries no answer from the server. */
export function connectionMessage(error) {
  if (error?.response) return null
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT' || /timeout/i.test(error?.message || '')) {
    return 'The server took too long to answer. Check the list before sending this again: it may have been saved.'
  }
  if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return 'The connection was lost. Check the list before sending this again: it may have been saved.'
  }
  return null
}

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
    // Screens show `error.response.data.error`. When there is no answer at all, give them the
    // same shape with a plain sentence, so nothing shows a blank or a raw "Network Error".
    const lost = connectionMessage(error)
    if (lost) {
      error.userMessage = lost
      error.response = { status: 0, data: { error: lost }, headers: {}, config: error.config }
    }
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
