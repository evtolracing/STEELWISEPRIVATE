/**
 * CustomerSessionContext — customer-facing session defaults.
 * Selected location, division, ship-to address. Persists to localStorage.
 */
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { getCustomerPreferences, buildSmartDefaults, summarizePreferences } from '../services/customerPreferencesApi'
import { getStoreBranches } from '../services/cutoffRulesApi'
import { useAuth } from '../hooks/useAuth'

const CustomerSessionContext = createContext(null)
const STORAGE_KEY = 'steelwise_customer_session'

const DEFAULT_SESSION = {
  // Filled from the branches the store sells from, once they load.
  locationId: null,
  locationName: '',
  division: 'METALS',
  shipTo: null,
  customerId: 'ACME', // organization code or id; demo account until customer logins exist
  customerName: 'Acme Manufacturing',
  accountType: 'ACCOUNT',
  priceLevel: 'CONTRACT_A',
  recentConfigs: [],
}

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SESSION
    const saved = JSON.parse(raw)
    // Sessions saved before the store used real accounts point at a placeholder customer.
    if (saved.customerId === 'cust-001') { saved.customerId = DEFAULT_SESSION.customerId; saved.customerName = DEFAULT_SESSION.customerName }
    // Sessions saved while the store listed four made-up locations.
    if (/^loc-\d+$/.test(String(saved.locationId || ''))) { saved.locationId = null; saved.locationName = '' }
    return { ...DEFAULT_SESSION, ...saved }
  } catch { return DEFAULT_SESSION }
}

function persistSession(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

export function CustomerSessionProvider({ children }) {
  const [session, setSession] = useState(loadSession)
  const { user } = useAuth()

  // A customer login always shops as its own account (the server enforces this too).
  const linkedCustomer = String(user?.role || '').startsWith('CUSTOMER_') ? user?.customer || null : null
  useEffect(() => {
    if (!linkedCustomer) return
    setSession(prev => (prev.customerId === linkedCustomer.id ? prev
      : { ...prev, customerId: linkedCustomer.id, customerName: linkedCustomer.name, shipTo: null, recentConfigs: [] }))
  }, [linkedCustomer?.id, linkedCustomer?.name])

  useEffect(() => { persistSession(session) }, [session])

  // The branches the store sells from, from the server. Asked for once someone is signed in.
  const [locations, setLocations] = useState([])
  const userId = user?.id
  const homeLocationId = user?.homeLocationId
  useEffect(() => {
    if (!userId) return
    let live = true
    getStoreBranches().then((res) => { if (live) setLocations(res.data || []) }).catch(() => { if (live) setLocations([]) })
    return () => { live = false }
  }, [userId])
  // A session with no branch, or with one that is no longer sold from, takes the person's home branch or the first.
  useEffect(() => {
    if (!locations.length) return
    setSession(prev => {
      const current = locations.find(l => l.id === prev.locationId)
      if (current) return current.name === prev.locationName ? prev : { ...prev, locationName: current.name }
      const pick = locations.find(l => l.id === homeLocationId) || locations[0]
      return { ...prev, locationId: pick.id, locationName: pick.name }
    })
  }, [locations, homeLocationId])

  const setLocation = useCallback((locId) => {
    const loc = locations.find(l => l.id === locId)
    if (!loc) return
    setSession(prev => ({ ...prev, locationId: loc.id, locationName: loc.name }))
  }, [locations])

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

  // Asked for only by the web shop (see useCustomerSession). It used to be asked on every staff screen,
  // although no staff screen reads it.
  const [wanted, setWanted] = useState(false)
  const loadPreferences = useCallback(() => setWanted(true), [])
  useEffect(() => {
    if (!wanted || !session.customerId) return
    getCustomerPreferences(session.customerId)
      .then(res => {
        if (res.hasPreferences) {
          setPreferences(res.data)
          setPrefBadges(summarizePreferences(res.data))
          // Apply soft defaults to session (only if not already customized)
          const defs = buildSmartDefaults(res.data)
          setSession(prev => {
            const updates = {}
            if (defs.division && prev.division === DEFAULT_SESSION.division) updates.division = defs.division
            return Object.keys(updates).length ? { ...prev, ...updates } : prev
          })
        }
      })
      .catch(() => { /* preferences are optional */ })
  }, [wanted, session.customerId])

  const value = useMemo(() => {
    const v = {
      ...session, locations, preferences, prefBadges,
      setLocation, setDivision, setShipTo, addRecentConfig, loadPreferences,
    }
    // Most store pages read `const { session } = useCustomerSession()`, so expose
    // the same object under `session` as well as flat.
    v.session = v
    return v
  }, [session, locations, setLocation, setDivision, setShipTo, addRecentConfig, loadPreferences, preferences, prefBadges])

  return <CustomerSessionContext.Provider value={value}>{children}</CustomerSessionContext.Provider>
}

export function useCustomerSession() {
  const ctx = useContext(CustomerSessionContext)
  if (!ctx) throw new Error('useCustomerSession must be used within CustomerSessionProvider')
  const { loadPreferences } = ctx
  useEffect(() => {
    if (/^\/(shop|account|place-order)(\/|$)/.test(window.location.pathname)) loadPreferences()
  }, [loadPreferences])
  return ctx
}

export default CustomerSessionContext
