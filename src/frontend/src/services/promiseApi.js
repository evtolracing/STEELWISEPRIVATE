/**
 * promiseApi.js — Evaluate shipping promise (next-day / cutoff / capacity).
 *
 * Client-side rules engine that can later be replaced by a backend endpoint.
 * Uses LocationCutoffRules from cutoffRulesApi.
 *
 * Returns PromiseEvaluation:
 * { status, message, cutoffLocal, cutoffMet, nowLocal, requestedShipDate,
 *   earliestShipDate, suggestedDates, reasons }
 */
import { getLocationCutoffRules } from './cutoffRulesApi'
import { estimateForPromise as getRecipeBasedEstimate } from './processingRecipesApi'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const USE_MOCK = window.__USE_MOCK_RULES__ !== false

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Get current time in a timezone as an ISO-like local string + Date parts.
 * We rely on Intl.DateTimeFormat which is natively available in modern browsers.
 */
function getNowInTimezone(tz, nowOverrideISO) {
  const base = nowOverrideISO ? new Date(nowOverrideISO) : new Date()
  // Format to get the local parts in the target timezone
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
  const parts = {}
  fmt.formatToParts(base).forEach(p => { parts[p.type] = p.value })
  const localISO = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`
  return {
    localISO,
    localDate: `${parts.year}-${parts.month}-${parts.day}`,
    localTime: `${parts.hour}:${parts.minute}`,
    year: parseInt(parts.year),
    month: parseInt(parts.month),
    day: parseInt(parts.day),
    hour: parseInt(parts.hour),
    minute: parseInt(parts.minute),
    dayOfWeek: new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00`).getDay(), // 0=Sun
  }
}

/** Parse "HH:MM" into { hour, minute } */
function parseTime(hhmm) {
  const [h, m] = (hhmm || '15:00').split(':').map(Number)
  return { hour: h, minute: m }
}

/** Add N calendar days to a YYYY-MM-DD string */
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

/** Is dateStr inside any blackout window? */
function isBlackout(dateStr, windows) {
  return windows.some(w => dateStr >= w.start && dateStr <= w.end)
}

/** Get blackout reason if applicable */
function getBlackoutReason(dateStr, windows) {
  const hit = windows.find(w => dateStr >= w.start && dateStr <= w.end)
  return hit ? hit.reason : null
}

/** Is the day-of-week of dateStr in the shipDays array? (shipDays: 1=Mon..6=Sat, 0=Sun) */
function isShipDay(dateStr, shipDays) {
  const dow = new Date(dateStr + 'T12:00:00').getDay()
  return shipDays.includes(dow)
}

/** Find the next valid ship day from startDate (inclusive), skipping blackouts + non-ship days */
function findNextValidShipDay(startDate, shipDays, blackoutWindows, maxSearch = 30) {
  let d = startDate
  for (let i = 0; i < maxSearch; i++) {
    if (isShipDay(d, shipDays) && !isBlackout(d, blackoutWindows)) return d
    d = addDays(d, 1)
  }
  return d // fallback
}

/** Generate up to N suggested dates starting from a date */
function getSuggestedDates(startDate, shipDays, blackoutWindows, count = 3) {
  const dates = []
  let d = startDate
  for (let i = 0; i < 60 && dates.length < count; i++) {
    if (isShipDay(d, shipDays) && !isBlackout(d, blackoutWindows)) dates.push(d)
    d = addDays(d, 1)
  }
  return dates
}

// ── Capacity stub ──────────────────────────────────────────────────────────
const CAPACITY_QTY_THRESHOLD = 50
const CAPACITY_WEIGHT_THRESHOLD = 5000 // lbs
const CAPACITY_PROCESSING_THRESHOLD = 2 // steps

