import { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

/**
 * The branches the signed-in person may sell from, from the server, and their home branch
 * (S-008, U-011). The order entry and Retail POS screens list these instead of a fixed list.
 *   { branches: [{ id, code, name, city, state }], homeCode, loading, error }
 */
export default function useSellingBranches() {
  const [state, setState] = useState({ branches: [], homeCode: '', loading: true, error: null })
  useEffect(() => {
    let live = true
    fetch(`${API_BASE}/orders/intake/branches`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('The branches could not be loaded'))))
      .then((body) => {
        if (!live) return
        const branches = Array.isArray(body.data) ? body.data : []
        const home = branches.find((b) => b.id === body.homeLocationId) || branches[0]
        setState({ branches, homeCode: home?.code || '', loading: false, error: null })
      })
      .catch((error) => { if (live) setState({ branches: [], homeCode: '', loading: false, error: error.message }) })
    return () => { live = false }
  }, [])
  return state
}

/** The branch code a saved value (a code, a city such as "GRAND_RAPIDS", or an id) stands for, or ''. */
export function branchCodeFor(branches, value) {
  if (!value) return ''
  const key = String(value).trim().toUpperCase().replace(/_/g, ' ')
  const hit = branches.find((b) => b.id === value || b.code.toUpperCase() === key || (b.city || '').toUpperCase() === key || (b.name || '').toUpperCase().startsWith(key))
  return hit ? hit.code : ''
}
