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
 * Mock-first pattern.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const USE_MOCK = true

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

export const BRANCHES = [
  { id: 'loc-1', name: 'Jackson' },
  { id: 'loc-2', name: 'Detroit' },
  { id: 'loc-3', name: 'Kalamazoo' },
  { id: 'loc-4', name: 'Grand Rapids' },
]

export const DIVISIONS = ['METALS', 'PLASTICS', 'SUPPLIES', 'OUTLET']

export const MOCK_CSRS = [
  { id: 'csr-1', name: 'Sarah Wilson',   initials: 'SW', branch: 'loc-1' },
  { id: 'csr-2', name: 'Mike Thompson',  initials: 'MT', branch: 'loc-1' },
  { id: 'csr-3', name: 'John Davis',     initials: 'JD', branch: 'loc-2' },
  { id: 'csr-4', name: 'Lisa Chen',      initials: 'LC', branch: 'loc-3' },
  { id: 'csr-5', name: 'Tom Bradley',    initials: 'TB', branch: 'loc-4' },
  { id: 'csr-6', name: 'Amy Rodriguez',  initials: 'AR', branch: 'loc-2' },
]

// ─── SLA THRESHOLDS (hours) ──────────────────────────────────────────────────

export const SLA_TARGETS = {
  [METRIC_STAGE.QUOTE_TO_ORDER]:     { target: 48, warning: 36, unit: 'hours' },
  [METRIC_STAGE.ONLINE_TO_CSR]:      { target: 2,  warning: 1.5, unit: 'hours' },
  [METRIC_STAGE.ORDER_TO_SCHEDULED]: { target: 24, warning: 16, unit: 'hours' },
  [METRIC_STAGE.SCHEDULED_TO_SHIP]:  { target: 72, warning: 48, unit: 'hours' },
}

/** Total end-to-end SLA: Quote → Shipped */
export const END_TO_END_SLA = { target: 120, warning: 96, unit: 'hours' }

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

function _randomBetween(min, max) {
  return +(min + Math.random() * (max - min)).toFixed(1)
}

function _generateMockOrders(count = 120) {
  const orders = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 90)
    const baseDate = new Date(now.getTime() - daysAgo * 86400000)
    const branch = BRANCHES[Math.floor(Math.random() * BRANCHES.length)]
    const csr = MOCK_CSRS.filter(c => c.branch === branch.id || Math.random() > 0.5)[0] || MOCK_CSRS[0]
    const division = DIVISIONS[Math.floor(Math.random() * 3)]
    const source = Math.random() > 0.4 ? 'ONLINE' : Math.random() > 0.5 ? 'PHONE' : 'EMAIL'

    const quoteToOrderHours = source === 'ONLINE' ? _randomBetween(0.5, 8) : _randomBetween(4, 96)
    const onlineToCsrHours = source === 'ONLINE' ? _randomBetween(0.2, 6) : _randomBetween(0.1, 2)
    const orderToScheduledHours = _randomBetween(1, 48)
    const scheduledToShipHours = _randomBetween(4, 120)
    const endToEndHours = quoteToOrderHours + onlineToCsrHours + orderToScheduledHours + scheduledToShipHours

    const quoteDate = new Date(baseDate.getTime())
    const orderDate = new Date(quoteDate.getTime() + quoteToOrderHours * 3600000)
    const csrAcceptDate = new Date(orderDate.getTime() + onlineToCsrHours * 3600000)
    const scheduledDate = new Date(csrAcceptDate.getTime() + orderToScheduledHours * 3600000)
    const shippedDate = new Date(scheduledDate.getTime() + scheduledToShipHours * 3600000)

    // Some orders still in-progress (no shipped date)
    const isComplete = daysAgo > 5 || Math.random() > 0.3
    const isScheduled = daysAgo > 2 || Math.random() > 0.4

    orders.push({
      id: `ORD-${String(2026000 + i).padStart(7, '0')}`,
      quoteId: `QTE-${String(5000 + i).padStart(5, '0')}`,
      branchId: branch.id,
      branchName: branch.name,
      csrId: csr.id,
      csrName: csr.name,
      division,
      source,
      quoteDate: quoteDate.toISOString(),
      orderDate: orderDate.toISOString(),
      csrAcceptDate: csrAcceptDate.toISOString(),
      scheduledDate: isScheduled ? scheduledDate.toISOString() : null,
      shippedDate: isComplete ? shippedDate.toISOString() : null,
      stages: {
        [METRIC_STAGE.QUOTE_TO_ORDER]:     quoteToOrderHours,
        [METRIC_STAGE.ONLINE_TO_CSR]:      onlineToCsrHours,
        [METRIC_STAGE.ORDER_TO_SCHEDULED]: isScheduled ? orderToScheduledHours : null,
        [METRIC_STAGE.SCHEDULED_TO_SHIP]:  isComplete ? scheduledToShipHours : null,
      },
      endToEndHours: isComplete ? endToEndHours : null,
      revenue: _randomBetween(500, 45000),
    })
  }
  return orders
}

