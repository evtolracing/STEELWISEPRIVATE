/**
 * cutoffRulesApi.js — Per-location cutoff rules for next-day promise evaluation.
 *
 * Shape: LocationCutoffRules
 * {
 *   locationId, timezone,
 *   divisionRules: { METALS: { cutoffLocal, nextDayEnabled, shipDays, pickupSameDayEnabled }, ... },
 *   blackoutWindows: [{ start, end, reason }],
 *   notes
 * }
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const USE_MOCK = window.__USE_MOCK_RULES__ !== false // default true

// ── Mock data for 4 locations ──────────────────────────────────────────────
const MOCK_RULES_DB = {
  'loc-1': {
    locationId: 'loc-1',
    locationName: 'Jackson',
    timezone: 'America/Detroit',
    divisionRules: {
      METALS:   { cutoffLocal: '15:30', nextDayEnabled: true, shipDays: [1,2,3,4,5], pickupSameDayEnabled: true },
      PLASTICS: { cutoffLocal: '14:30', nextDayEnabled: true, shipDays: [1,2,3,4,5], pickupSameDayEnabled: false },
      SUPPLIES: { cutoffLocal: '16:00', nextDayEnabled: true, shipDays: [1,2,3,4,5,6], pickupSameDayEnabled: true },
      OUTLET:   { cutoffLocal: '17:00', nextDayEnabled: true, shipDays: [1,2,3,4,5,6], pickupSameDayEnabled: true },
    },
    blackoutWindows: [
      { start: '2026-02-15', end: '2026-02-16', reason: 'President\'s Day Maintenance' },
      { start: '2026-07-03', end: '2026-07-04', reason: 'Independence Day' },
    ],
    notes: 'Cutoff times are local to branch (Eastern)',
  },
  'loc-2': {
    locationId: 'loc-2',
    locationName: 'Detroit',
    timezone: 'America/Detroit',
    divisionRules: {
      METALS:   { cutoffLocal: '14:00', nextDayEnabled: true, shipDays: [1,2,3,4,5], pickupSameDayEnabled: true },
      PLASTICS: { cutoffLocal: '13:30', nextDayEnabled: true, shipDays: [1,2,3,4,5], pickupSameDayEnabled: false },
      SUPPLIES: { cutoffLocal: '15:00', nextDayEnabled: true, shipDays: [1,2,3,4,5], pickupSameDayEnabled: true },
      OUTLET:   { cutoffLocal: '15:00', nextDayEnabled: true, shipDays: [1,2,3,4,5], pickupSameDayEnabled: true },
    },
    blackoutWindows: [
      { start: '2026-02-15', end: '2026-02-16', reason: 'President\'s Day Maintenance' },
    ],
    notes: 'Detroit branch — Eastern time',
  },
  'loc-3': {
    locationId: 'loc-3',
    locationName: 'Kalamazoo',
    timezone: 'America/Detroit',
    divisionRules: {
      METALS:   { cutoffLocal: '15:00', nextDayEnabled: true, shipDays: [1,2,3,4,5], pickupSameDayEnabled: false },
      PLASTICS: { cutoffLocal: '14:00', nextDayEnabled: false, shipDays: [1,2,3,4,5], pickupSameDayEnabled: false },
      SUPPLIES: { cutoffLocal: '15:30', nextDayEnabled: true, shipDays: [1,2,3,4,5], pickupSameDayEnabled: true },
      OUTLET:   { cutoffLocal: '16:00', nextDayEnabled: true, shipDays: [1,2,3,4,5], pickupSameDayEnabled: false },
    },
    blackoutWindows: [],
    notes: 'Kalamazoo branch — Eastern time',
  },
  'loc-4': {
    locationId: 'loc-4',
    locationName: 'Grand Rapids',
    timezone: 'America/Detroit',
    divisionRules: {
      METALS:   { cutoffLocal: '14:30', nextDayEnabled: true, shipDays: [1,2,3,4,5], pickupSameDayEnabled: true },
      PLASTICS: { cutoffLocal: '13:00', nextDayEnabled: true, shipDays: [1,2,3,4,5], pickupSameDayEnabled: false },
      SUPPLIES: { cutoffLocal: '15:00', nextDayEnabled: true, shipDays: [1,2,3,4,5,6], pickupSameDayEnabled: true },
      OUTLET:   { cutoffLocal: '16:00', nextDayEnabled: true, shipDays: [1,2,3,4,5,6], pickupSameDayEnabled: true },
    },
    blackoutWindows: [
      { start: '2026-12-24', end: '2026-12-25', reason: 'Christmas Eve / Christmas' },
    ],
    notes: 'Grand Rapids branch — Eastern time',
  },
}

/**
 * Get cutoff rules for a specific location.
 * Returns { data: LocationCutoffRules }
 */
export async function getLocationCutoffRules(locationId) {
  if (USE_MOCK) {
    const rules = MOCK_RULES_DB[locationId]
    if (!rules) return { data: null, error: `No rules found for location ${locationId}` }
    // Return deep clone so mutations don't affect mock DB during editing
    return { data: JSON.parse(JSON.stringify(rules)) }
  }
  const res = await fetch(`${API_BASE}/cutoff-rules/${encodeURIComponent(locationId)}`)
  if (!res.ok) throw new Error(`Failed to fetch cutoff rules for ${locationId}`)
  return res.json()
}

/**
 * Get cutoff rules for ALL locations (admin usage).
 * Returns { data: LocationCutoffRules[] }
 */
export async function getAllLocationCutoffRules() {
  if (USE_MOCK) {
    return { data: Object.values(MOCK_RULES_DB).map(r => JSON.parse(JSON.stringify(r))) }
  }
  const res = await fetch(`${API_BASE}/cutoff-rules`)
  if (!res.ok) throw new Error('Failed to fetch all cutoff rules')
  return res.json()
}

/**
 * Update cutoff rules for a specific location (admin).
 * Returns { data: LocationCutoffRules, success: true }
 */
export async function updateLocationCutoffRules(locationId, payload) {
  if (USE_MOCK) {
    MOCK_RULES_DB[locationId] = { ...MOCK_RULES_DB[locationId], ...payload, locationId }
    return { data: JSON.parse(JSON.stringify(MOCK_RULES_DB[locationId])), success: true }
  }
  const res = await fetch(`${API_BASE}/cutoff-rules/${encodeURIComponent(locationId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to update cutoff rules')
  return res.json()
}
