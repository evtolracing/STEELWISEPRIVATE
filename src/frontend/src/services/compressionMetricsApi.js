/**
 * compressionMetricsApi.js — Quote-to-Order Compression Metrics aggregation.
 *
 * Tracks speed through the order lifecycle:
 *   Quote → Order        (conversion speed)
 *   Online Order → CSR   (acceptance / response time)
 *   Order → Scheduled    (planning lag)
 *   Scheduled → Shipped  (execution speed)
 *
 * Filterable by branch, division, CSR, and time range.
 *
 * SLA thresholds are configurable — breaches surface as risk indicators.
 *
 * Computed by the backend from real sales orders, quotes, web orders, jobs
 * and shipments (/api/metrics/compression).
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'

// ─── ENUMS ───────────────────────────────────────────────────────────────────

export const METRIC_STAGE = {
  QUOTE_TO_ORDER:    'QUOTE_TO_ORDER',
  ONLINE_TO_CSR:     'ONLINE_TO_CSR',
  ORDER_TO_SCHEDULED:'ORDER_TO_SCHEDULED',
  SCHEDULED_TO_SHIP: 'SCHEDULED_TO_SHIP',
}

export const METRIC_STAGE_LABELS = {
  [METRIC_STAGE.QUOTE_TO_ORDER]:     'Quote → Order',
  [METRIC_STAGE.ONLINE_TO_CSR]:      'Online → CSR Accept',
  [METRIC_STAGE.ORDER_TO_SCHEDULED]: 'Order → Scheduled',
  [METRIC_STAGE.SCHEDULED_TO_SHIP]:  'Scheduled → Shipped',
}

export const METRIC_STAGE_COLORS = {
  [METRIC_STAGE.QUOTE_TO_ORDER]:     '#1976d2',
  [METRIC_STAGE.ONLINE_TO_CSR]:      '#9c27b0',
  [METRIC_STAGE.ORDER_TO_SCHEDULED]: '#ed6c02',
  [METRIC_STAGE.SCHEDULED_TO_SHIP]:  '#2e7d32',
}

export const TIME_RANGE = {
  TODAY:      'TODAY',
  THIS_WEEK:  'THIS_WEEK',
  THIS_MONTH: 'THIS_MONTH',
  LAST_30:    'LAST_30',
  LAST_90:    'LAST_90',
  LAST_YEAR:  'LAST_YEAR',
  CUSTOM:     'CUSTOM',
}

export const DIVISIONS = ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET']

// ─── SLA THRESHOLDS (hours) ──────────────────────────────────────────────────

export const SLA_TARGETS = {
  [METRIC_STAGE.QUOTE_TO_ORDER]:     { target: 48, warning: 36, unit: 'hours' },
  [METRIC_STAGE.ONLINE_TO_CSR]:      { target: 2,  warning: 1.5, unit: 'hours' },
  [METRIC_STAGE.ORDER_TO_SCHEDULED]: { target: 24, warning: 16, unit: 'hours' },
  [METRIC_STAGE.SCHEDULED_TO_SHIP]:  { target: 72, warning: 48, unit: 'hours' },
}

/** Total end-to-end SLA: Quote → Shipped */
export const END_TO_END_SLA = { target: 120, warning: 96, unit: 'hours' }

// ─── API FUNCTIONS ───────────────────────────────────────────────────────────

/**
 * Get overview compression metrics — one stat block per stage + end-to-end.
 */
export async function getCompressionOverview(filters = {}) {
  const params = new URLSearchParams(filters)
  const res = await fetch(`${API_BASE}/metrics/compression?${params}`)
  if (!res.ok) throw new Error('Failed to get compression overview')
  return res.json()
}

/**
 * Get trend data — daily/weekly averages for chart display.
 */
export async function getCompressionTrend(filters = {}) {
  const params = new URLSearchParams(filters)
  const res = await fetch(`${API_BASE}/metrics/compression/trend?${params}`)
  if (!res.ok) throw new Error('Failed to get compression trends')
  return res.json()
}

/**
 * Get per-branch comparison table.
 */
export async function getBranchComparison(filters = {}) {
  const params = new URLSearchParams(filters)
  const res = await fetch(`${API_BASE}/metrics/compression/branches?${params}`)
  if (!res.ok) throw new Error('Failed to get branch comparison')
  return res.json()
}

/**
 * Get per-CSR performance table.
 */
export async function getCsrPerformance(filters = {}) {
  const params = new URLSearchParams(filters)
  const res = await fetch(`${API_BASE}/metrics/compression/csrs?${params}`)
  if (!res.ok) throw new Error('Failed to get CSR performance')
  return res.json()
}

/**
 * Get SLA risk orders — orders at risk of breaching or already breaching SLA.
 */
export async function getSlaRiskOrders(filters = {}) {
  const params = new URLSearchParams(filters)
  const res = await fetch(`${API_BASE}/metrics/compression/sla-risk?${params}`)
  if (!res.ok) throw new Error('Failed to get SLA risk orders')
  return res.json()
}

/**
 * Export metrics as CSV-ready data.
 */
export async function exportCompressionReport(filters = {}) {
  const params = new URLSearchParams(filters)
  const res = await fetch(`${API_BASE}/metrics/compression/export?${params}`)
  if (!res.ok) throw new Error('Failed to export report')
  return res.json()
}

/**
 * Branches, CSRs and divisions that have orders, for the filter menus.
 * @returns {{ data: { branches: {id,name}[], csrs: {id,name,branch}[], divisions: string[], slaTargets: object } }}
 */
export async function getCompressionFilters() {
  const res = await fetch(`${API_BASE}/metrics/compression/filters`)
  if (!res.ok) throw new Error('Failed to get filter options')
  return res.json()
}

// ─── UTILITIES ───────────────────────────────────────────────────────────────

/** Format hours to human-readable display */
export function formatHours(hours) {
  if (hours == null) return '—'
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `${hours.toFixed(1)}h`
  const days = Math.floor(hours / 24)
  const rem = Math.round(hours % 24)
  return rem > 0 ? `${days}d ${rem}h` : `${days}d`
}

/** Get SLA status color for MUI */
export function slaColor(status) {
  if (status === 'GREEN') return 'success'
  if (status === 'YELLOW') return 'warning'
  if (status === 'RED' || status === 'BREACH') return 'error'
  return 'default'
}