const MOCK_ORDERS = _generateMockOrders(120)

// ─── AGGREGATION HELPERS ─────────────────────────────────────────────────────

function _filterOrders(orders, filters = {}) {
  let list = [...orders]
  if (filters.branchId) list = list.filter(o => o.branchId === filters.branchId)
  if (filters.division) list = list.filter(o => o.division === filters.division)
  if (filters.csrId) list = list.filter(o => o.csrId === filters.csrId)
  if (filters.source) list = list.filter(o => o.source === filters.source)
  if (filters.timeRange && filters.timeRange !== TIME_RANGE.CUSTOM) {
    const now = new Date()
    let cutoff
    switch (filters.timeRange) {
      case TIME_RANGE.TODAY:      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break
      case TIME_RANGE.THIS_WEEK:  cutoff = new Date(now.getTime() - 7 * 86400000); break
      case TIME_RANGE.THIS_MONTH: cutoff = new Date(now.getFullYear(), now.getMonth(), 1); break
      case TIME_RANGE.LAST_30:    cutoff = new Date(now.getTime() - 30 * 86400000); break
      case TIME_RANGE.LAST_90:    cutoff = new Date(now.getTime() - 90 * 86400000); break
      case TIME_RANGE.LAST_YEAR:  cutoff = new Date(now.getTime() - 365 * 86400000); break
      default: cutoff = null
    }
    if (cutoff) list = list.filter(o => new Date(o.orderDate) >= cutoff)
  }
  return list
}

function _computeStageStats(values) {
  if (!values.length) return { avg: 0, median: 0, p90: 0, min: 0, max: 0, count: 0 }
  const sorted = [...values].sort((a, b) => a - b)
  const sum = sorted.reduce((s, v) => s + v, 0)
  return {
    avg: +(sum / sorted.length).toFixed(1),
    median: +sorted[Math.floor(sorted.length / 2)].toFixed(1),
    p90: +sorted[Math.floor(sorted.length * 0.9)].toFixed(1),
    min: +sorted[0].toFixed(1),
    max: +sorted[sorted.length - 1].toFixed(1),
    count: sorted.length,
  }
}

function _slaStatus(value, sla) {
  if (value <= sla.warning) return 'GREEN'
  if (value <= sla.target) return 'YELLOW'
  return 'RED'
}

// ─── API FUNCTIONS ───────────────────────────────────────────────────────────

/**
 * Get overview compression metrics — one stat block per stage + end-to-end.
 */
