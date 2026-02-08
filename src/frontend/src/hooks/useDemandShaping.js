/**
 * useDemandShaping — Hook for loading & interacting with demand shaping suggestions.
 *
 * Auto-fetches suggestions when order context changes (branch, priority, date, lines).
 * Provides accept/dismiss handlers that update form state and record analytics.
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import {
  getDemandSuggestions,
  acceptSuggestion,
  dismissSuggestion,
} from '../services/demandShapingApi'

/**
 * @param {object} ctx  — reactive order context
 * @param {string}  ctx.branchKey
 * @param {string}  ctx.priority
 * @param {string}  ctx.division
 * @param {string}  ctx.requestedDate
 * @param {Array}   ctx.lines
 * @param {string}  ctx.source — 'CSR' | 'ECOMMERCE'
 * @param {object} options
 * @param {function} options.onApply — called with { field, value } when suggestion is accepted
 */
export default function useDemandShaping(ctx = {}, options = {}) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)
  const lastCtxRef = useRef('')

  // Debounced fetch — avoids flooding API on every keystroke
  const fetchSuggestions = useCallback(async (context) => {
    setLoading(true)
    try {
      const { data } = await getDemandSuggestions(context)
      setSuggestions(data || [])
    } catch (err) {
      console.warn('Demand shaping suggestions unavailable:', err)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-refresh when context changes (debounced 600ms)
  useEffect(() => {
    const ctxKey = JSON.stringify({
      b: ctx.branchKey,
      p: ctx.priority,
      d: ctx.division,
      dt: ctx.requestedDate,
      n: ctx.lines?.length,
    })
    if (ctxKey === lastCtxRef.current) return
    lastCtxRef.current = ctxKey

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(ctx), 600)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [ctx.branchKey, ctx.priority, ctx.division, ctx.requestedDate, ctx.lines?.length, fetchSuggestions])

  // Accept handler — apply suggestion to form + record analytics
  const handleAccept = useCallback(async (suggestion) => {
    // Apply the field change
    if (suggestion.actionPayload && options.onApply) {
      options.onApply(suggestion.actionPayload)
    }

    // Record acceptance (fire-and-forget)
    acceptSuggestion(suggestion.id).catch(() => {})

    // Remove from list
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
  }, [options])

  // Dismiss handler
  const handleDismiss = useCallback(async (suggestion) => {
    dismissSuggestion(suggestion.id, 'user_dismissed').catch(() => {})
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
  }, [])

  // Manual refresh
  const refresh = useCallback(() => {
    lastCtxRef.current = ''
    fetchSuggestions(ctx)
  }, [ctx, fetchSuggestions])

  return {
    /** Current suggestions list */
    suggestions,
    /** Loading state */
    loading,
    /** Accept a suggestion (applies + records analytics) */
    handleAccept,
    /** Dismiss a suggestion */
    handleDismiss,
    /** Force refresh */
    refresh,
    /** Whether any suggestions are available */
    hasSuggestions: suggestions.length > 0,
    /** Total potential savings */
    totalSavings: suggestions.reduce((s, sg) => s + (sg.savingsAmount || 0), 0),
  }
}
