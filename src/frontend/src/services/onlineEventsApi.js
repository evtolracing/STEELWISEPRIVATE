/**
 * Online Events / Settings API — checkout rules, cutoff times, allowed processes.
 */
const API_BASE = import.meta.env.VITE_API_URL || '/api'
const USE_MOCK = true

const MOCK_RULES = {
  autoApproveThreshold: 5000,       // orders under $5k auto-approve
  requireQuoteAbove: 25000,         // orders above $25k always require quote
  maxLinesPerOrder: 50,
  allowGuestCheckout: false,
  defaultPriority: 'STANDARD',
  defaultOwnership: 'HOUSE',
  enableBackorder: true,
}

const MOCK_CUTOFFS = [
  { locationId: 'loc-1', locationName: 'Jackson', cutoffTime: '14:00', timezone: 'America/Detroit', sameDayProcessing: true },
  { locationId: 'loc-2', locationName: 'Detroit', cutoffTime: '13:00', timezone: 'America/Detroit', sameDayProcessing: true },
  { locationId: 'loc-3', locationName: 'Kalamazoo', cutoffTime: '14:00', timezone: 'America/Detroit', sameDayProcessing: false },
  { locationId: 'loc-4', locationName: 'Grand Rapids', cutoffTime: '12:00', timezone: 'America/Detroit', sameDayProcessing: false },
]

const MOCK_ALLOWED_PROCESSES = {
  METALS: ['SAW-CUT', 'SHEAR', 'PLASMA', 'DRILL', 'DEBURR'],
  PLASTICS: ['PLAS-SAW', 'PLAS-ROUTE'],
  SUPPLIES: [],
  OUTLET: [],
}

export async function getCheckoutRules() {
  if (USE_MOCK) return { data: MOCK_RULES }
  const res = await fetch(`${API_BASE}/admin/online-settings/rules`)
  if (!res.ok) throw new Error('Failed to fetch rules')
  return res.json()
}

export async function getCutoffTimes() {
  if (USE_MOCK) return { data: MOCK_CUTOFFS }
  const res = await fetch(`${API_BASE}/admin/online-settings/cutoffs`)
  if (!res.ok) throw new Error('Failed to fetch cutoffs')
  return res.json()
}

export async function getAllowedProcesses(division) {
  if (USE_MOCK) {
    const codes = MOCK_ALLOWED_PROCESSES[division] || []
    return { data: codes }
  }
  const res = await fetch(`${API_BASE}/admin/online-settings/processes?division=${division}`)
  if (!res.ok) throw new Error('Failed to fetch allowed processes')
  return res.json()
}

export async function updateCheckoutRules(rules) {
  if (USE_MOCK) { Object.assign(MOCK_RULES, rules); return { data: MOCK_RULES, success: true } }
  const res = await fetch(`${API_BASE}/admin/online-settings/rules`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rules),
  })
  if (!res.ok) throw new Error('Failed to update rules')
  return res.json()
}

export async function updateCutoffTimes(cutoffs) {
  if (USE_MOCK) return { data: cutoffs, success: true }
  const res = await fetch(`${API_BASE}/admin/online-settings/cutoffs`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cutoffs),
  })
  if (!res.ok) throw new Error('Failed to update cutoffs')
  return res.json()
}
