import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// ============================================
// DEMO MODE - Set to false when database is ready
// ============================================
const DEMO_MODE = true

const DEMO_USER = {
  id: 1,
  email: 'admin@steelwise.com',
  name: 'Admin User',
  role: 'ADMIN',
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEMO_MODE ? DEMO_USER : null)
  const [token, setToken] = useState(() => DEMO_MODE ? 'demo-token' : localStorage.getItem('token'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load user on mount if token exists (skip in demo mode)
  useEffect(() => {
    if (DEMO_MODE) {
      setUser(DEMO_USER)
      setLoading(false)
      return
    }
    
    if (token) {
      fetchCurrentUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchCurrentUser = async () => {
    if (DEMO_MODE) {
      setUser(DEMO_USER)
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      const { apiClient } = await import('../api/client')
      const response = await apiClient.get('/auth/me')
      setUser(response.data.user)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch user:', err)
      // Token is invalid, clear it
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
      setError('Session expired. Please log in again.')
    } finally {
      setLoading(false)
    }
  }

  const login = useCallback(async (email, password) => {
    if (DEMO_MODE) {
      setUser(DEMO_USER)
      setToken('demo-token')
      localStorage.setItem('token', 'demo-token')
      return { success: true }
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const { apiClient } = await import('../api/client')
      const response = await apiClient.post('/auth/login', { email, password })
      const { token: newToken, user: userData } = response.data
      
      localStorage.setItem('token', newToken)
      setToken(newToken)
      setUser(userData)
      
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (userData) => {
    if (DEMO_MODE) {
      setUser(DEMO_USER)
      setToken('demo-token')
      return { success: true }
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const { apiClient } = await import('../api/client')
      const response = await apiClient.post('/auth/register', userData)
      const { token: newToken, user: newUser } = response.data
      
      localStorage.setItem('token', newToken)
      setToken(newToken)
      setUser(newUser)
      
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(DEMO_MODE ? DEMO_USER : null)
    setError(null)
  }, [])

  const updateProfile = useCallback(async (profileData) => {
    if (DEMO_MODE) {
      setUser({ ...DEMO_USER, ...profileData })
      return { success: true }
    }
    
    try {
      const { apiClient } = await import('../api/client')
      const response = await apiClient.put('/auth/profile', profileData)
      setUser(response.data.user)
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Update failed'
      return { success: false, error: message }
    }
  }, [])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (DEMO_MODE) {
      return { success: true }
    }
    
    try {
      const { apiClient } = await import('../api/client')
      await apiClient.put('/auth/password', { currentPassword, newPassword })
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Password change failed'
      return { success: false, error: message }
    }
  }, [])

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: DEMO_MODE ? true : !!user,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser: fetchCurrentUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default useAuth