function checkCapacityStub(itemsSummary) {
  if (!itemsSummary) return { risk: false }
  const { totalQty = 0, totalWeight = 0, processingStepsCount = 0 } = itemsSummary

  // Enhanced: Use recipe-based time estimation if processing steps detail is available
  if (itemsSummary.processingStepsDetail && itemsSummary.processingStepsDetail.length > 0) {
    try {
      const recipeEst = getRecipeBasedEstimate(itemsSummary.processingStepsDetail, itemsSummary.division)
      if (recipeEst.capacityRisk === 'HIGH') {
        return { risk: true, reason: `Processing requires ~${recipeEst.totalHours}h (recipe-based estimate) — scheduling review needed`, estimatedHours: recipeEst.totalHours }
      }
      if (recipeEst.capacityRisk === 'MEDIUM') {
        return { risk: true, reason: `Processing requires ~${recipeEst.totalHours}h — may require extra lead time`, estimatedHours: recipeEst.totalHours }
      }
    } catch { /* fall through to legacy check */ }
  }

  if (processingStepsCount > CAPACITY_PROCESSING_THRESHOLD) {
    return { risk: true, reason: `${processingStepsCount} processing steps may require extra lead time` }
  }
  if (totalQty > CAPACITY_QTY_THRESHOLD) {
    return { risk: true, reason: `High quantity (${totalQty}) may require scheduling review` }
  }
  if (totalWeight > CAPACITY_WEIGHT_THRESHOLD) {
    return { risk: true, reason: `Heavy order (${totalWeight.toFixed(0)} lb) may require special handling` }
  }
  return { risk: false }
}

// ── Main evaluator ─────────────────────────────────────────────────────────

/**
 * Evaluate promise for a given request.
 *
 * @param {Object} params
 * @param {string} params.locationId
 * @param {string} params.division - METALS, PLASTICS, etc.
 * @param {string} [params.requestedShipDate] - YYYY-MM-DD or empty for "earliest"
 * @param {string} [params.nowOverrideISO] - for testing
 * @param {Object} [params.itemsSummary] - { totalQty, totalWeight, processingStepsCount }
 * @returns {Promise<{ data: PromiseEvaluation }>}
 */
