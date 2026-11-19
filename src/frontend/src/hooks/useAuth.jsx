import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// ============================================
// DEMO MODE - skips login and signs everyone in as a demo admin.
// Off unless the build sets VITE_DEMO_MODE=true. Never enable it on a
// deployment that holds real data.
// ============================================
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

const DEMO_USER = {
  id: 1,
  email: 'admin@steelwise.com',
  name: 'Admin User',
  role: 'ADMIN',
}

const AuthContext = createContext(null)

// The branch picked in the top bar and an administrator's role preview. The API client sends both
// with every request (api/client.js); the server decides what they may narrow (lib/viewScope.js).
export const VIEW_KEYS = { branch: 'sw.branchId', viewAs: 'sw.viewAsRole' }
const readView = (key) => { try { return localStorage.getItem(key) || '' } catch { return '' } }
const writeView = (key, value) => {
  try { if (value) localStorage.setItem(key, value); else localStorage.removeItem(key) } catch { /* private mode */ }
}
const clearView = () => { writeView(VIEW_KEYS.branch, ''); writeView(VIEW_KEYS.viewAs, '') }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEMO_MODE ? DEMO_USER : null)
  const [token, setToken] = useState(() => DEMO_MODE ? 'demo-token' : localStorage.getItem('token'))
  // Start loading when a saved token exists, so a page refresh waits for /auth/me
  // instead of bouncing to the login page.
  const [loading, setLoading] = useState(() => !DEMO_MODE && !!localStorage.getItem('token'))
  const [error, setError] = useState(null)
  // Changes whenever the branch or the previewed role changes, so the screens load again.
  const [viewVersion, setViewVersion] = useState(0)

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
      // /auth/me returns the user itself
      setUser(response.data?.user || response.data)
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
      
 // A new sign-in starts in the person's own view: no branch or preview carried over from the last one.
      clearView()
      const { apiClient } = await import('../api/client')
      const response = await apiClient.post('/auth/login', { email, password })
      const { token: newToken } = response.data
      
      localStorage.setItem('token', newToken)
      setToken(newToken)
      // /auth/me also says which branches the person may pick and whether they may preview roles.
      const me = await apiClient.get('/auth/me')
      setUser(me.data?.user || me.data)
      
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || 'Login failed'
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
      const message = err.response?.data?.error || err.response?.data?.message || 'Registration failed'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    clearView()
    setToken(null)
    setUser(DEMO_MODE ? DEMO_USER : null)
    setError(null)
  }, [])

  // Ends every sign-in of this login on every device, this one included, then shows the sign-in page.
  const logoutEverywhere = useCallback(async () => {
    if (!DEMO_MODE) {
      const { apiClient } = await import('../api/client')
      await apiClient.post('/auth/logout-all').catch(() => {})
    }
    logout()
  }, [logout])

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
      const message = err.response?.data?.error || err.response?.data?.message || 'Update failed'
      return { success: false, error: message }
    }
  }, [])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (DEMO_MODE) {
      return { success: true }
    }
    
    try {
      const { apiClient } = await import('../api/client')
      const response = await apiClient.put('/auth/password', { currentPassword, newPassword })
      // A password change ends every other sign-in of this login; this one carries on with the new token.
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token)
        setToken(response.data.token)
      }
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || 'Password change failed'
      return { success: false, error: message }
    }
  }, [])

  // Picks the branch to work in ('' = every branch the person may see) and reloads the screens.
  const setBranch = useCallback(async (branchId) => {
    writeView(VIEW_KEYS.branch, branchId)
    await fetchCurrentUser()
    setViewVersion((v) => v + 1)
  }, [])

  // An administrator previews what another role sees ('' ends the preview). View-only.
  const setViewAsRole = useCallback(async (role) => {
    writeView(VIEW_KEYS.viewAs, role)
    await fetchCurrentUser()
    setViewVersion((v) => v + 1)
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
    logoutEverywhere,
    updateProfile,
    changePassword,
    refreshUser: fetchCurrentUser,
    // The person's own role, also while previewing another one.
    realRole: user?.realRole || user?.role || null,
    previewRole: user?.previewRole || null,
    branchId: user?.branchId || '',
    viewVersion,
    setBranch,
    setViewAsRole,
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
