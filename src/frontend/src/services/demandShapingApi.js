/**
 * demandShapingApi.js — Demand Shaping Suggestions service.
 *
 * Reduce order peaks without saying "no" — gentle incentives:
 *   • Alternate ship-date discounts (off-peak pricing)
 *   • Alternate branch recommendations (lower-load locations)
 *   • Non-rush incentives (standard-speed savings)
 *
 * Inputs: current order context (branch, priority, division, date, lines).
 * Outputs: ranked suggestion cards — each with savings, rationale, action.
 *
 * Never blocks checkout — soft suggestions only.
 *
 * Suggestions are built by the backend from the demand-shaping settings, and
 * every one shown, accepted or dismissed is logged for the analytics.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'

// ─── SUGGESTION TYPES ────────────────────────────────────────────────────────

export const SUGGESTION_TYPE = {
  ALT_DATE:     'ALT_DATE',       // ship a day or two later for a discount
  ALT_BRANCH:   'ALT_BRANCH',     // ship from a less-loaded branch
  NON_RUSH:     'NON_RUSH',       // downgrade from rush for savings
  CONSOLIDATE:  'CONSOLIDATE',    // combine with upcoming order
  OFF_PEAK:     'OFF_PEAK',       // schedule in off-peak window
}

export const SUGGESTION_LABELS = {
  [SUGGESTION_TYPE.ALT_DATE]:    'Alternate Ship Date',
  [SUGGESTION_TYPE.ALT_BRANCH]:  'Alternate Branch',
  [SUGGESTION_TYPE.NON_RUSH]:    'Standard Speed Savings',
  [SUGGESTION_TYPE.CONSOLIDATE]: 'Order Consolidation',
  [SUGGESTION_TYPE.OFF_PEAK]:    'Off-Peak Scheduling',
}

export const SUGGESTION_ICONS = {
  [SUGGESTION_TYPE.ALT_DATE]:    'CalendarMonth',
  [SUGGESTION_TYPE.ALT_BRANCH]:  'LocationOn',
  [SUGGESTION_TYPE.NON_RUSH]:    'Savings',
  [SUGGESTION_TYPE.CONSOLIDATE]: 'Merge',
  [SUGGESTION_TYPE.OFF_PEAK]:    'NightsStay',
}

// ─── MAIN API ────────────────────────────────────────────────────────────────

/**
 * Generate demand-shaping suggestions for the current order context.
 *
 * @param {object} ctx
 * @param {string}  ctx.branchKey     — 'JACKSON' | 'DETROIT' etc.
 * @param {string}  ctx.priority      — 'STANDARD' | 'RUSH' | 'HOT' | 'EMERGENCY'
 * @param {string}  ctx.division      — 'METALS' | 'PLASTICS' etc.
 * @param {string}  ctx.requestedDate — ISO date or empty
 * @param {Array}   ctx.lines         — order line items
 * @param {string}  ctx.source        — 'CSR' | 'ECOMMERCE'
 * @param {string}  [ctx.customerId]  — lets the backend offer consolidation with an open order
 * @returns {{ data: Suggestion[] }}
 */
export async function getDemandSuggestions(ctx = {}) {
  const res = await fetch(`${API_BASE}/demand-shaping/suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ctx),
  })
  if (!res.ok) throw new Error('Failed to get demand suggestions')
  return res.json()
}

/**
 * Record when a customer accepts a suggestion (analytics).
 */
export async function acceptSuggestion(suggestionId, orderId) {
  const res = await fetch(`${API_BASE}/demand-shaping/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suggestionId, orderId }),
  })
  if (!res.ok) throw new Error('Failed to record acceptance')
  return res.json()
}

/**
 * Record when a suggestion is dismissed (analytics).
 */
export async function dismissSuggestion(suggestionId, reason) {
  const res = await fetch(`${API_BASE}/demand-shaping/dismiss`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suggestionId, reason }),
  })
  if (!res.ok) throw new Error('Failed to record dismissal')
  return res.json()
}

/**
 * Get demand shaping analytics — acceptance rates, savings generated.
 */
export async function getDemandShapingAnalytics(filters = {}) {
  const params = new URLSearchParams(filters)
  const res = await fetch(`${API_BASE}/demand-shaping/analytics?${params}`)
  if (!res.ok) throw new Error('Failed to get analytics')
  return res.json()
}

// ─── UTILITY EXPORTS ─────────────────────────────────────────────────────────

/** Format savings for display */
export function formatSavings(amount) {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`
  return `$${amount.toLocaleString()}`
}

/** Get suggestion type color for MUI */
export function suggestionColor(type) {
  const colors = {
    [SUGGESTION_TYPE.ALT_DATE]:    'info',
    [SUGGESTION_TYPE.ALT_BRANCH]:  'success',
    [SUGGESTION_TYPE.NON_RUSH]:    'warning',
    [SUGGESTION_TYPE.CONSOLIDATE]: 'secondary',
    [SUGGESTION_TYPE.OFF_PEAK]:    'primary',
  }
  return colors[type] || 'default'
}
