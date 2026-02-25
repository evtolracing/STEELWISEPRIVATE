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
 * Mock-first pattern.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const USE_MOCK = true

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

// ─── BRANCH LOAD DATA (mock) ────────────────────────────────────────────────

const BRANCH_LOAD = {
  JACKSON:       { id: 'loc-1', name: 'Jackson',       load: 0.82, queueDays: 2.5 },
  DETROIT:       { id: 'loc-2', name: 'Detroit',        load: 0.94, queueDays: 4.0 },
  KALAMAZOO:     { id: 'loc-3', name: 'Kalamazoo',      load: 0.55, queueDays: 1.0 },
  GRAND_RAPIDS:  { id: 'loc-4', name: 'Grand Rapids',   load: 0.71, queueDays: 1.5 },
}

// ─── DISCOUNT TABLES (mock) ──────────────────────────────────────────────────

const DATE_SHIFT_DISCOUNTS = [
  { daysLater: 1, pct: 2,  label: '+1 day' },
  { daysLater: 2, pct: 4,  label: '+2 days' },
  { daysLater: 3, pct: 5,  label: '+3 days' },
  { daysLater: 5, pct: 7,  label: '+5 days' },
]

const NON_RUSH_SAVINGS = {
  RUSH:      { downTo: 'STANDARD', pctOff: 12, label: 'Rush → Standard' },
  HOT:       { downTo: 'STANDARD', pctOff: 18, label: 'Hot → Standard' },
  EMERGENCY: { downTo: 'RUSH',     pctOff: 15, label: 'Emergency → Rush' },
}