export async function evaluatePromise({ locationId, division, requestedShipDate, nowOverrideISO, itemsSummary }) {
  // If a real backend is available and mock is off, hit the API
  if (!USE_MOCK) {
    const res = await fetch(`${API_BASE}/promise/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationId, division, requestedShipDate, itemsSummary }),
    })
    if (!res.ok) throw new Error('Failed to evaluate promise')
    return res.json()
  }

  // ── Client-side evaluation ───────────────────────────────────────────
  const rulesRes = await getLocationCutoffRules(locationId)
  const rules = rulesRes.data
  if (!rules) {
    return {
      data: {
        status: 'YELLOW',
        message: 'No cutoff rules configured for this location',
        cutoffLocal: null,
        cutoffMet: null,
        nowLocal: new Date().toISOString(),
        requestedShipDate: requestedShipDate || null,
        earliestShipDate: null,
        suggestedDates: [],
        reasons: ['NO_RULES'],
      },
    }
  }

  const divRules = rules.divisionRules?.[division] || rules.divisionRules?.METALS || {
    cutoffLocal: '15:00', nextDayEnabled: true, shipDays: [1,2,3,4,5], pickupSameDayEnabled: false,
  }
  const blackouts = rules.blackoutWindows || []

  // 1) Get local "now"
  const now = getNowInTimezone(rules.timezone || 'America/Detroit', nowOverrideISO)

  // 2) Determine tomorrow (local)
  const tomorrowLocal = addDays(now.localDate, 1)

  // 3) If no requested date, default to tomorrow
  const reqDate = requestedShipDate || tomorrowLocal

  // 4) Parse cutoff
  const cutoff = parseTime(divRules.cutoffLocal)
  const cutoffPassed = (now.hour > cutoff.hour) || (now.hour === cutoff.hour && now.minute >= cutoff.minute)

  // 5) Evaluate reasons
  const reasons = []
  let status = 'GREEN'
  let message = ''

  // Check if next-day is even enabled
  if (!divRules.nextDayEnabled) {
    reasons.push('NEXT_DAY_DISABLED')
  }

  // Check: is requested date a ship day?
  if (!isShipDay(reqDate, divRules.shipDays)) {
    reasons.push('NON_SHIP_DAY')
  }

  // Check: is requested date in a blackout?
  if (isBlackout(reqDate, blackouts)) {
    const br = getBlackoutReason(reqDate, blackouts)
    reasons.push('BLACKOUT_WINDOW')
    if (br) reasons.push(`BLACKOUT: ${br}`)
  }

  // Check: is this a next-day request and has cutoff passed?
  const isNextDay = reqDate === tomorrowLocal
  const isSameDay = reqDate === now.localDate
  if (isNextDay && cutoffPassed) {
    reasons.push('CUTOFF_PASSED')
  }
  if (isSameDay && !divRules.pickupSameDayEnabled) {
    reasons.push('SAME_DAY_NOT_AVAILABLE')
  }
  if (isSameDay && divRules.pickupSameDayEnabled && cutoffPassed) {
    reasons.push('CUTOFF_PASSED')
  }

  // Check: is requested date in the past?
  if (reqDate < now.localDate) {
    reasons.push('DATE_IN_PAST')
  }

  // Capacity stub
  const capacity = checkCapacityStub(itemsSummary)
  if (capacity.risk) {
    reasons.push('CAPACITY_RISK_STUB')
  }

  // 6) Compute earliest valid ship date
  const searchStart = cutoffPassed ? addDays(tomorrowLocal, 1) : tomorrowLocal
  const earliestShipDate = findNextValidShipDay(searchStart, divRules.shipDays, blackouts)

  // 7) Suggested dates (starting from earliest)
  const suggestedDates = getSuggestedDates(earliestShipDate, divRules.shipDays, blackouts, 3)

  // 8) Determine status + message
  const dateIsValid = isShipDay(reqDate, divRules.shipDays) &&
    !isBlackout(reqDate, blackouts) &&
    reqDate >= now.localDate

  if (reasons.length === 0 && dateIsValid) {
    status = 'GREEN'
    message = 'Next-day available'
  } else if (reasons.includes('CAPACITY_RISK_STUB') && reasons.length === 1) {
    status = 'YELLOW'
    message = `Capacity risk — review recommended`
  } else if (reasons.includes('CUTOFF_PASSED')) {
    status = 'RED'
    const earliest = earliestShipDate
    const dayName = new Date(earliest + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })
    message = `Cutoff passed — earliest ship ${dayName} ${earliest.slice(5)}`
  } else if (reasons.includes('NON_SHIP_DAY') || reasons.includes('BLACKOUT_WINDOW')) {
    status = 'RED'
    const dayName = new Date(earliestShipDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })
    message = `Date unavailable — earliest ship ${dayName} ${earliestShipDate.slice(5)}`
  } else if (reasons.includes('DATE_IN_PAST')) {
    status = 'RED'
    message = 'Requested date is in the past'
  } else if (reasons.includes('NEXT_DAY_DISABLED')) {
    status = 'YELLOW'
    message = 'Next-day shipping not available for this division'
  } else if (capacity.risk) {
    status = 'YELLOW'
    message = 'Capacity risk — review recommended'
  } else {
    // Fallback — shouldn't normally reach here
    status = dateIsValid ? 'GREEN' : 'YELLOW'
    message = dateIsValid ? 'Shipping available' : 'Date may require adjustment'
  }

  return {
    data: {
      status,
      message,
      cutoffLocal: divRules.cutoffLocal,
      cutoffMet: !cutoffPassed,
      nowLocal: now.localISO,
      requestedShipDate: reqDate,
      earliestShipDate,
      suggestedDates,
      reasons,
      locationId,
      division,
      pickupSameDayEnabled: divRules.pickupSameDayEnabled,
      capacityNote: capacity.risk ? capacity.reason : null,
    },
  }
}

/**
 * Build a promise snapshot object suitable for saving on an order.
 */
export function buildPromiseSnapshot(evaluation) {
  if (!evaluation) return null
  return {
    evaluatedAt: new Date().toISOString(),
    locationId: evaluation.locationId,
    division: evaluation.division,
    status: evaluation.status,
    message: evaluation.message,
    cutoffLocal: evaluation.cutoffLocal,
    cutoffMet: evaluation.cutoffMet,
    earliestShipDate: evaluation.earliestShipDate,
    requestedShipDate: evaluation.requestedShipDate,
    reasons: evaluation.reasons || [],
  }
}
