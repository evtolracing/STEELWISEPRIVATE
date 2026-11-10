import axios from 'axios'

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
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
client.interceptors.response.use(
  (response) => response,
  (error) => {
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