const OFF_PEAK_WINDOWS = [
  { label: 'Tues–Wed next week',  pctOff: 3, daysOut: 5 },
  { label: 'Following Monday',    pctOff: 5, daysOut: 8 },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function _delay(ms) { return new Promise(r => setTimeout(r, ms)) }

function _addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function _formatDate(d) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function _estimateSubtotal(lines) {
  if (!lines || lines.length === 0) return 2500 // default estimate
  return lines.reduce((sum, l) => sum + (l.lineTotal || l.unitPrice * (l.quantity || 1) || 500), 0)
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
 * @returns {{ data: Suggestion[] }}
 */
export async function getDemandSuggestions(ctx = {}) {
  if (USE_MOCK) {
    await _delay(200)
    return { data: _buildMockSuggestions(ctx) }
  }
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
  if (USE_MOCK) {
    await _delay(100)
    return { success: true, suggestionId, orderId }
  }
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
  if (USE_MOCK) {
    await _delay(50)
    return { success: true }
  }
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
  if (USE_MOCK) {
    await _delay(250)
    return {
      data: {
        period: filters.period || 'LAST_30',
        totalSuggestions: 842,
        accepted: 314,
        acceptancePct: 37.3,
        totalSavingsOffered: 128400,
        totalSavingsAccepted: 47900,
        peakReductionPct: 14.2,
        byType: [
          { type: SUGGESTION_TYPE.ALT_DATE,    shown: 320, accepted: 134, pct: 41.9, savings: 22100 },
          { type: SUGGESTION_TYPE.ALT_BRANCH,  shown: 185, accepted:  72, pct: 38.9, savings: 11400 },
          { type: SUGGESTION_TYPE.NON_RUSH,    shown: 210, accepted:  78, pct: 37.1, savings: 10800 },
          { type: SUGGESTION_TYPE.OFF_PEAK,    shown:  82, accepted:  22, pct: 26.8, savings:  2400 },
          { type: SUGGESTION_TYPE.CONSOLIDATE, shown:  45, accepted:   8, pct: 17.8, savings:  1200 },
        ],
        weeklyTrend: _generateWeeklyTrend(),
      },
    }
  }
  const params = new URLSearchParams(filters)
  const res = await fetch(`${API_BASE}/demand-shaping/analytics?${params}`)
  if (!res.ok) throw new Error('Failed to get analytics')
  return res.json()
}

// ─── MOCK SUGGESTION BUILDER ─────────────────────────────────────────────────

function _buildMockSuggestions(ctx) {
  const suggestions = []
  const subtotal = _estimateSubtotal(ctx.lines)
  const now = new Date()
  let seq = 0

  const currentBranch = BRANCH_LOAD[ctx.branchKey] || BRANCH_LOAD.JACKSON
  const isHighLoad = currentBranch.load >= 0.80

  // 1. ALT_DATE — if a requested date exists or branch is loaded
  if (ctx.requestedDate || isHighLoad) {
    const baseDate = ctx.requestedDate ? new Date(ctx.requestedDate) : _addDays(now, 2)
    const bestShift = isHighLoad ? DATE_SHIFT_DISCOUNTS[1] : DATE_SHIFT_DISCOUNTS[0]
    const altDate = _addDays(baseDate, bestShift.daysLater)
    const savings = Math.round(subtotal * bestShift.pct / 100)

    suggestions.push({
      id: `ds-${++seq}-${Date.now()}`,
      type: SUGGESTION_TYPE.ALT_DATE,
      priority: isHighLoad ? 1 : 2,
      headline: `Save ${bestShift.pct}% — ship ${_formatDate(altDate)} instead`,
      description: `Moving your ship date ${bestShift.label} reduces peak load and saves you $${savings.toLocaleString()}.`,
      savingsAmount: savings,
      savingsPct: bestShift.pct,
      altDate: altDate.toISOString().slice(0, 10),
      altDateLabel: _formatDate(altDate),
      actionLabel: 'Use This Date',
      actionPayload: { field: 'requestedDate', value: altDate.toISOString().slice(0, 10) },
    })

    // Second date option if high load
    if (isHighLoad && DATE_SHIFT_DISCOUNTS[2]) {
      const shift2 = DATE_SHIFT_DISCOUNTS[2]
      const altDate2 = _addDays(baseDate, shift2.daysLater)
      const savings2 = Math.round(subtotal * shift2.pct / 100)
      suggestions.push({
        id: `ds-${++seq}-${Date.now()}`,
        type: SUGGESTION_TYPE.ALT_DATE,
        priority: 3,
        headline: `Save ${shift2.pct}% — ship ${_formatDate(altDate2)}`,
        description: `${shift2.label} later for $${savings2.toLocaleString()} off. Perfect if timing is flexible.`,
        savingsAmount: savings2,
        savingsPct: shift2.pct,
        altDate: altDate2.toISOString().slice(0, 10),
        altDateLabel: _formatDate(altDate2),
        actionLabel: 'Use This Date',
        actionPayload: { field: 'requestedDate', value: altDate2.toISOString().slice(0, 10) },
      })
    }
  }

  // 2. ALT_BRANCH — if current branch is loaded, suggest a quieter one
  if (isHighLoad) {
    const alternatives = Object.entries(BRANCH_LOAD)
      .filter(([key]) => key !== ctx.branchKey)
      .sort((a, b) => a[1].load - b[1].load)

    const best = alternatives[0]
    if (best && best[1].load < currentBranch.load - 0.10) {
      const loadDiff = Math.round((currentBranch.load - best[1].load) * 100)
      const daysSaved = Math.max(0, currentBranch.queueDays - best[1].queueDays)
      suggestions.push({
        id: `ds-${++seq}-${Date.now()}`,
        type: SUGGESTION_TYPE.ALT_BRANCH,
        priority: 2,
        headline: `Ship from ${best[1].name} — ${daysSaved.toFixed(1)} days faster`,
        description: `${best[1].name} is at ${Math.round(best[1].load * 100)}% capacity (${loadDiff}% less than ${currentBranch.name}). Queue time: ~${best[1].queueDays} days.`,
        altBranchKey: best[0],
        altBranchId: best[1].id,
        altBranchName: best[1].name,
        altBranchLoad: best[1].load,
        daysSaved,
        actionLabel: `Switch to ${best[1].name}`,
        actionPayload: { field: 'location', value: best[0] },
      })
    }
  }

  // 3. NON_RUSH — if priority is elevated
  const rushInfo = NON_RUSH_SAVINGS[ctx.priority]
  if (rushInfo) {
    const savings = Math.round(subtotal * rushInfo.pctOff / 100)
    suggestions.push({
      id: `ds-${++seq}-${Date.now()}`,
      type: SUGGESTION_TYPE.NON_RUSH,
      priority: 1,
      headline: `Save ${rushInfo.pctOff}% — switch to ${rushInfo.downTo}`,
      description: `${rushInfo.label}: Save $${savings.toLocaleString()} by choosing ${rushInfo.downTo.toLowerCase()} processing. Current queue times allow it.`,
      savingsAmount: savings,
      savingsPct: rushInfo.pctOff,
      originalPriority: ctx.priority,
      suggestedPriority: rushInfo.downTo,
      actionLabel: `Downgrade to ${rushInfo.downTo}`,
      actionPayload: { field: 'priority', value: rushInfo.downTo },
    })
  }

  // 4. OFF_PEAK — always show if branch is busy
  if (isHighLoad && OFF_PEAK_WINDOWS.length > 0) {
    const window = OFF_PEAK_WINDOWS[0]
    const savings = Math.round(subtotal * window.pctOff / 100)
    const offPeakDate = _addDays(now, window.daysOut)
    suggestions.push({
      id: `ds-${++seq}-${Date.now()}`,
      type: SUGGESTION_TYPE.OFF_PEAK,
      priority: 4,
      headline: `${window.pctOff}% off — schedule for ${window.label}`,
      description: `Off-peak scheduling saves $${savings.toLocaleString()}. ${currentBranch.name} has open capacity ${window.label.toLowerCase()}.`,
      savingsAmount: savings,
      savingsPct: window.pctOff,
      windowLabel: window.label,
      altDate: offPeakDate.toISOString().slice(0, 10),
      actionLabel: 'Schedule Off-Peak',
      actionPayload: { field: 'requestedDate', value: offPeakDate.toISOString().slice(0, 10) },
    })
  }

  // 5. CONSOLIDATE — if there are recent pending orders (simulate)
  if (ctx.source === 'CSR' && Math.random() > 0.5) {
    suggestions.push({
      id: `ds-${++seq}-${Date.now()}`,
      type: SUGGESTION_TYPE.CONSOLIDATE,
      priority: 5,
      headline: 'Combine with pending order ORD-2026-4418',
      description: 'Customer has a pending order shipping from the same branch in 2 days. Consolidating saves a delivery run.',
      savingsAmount: Math.round(subtotal * 0.02),
      savingsPct: 2,
      relatedOrderId: 'ORD-2026-4418',
      actionLabel: 'View & Consolidate',
      actionPayload: { field: 'consolidate', value: 'ORD-2026-4418' },
    })
  }

  // Sort by priority
  suggestions.sort((a, b) => a.priority - b.priority)
  return suggestions
}

function _generateWeeklyTrend() {
  const weeks = []
  const now = new Date()
  for (let w = 11; w >= 0; w--) {
    const weekStart = new Date(now.getTime() - (w * 7 + 7) * 86400000)
    weeks.push({
      week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
      shown: 50 + Math.floor(Math.random() * 40),
      accepted: 15 + Math.floor(Math.random() * 20),
      savings: 2000 + Math.floor(Math.random() * 3000),
    })
  }
  return weeks
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
