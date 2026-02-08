/**
 * useCustomerDefaults — Smart-default hook for customer preferences.
 *
 * When a customer is selected in CSR Intake or E-Commerce checkout,
 * this hook:
 *   1. Fetches their saved preferences
 *   2. Builds a smart-defaults object
 *   3. Exposes an "apply" function that sets form fields
 *   4. Shows preference badges for CSR visibility
 *
 * The defaults are **soft suggestions** — always visible, always editable,
 * never silently forced.
 */
import { useState, useCallback, useRef } from 'react'
import {
  getCustomerPreferences,
  buildSmartDefaults,
  summarizePreferences,
} from '../services/customerPreferencesApi'

/**
 * @param {object} options
 * @param {function} options.onDefaultsReady - Called with { defaults, badges, prefs } when loaded
 */
export default function useCustomerDefaults(options = {}) {
  const [prefs, setPrefs] = useState(null)
  const [defaults, setDefaults] = useState({})
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasPreferences, setHasPreferences] = useState(false)
  const [applied, setApplied] = useState(false)
  const lastCustomerIdRef = useRef(null)

  /**
   * Load preferences for a customer. Call this when customer is selected.
   * Returns the smart defaults object.
   */
  const loadDefaults = useCallback(async (customerId) => {
    if (!customerId) {
      setPrefs(null)
      setDefaults({})
      setBadges([])
      setHasPreferences(false)
      setApplied(false)
      return {}
    }

    // Don't re-fetch if same customer
    if (customerId === lastCustomerIdRef.current && prefs) {
      return buildSmartDefaults(prefs)
    }

    setLoading(true)
    setApplied(false)
    lastCustomerIdRef.current = customerId

    try {
      const res = await getCustomerPreferences(customerId)
      const p = res.data
      const d = buildSmartDefaults(p)
      const b = summarizePreferences(p)

      setPrefs(p)
      setDefaults(d)
      setBadges(b)
      setHasPreferences(res.hasPreferences)

      if (options.onDefaultsReady) {
        options.onDefaultsReady({ defaults: d, badges: b, prefs: p })
      }

      return d
    } catch (err) {
      console.warn('Could not load customer preferences:', err)
      setPrefs(null)
      setDefaults({})
      setBadges([])
      setHasPreferences(false)
      return {}
    } finally {
      setLoading(false)
    }
  }, [prefs, options])

  /**
   * Apply defaults to form setter functions.
   * Pass a map of { fieldName: setterFunction }.
   * Only applies fields that have a non-empty default.
   *
   * Example:
   *   applyDefaults({
   *     location: setLocation,
   *     division: setDivision,
   *     priority: setPriority,
   *     ownership: setOwnership,
   *     notes: setNotes,
   *   })
   */
  const applyDefaults = useCallback((setters = {}) => {
    if (!defaults || Object.keys(defaults).length === 0) return

    Object.entries(setters).forEach(([field, setter]) => {
      if (defaults[field] != null && defaults[field] !== '' && typeof setter === 'function') {
        setter(defaults[field])
      }
    })

    setApplied(true)
  }, [defaults])

  /**
   * Clear loaded preferences (e.g. when customer is deselected).
   */
  const clearDefaults = useCallback(() => {
    setPrefs(null)
    setDefaults({})
    setBadges([])
    setHasPreferences(false)
    setApplied(false)
    lastCustomerIdRef.current = null
  }, [])

  return {
    /** Raw preferences object */
    prefs,
    /** Smart defaults mapped to form field names */
    defaults,
    /** Preference summary badges for display */
    badges,
    /** Whether this customer has saved preferences */
    hasPreferences,
    /** Whether defaults have been applied this session */
    applied,
    /** Loading state */
    loading,
    /** Load preferences for a customer ID */
    loadDefaults,
    /** Apply defaults to form setters */
    applyDefaults,
    /** Clear all loaded state */
    clearDefaults,
  }
}