export async function getCompressionOverview(filters = {}) {
  if (USE_MOCK) {
    await _delay(250)
    const orders = _filterOrders(MOCK_ORDERS, filters)

    const stages = {}
    Object.values(METRIC_STAGE).forEach(stage => {
      const values = orders.map(o => o.stages[stage]).filter(v => v != null)
      const stats = _computeStageStats(values)
      const sla = SLA_TARGETS[stage]
      stages[stage] = {
        ...stats,
        sla,
        slaStatus: _slaStatus(stats.avg, sla),
        breachCount: values.filter(v => v > sla.target).length,
        breachPct: values.length ? +((values.filter(v => v > sla.target).length / values.length) * 100).toFixed(1) : 0,
      }
    })

    // End-to-end
    const e2eValues = orders.map(o => o.endToEndHours).filter(v => v != null)
    const e2eStats = _computeStageStats(e2eValues)

    return {
      data: {
        stages,
        endToEnd: {
          ...e2eStats,
          sla: END_TO_END_SLA,
          slaStatus: _slaStatus(e2eStats.avg, END_TO_END_SLA),
          breachCount: e2eValues.filter(v => v > END_TO_END_SLA.target).length,
          breachPct: e2eValues.length ? +((e2eValues.filter(v => v > END_TO_END_SLA.target).length / e2eValues.length) * 100).toFixed(1) : 0,
        },
        totalOrders: orders.length,
        completedOrders: orders.filter(o => o.shippedDate).length,
        inProgressOrders: orders.filter(o => !o.shippedDate).length,
      },
    }
  }
  const params = new URLSearchParams(filters)
  const res = await fetch(`${API_BASE}/metrics/compression?${params}`)
  if (!res.ok) throw new Error('Failed to get compression overview')
  return res.json()
}

/**
 * Get trend data — daily/weekly averages for chart display.
 */
