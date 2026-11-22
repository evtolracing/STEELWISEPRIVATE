/**
 * Order cut-off rules for each real branch, kept on the server (backend lib/cutoffRules.js).
 *
 * Shape of one rule:
 * {
 *   locationId, locationCode, locationName, timezone,
 *   isSet,             false until someone saves the rule: nothing is promised from a rule that is not set
 *   divisionRules: { METALS: { cutoffLocal, nextDayEnabled, shipDays, pickupSameDayEnabled }, ... },
 *   blackoutWindows: [{ start, end, reason }],
 *   notes
 * }
 */
const API_BASE = import.meta.env.VITE_API_URL || '/api'

const read = async (res, fallback) => {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || fallback)
  return body
}

/** The rule for one branch. Returns { data: rule } or { data: null } when the store does not sell from it. */
export async function getLocationCutoffRules(locationId) {
  if (!locationId) return { data: null }
  return read(await fetch(`${API_BASE}/ecom/cutoff-rules/${encodeURIComponent(locationId)}`), 'The cut-off rules could not be loaded')
}

/** The rules for every branch the store sells from. Returns { data: rule[] } */
export async function getAllLocationCutoffRules() {
  return read(await fetch(`${API_BASE}/ecom/cutoff-rules`), 'The cut-off rules could not be loaded')
}

/** Save the rule for one branch (web shop administrators). Returns { data: rule, success: true } */
export async function updateLocationCutoffRules(locationId, payload) {
  return read(await fetch(`${API_BASE}/admin/online-settings/cutoff-rules/${encodeURIComponent(locationId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }), 'The cut-off rules could not be saved')
}

/** The branches the store sells from. Returns { data: [{ id, code, name, city, state, timezone }] } */
export async function getStoreBranches() {
  return read(await fetch(`${API_BASE}/ecom/branches`), 'The branches could not be loaded')
}
