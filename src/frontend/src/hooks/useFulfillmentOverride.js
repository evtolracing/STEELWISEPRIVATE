/**
 * useFulfillmentOverride — Hook to log when a user overrides the recommended branch.
 *
 * Stores a local audit trail (and can POST to backend when ready).
 * Returns { overrides, logOverride, lastOverride }.
 */
import { useState, useCallback, useRef } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const USE_MOCK = window.__USE_MOCK_RULES__ !== false

/**
 * @param {string} context - 'CSR_INTAKE' | 'ECOMMERCE_CHECKOUT' | 'POS'
 */
export default function useFulfillmentOverride(context = 'UNKNOWN') {
  const [overrides, setOverrides] = useState([])
  const seqRef = useRef(0)

  /**
   * Log an override event.
   * @param {Object} params
   * @param {string} params.recommendedLocationId
   * @param {string} params.recommendedLocationName
   * @param {string} params.selectedLocationId
   * @param {string} params.selectedLocationName
   * @param {string} [params.reason] - user-supplied reason
   * @param {number} [params.recommendedScore]
   * @param {number} [params.selectedScore]
   * @param {Object} [params.meta] - extra data (orderId, division, etc.)
   */
  const logOverride = useCallback(async (params) => {
    const entry = {
      id: `ovr-${++seqRef.current}-${Date.now()}`,
      context,
      timestamp: new Date().toISOString(),
      ...params,
    }

    setOverrides(prev => [...prev, entry])

    // Persist to backend (fire-and-forget)
    if (!USE_MOCK) {
      try {
        await fetch(`${API_BASE}/v1/fulfillment/overrides`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        })
      } catch {
        // swallow — non-critical
      }
    } else {
      // eslint-disable-next-line no-console
      console.info('[FulfillmentOverride]', entry)
    }

    return entry
  }, [context])

  const lastOverride = overrides.length > 0 ? overrides[overrides.length - 1] : null

  return { overrides, logOverride, lastOverride }
}
