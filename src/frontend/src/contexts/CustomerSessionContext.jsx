/**
 * CustomerSessionContext — customer-facing session defaults.
 * Selected location, division, ship-to address. Persists to localStorage.
 */
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { getCustomerPreferences, buildSmartDefaults, summarizePreferences } from '../services/customerPreferencesApi'

const CustomerSessionContext = createContext(null)
const STORAGE_KEY = 'steelwise_customer_session'

const LOCATIONS = [
  { id: 'loc-1', name: 'Jackson', state: 'MI' },
  { id: 'loc-2', name: 'Detroit', state: 'MI' },
  { id: 'loc-3', name: 'Kalamazoo', state: 'MI' },
  { id: 'loc-4', name: 'Grand Rapids', state: 'MI' },
]

const DEFAULT_SESSION = {
  locationId: 'loc-1',
  locationName: 'Jackson',
  division: 'METALS',
  shipTo: null,
  customerId: 'cust-001',
  customerName: 'Acme Fabrication',
  accountType: 'ACCOUNT',
  priceLevel: 'CONTRACT_A',
  recentConfigs: [],
}

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_SESSION, ...JSON.parse(raw) } : DEFAULT_SESSION
  } catch { return DEFAULT_SESSION }
}

function persistSession(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

export function CustomerSessionProvider({ children }) {
  const [session, setSession] = useState(loadSession)

  useEffect(() => { persistSession(session) }, [session])

  const setLocation = useCallback((locId) => {
    const loc = LOCATIONS.find(l => l.id === locId)
    setSession(prev => ({ ...prev, locationId: locId, locationName: loc?.name || locId }))
  }, [])

  const setDivision = useCallback((div) => {
    setSession(prev => ({ ...prev, division: div }))
  }, [])

  const setShipTo = useCallback((addr) => {
    setSession(prev => ({ ...prev, shipTo: addr }))
  }, [])

  const addRecentConfig = useCallback((config) => {
    setSession(prev => {
      const recent = [config, ...prev.recentConfigs.filter(c => c.productId !== config.productId)].slice(0, 10)
      return { ...prev, recentConfigs: recent }
    })
  }, [])

  // ── Customer Preference Memory ──
  const [preferences, setPreferences] = useState(null)
  const [prefBadges, setPrefBadges] = useState([])

  useEffect(() => {
    if (!session.customerId) return
    getCustomerPreferences(session.customerId)
      .then(res => {
        if (res.hasPreferences) {
          setPreferences(res.data)
          setPrefBadges(summarizePreferences(res.data))
          // Apply soft defaults to session (only if not already customized)
          const defs = buildSmartDefaults(res.data)
          setSession(prev => {
            const updates = {}
            if (defs.location && prev.locationId === DEFAULT_SESSION.locationId) {
              const loc = LOCATIONS.find(l => l.name.toUpperCase().replace(/ /g, '_') === defs.location)
              if (loc) { updates.locationId = loc.id; updates.locationName = loc.name }
            }
            if (defs.division && prev.division === DEFAULT_SESSION.division) updates.division = defs.division
            return Object.keys(updates).length ? { ...prev, ...updates } : prev
          })
        }
      })
      .catch(() => { /* preferences are optional */ })
  }, [session.customerId])

  const value = useMemo(() => ({
    ...session, locations: LOCATIONS, preferences, prefBadges,
    setLocation, setDivision, setShipTo, addRecentConfig,
  }), [session, setLocation, setDivision, setShipTo, addRecentConfig, preferences, prefBadges])

  return <CustomerSessionContext.Provider value={value}>{children}</CustomerSessionContext.Provider>
}

export function useCustomerSession() {
  const ctx = useContext(CustomerSessionContext)
  if (!ctx) throw new Error('useCustomerSession must be used within CustomerSessionProvider')
  return ctx
}

export default CustomerSessionContext