export async function getCompressionTrend(filters = {}) {
  if (USE_MOCK) {
    await _delay(300)
    const orders = _filterOrders(MOCK_ORDERS, filters)
    const now = new Date()
    const weeks = []

    for (let w = 11; w >= 0; w--) {
      const weekStart = new Date(now.getTime() - (w * 7 + 7) * 86400000)
      const weekEnd = new Date(now.getTime() - w * 7 * 86400000)
      const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`
      const weekOrders = orders.filter(o => {
        const d = new Date(o.orderDate)
        return d >= weekStart && d < weekEnd
      })

      const point = { week: weekLabel, orderCount: weekOrders.length }
      Object.values(METRIC_STAGE).forEach(stage => {
        const vals = weekOrders.map(o => o.stages[stage]).filter(v => v != null)
        point[stage] = vals.length ? +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : null
      })
      const e2eVals = weekOrders.map(o => o.endToEndHours).filter(v => v != null)
      point.endToEnd = e2eVals.length ? +(e2eVals.reduce((s, v) => s + v, 0) / e2eVals.length).toFixed(1) : null
      weeks.push(point)
    }

    return { data: weeks }
  }
  const params = new URLSearchParams(filters)
  const res = await fetch(`${API_BASE}/metrics/compression/trend?${params}`)
  if (!res.ok) throw new Error('Failed to get compression trends')
  return res.json()
}

/**
 * Get per-branch comparison table.
 */
export async function getBranchComparison(filters = {}) {
  if (USE_MOCK) {
    await _delay(200)
    const orders = _filterOrders(MOCK_ORDERS, filters)

    const branches = BRANCHES.map(branch => {
      const branchOrders = orders.filter(o => o.branchId === branch.id)
      const row = { ...branch, orderCount: branchOrders.length }
      Object.values(METRIC_STAGE).forEach(stage => {
        const vals = branchOrders.map(o => o.stages[stage]).filter(v => v != null)
        row[stage] = vals.length ? +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : null
        row[`${stage}_sla`] = vals.length ? _slaStatus(row[stage], SLA_TARGETS[stage]) : null
      })
      const e2eVals = branchOrders.map(o => o.endToEndHours).filter(v => v != null)
      row.endToEnd = e2eVals.length ? +(e2eVals.reduce((s, v) => s + v, 0) / e2eVals.length).toFixed(1) : null
      row.endToEnd_sla = e2eVals.length ? _slaStatus(row.endToEnd, END_TO_END_SLA) : null
      return row
    })

    return { data: branches }
  }
  const params = new URLSearchParams(filters)
  const res = await fetch(`${API_BASE}/metrics/compression/branches?${params}`)
  if (!res.ok) throw new Error('Failed to get branch comparison')
  return res.json()
}

/**
 * Get per-CSR performance table.
 */
export async function getCsrPerformance(filters = {}) {
  if (USE_MOCK) {
    await _delay(200)
    const orders = _filterOrders(MOCK_ORDERS, filters)

    const csrs = MOCK_CSRS.map(csr => {
      const csrOrders = orders.filter(o => o.csrId === csr.id)
      const row = { ...csr, orderCount: csrOrders.length, revenue: csrOrders.reduce((s, o) => s + o.revenue, 0) }
      Object.values(METRIC_STAGE).forEach(stage => {
        const vals = csrOrders.map(o => o.stages[stage]).filter(v => v != null)
        row[stage] = vals.length ? +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : null
        row[`${stage}_sla`] = vals.length ? _slaStatus(row[stage], SLA_TARGETS[stage]) : null
      })
      const e2eVals = csrOrders.map(o => o.endToEndHours).filter(v => v != null)
      row.endToEnd = e2eVals.length ? +(e2eVals.reduce((s, v) => s + v, 0) / e2eVals.length).toFixed(1) : null
      return row
    })

    csrs.sort((a, b) => (a.endToEnd || 999) - (b.endToEnd || 999))
    return { data: csrs }
  }
  const params = new URLSearchParams(filters)
  const res = await fetch(`${API_BASE}/metrics/compression/csrs?${params}`)
  if (!res.ok) throw new Error('Failed to get CSR performance')
  return res.json()
}

/**
 * Get SLA risk orders — orders at risk of breaching or already breaching SLA.
 */
export async function getSlaRiskOrders(filters = {}) {
  if (USE_MOCK) {
    await _delay(200)
    const orders = _filterOrders(MOCK_ORDERS, filters)
    const atRisk = []

    orders.forEach(order => {
      Object.values(METRIC_STAGE).forEach(stage => {
        const val = order.stages[stage]
        if (val == null) return
        const sla = SLA_TARGETS[stage]
        if (val > sla.warning) {
          atRisk.push({
            orderId: order.id,
            quoteId: order.quoteId,
            stage,
            stageLabel: METRIC_STAGE_LABELS[stage],
            hours: val,
            slaTarget: sla.target,
            slaStatus: val > sla.target ? 'BREACH' : 'WARNING',
            branchName: order.branchName,
            csrName: order.csrName,
            division: order.division,
            orderDate: order.orderDate,
          })
        }
      })
    })

    atRisk.sort((a, b) => {
      if (a.slaStatus === 'BREACH' && b.slaStatus !== 'BREACH') return -1
      if (b.slaStatus === 'BREACH' && a.slaStatus !== 'BREACH') return 1
      return b.hours - a.hours
    })

    return { data: atRisk.slice(0, 50), total: atRisk.length }
  }
  const params = new URLSearchParams(filters)
  const res = await fetch(`${API_BASE}/metrics/compression/sla-risk?${params}`)
  if (!res.ok) throw new Error('Failed to get SLA risk orders')
  return res.json()
}

/**
 * Export metrics as CSV-ready data.
 */
export async function exportCompressionReport(filters = {}) {
  if (USE_MOCK) {
    await _delay(400)
    const orders = _filterOrders(MOCK_ORDERS, filters)
    const rows = orders.map(o => ({
      'Order ID': o.id,
      'Quote ID': o.quoteId,
      'Branch': o.branchName,
      'CSR': o.csrName,
      'Division': o.division,
      'Source': o.source,
      'Quote Date': o.quoteDate,
      'Order Date': o.orderDate,
      'Quote→Order (hrs)': o.stages[METRIC_STAGE.QUOTE_TO_ORDER],
      'Online→CSR (hrs)': o.stages[METRIC_STAGE.ONLINE_TO_CSR],
      'Order→Scheduled (hrs)': o.stages[METRIC_STAGE.ORDER_TO_SCHEDULED],
      'Scheduled→Shipped (hrs)': o.stages[METRIC_STAGE.SCHEDULED_TO_SHIP],
      'End-to-End (hrs)': o.endToEndHours,
      'Revenue': o.revenue,
    }))
    return { data: rows }
  }
  const params = new URLSearchParams(filters)
  const res = await fetch(`${API_BASE}/metrics/compression/export?${params}`)
  if (!res.ok) throw new Error('Failed to export report')
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

function _delay(ms) { return new Promise(r => setTimeout(r, ms)) }
