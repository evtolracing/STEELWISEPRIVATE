/**
 * Every API route needs the sign-in token. Most services call fetch()
 * directly, so this wraps window.fetch once: requests to our own /api get the
 * Bearer token from localStorage, and a 401 (an expired or missing session)
 * sends the user back to the login page, like the axios client does.
 */
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

function isApiRequest(url) {
  try {
    const u = new URL(url, window.location.origin)
    if (u.origin === window.location.origin && u.pathname.startsWith('/api')) return true
    return /^https?:/.test(API_URL) && u.href.startsWith(API_URL)
  } catch {
    return false
  }
}

const isCredentialCheck = (url) => /\/auth\/(login|password)/.test(url)

if (typeof window !== 'undefined' && window.fetch && !window.fetch.__steelwiseAuth) {
  const originalFetch = window.fetch.bind(window)
  const authFetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input?.url
    if (!url || !isApiRequest(url)) return originalFetch(input, init)

    let options = init
    const token = localStorage.getItem('token')
    if (token) {
      const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined))
      if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)
      options = { ...init, headers }
    }

    const res = await originalFetch(input, options)
    if (res.status === 401 && !isCredentialCheck(url) && window.location.pathname !== '/login') {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return res
  }
  authFetch.__steelwiseAuth = true
  window.fetch = authFetch
}
