/**
 * branchComparisonApi.js — Branch-to-branch fulfillment comparison service.
 *
 * Compares branches based on:
 *   - Inventory availability
 *   - Processing capability (machines available)
 *   - Cutoff time remaining
 *   - Distance to ship-to (stub)
 *
 * Returns ranked suggestions with reason codes.
 *
 * Shape: FulfillmentSuggestion
 * {
 *   locationId, locationName, rank, score,
 *   recommended: boolean,
 *   reasons: { code, label, impact: 'positive'|'neutral'|'negative' }[],
 *   inventory: { available, totalQty, totalWeight },
 *   cutoff: { cutoffLocal, minutesLeft, cutoffMet },
 *   processing: { capable, missingOps },
 *   distance: { miles, estimateLabel },
 * }
 */
import { getAllLocationCutoffRules } from './cutoffRulesApi'
import { minutesUntilCutoff, getNowInTz } from '../utils/timeUtils'

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const USE_MOCK = window.__USE_MOCK_RULES__ !== false

// ── Branch master data ─────────────────────────────────────────────────────
const BRANCH_MASTER = [
  { locationId: 'loc-1', name: 'Jackson',       csrKey: 'JACKSON',       state: 'MI', lat: 42.2458, lng: -84.4013, capabilities: ['SAW', 'SHEAR', 'PLASMA', 'WATERJET', 'BEND', 'DRILL'] },
  { locationId: 'loc-2', name: 'Detroit',        csrKey: 'DETROIT',       state: 'MI', lat: 42.3314, lng: -83.0458, capabilities: ['SAW', 'SHEAR', 'PLASMA', 'DRILL'] },
  { locationId: 'loc-3', name: 'Kalamazoo',      csrKey: 'KALAMAZOO',     state: 'MI', lat: 42.2917, lng: -85.5872, capabilities: ['SAW', 'SHEAR', 'BEND'] },
  { locationId: 'loc-4', name: 'Grand Rapids',   csrKey: 'GRAND_RAPIDS',  state: 'MI', lat: 42.9634, lng: -85.6681, capabilities: ['SAW', 'SHEAR', 'PLASMA', 'WATERJET', 'BEND'] },
]

// ── Mock inventory per branch (simplified snapshot) ────────────────────────
const MOCK_BRANCH_INVENTORY = {
  'loc-1': { METALS: { qtyOnHand: 245, weightLbs: 82400, skuCount: 38 }, PLASTICS: { qtyOnHand: 120, weightLbs: 18900, skuCount: 14 }, SUPPLIES: { qtyOnHand: 500, weightLbs: 2200, skuCount: 55 }, OUTLET: { qtyOnHand: 30, weightLbs: 6200, skuCount: 12 } },
  'loc-2': { METALS: { qtyOnHand: 180, weightLbs: 64000, skuCount: 28 }, PLASTICS: { qtyOnHand: 40, weightLbs: 5600, skuCount: 6 }, SUPPLIES: { qtyOnHand: 350, weightLbs: 1500, skuCount: 40 }, OUTLET: { qtyOnHand: 15, weightLbs: 3100, skuCount: 8 } },
  'loc-3': { METALS: { qtyOnHand: 90, weightLbs: 31200, skuCount: 15 }, PLASTICS: { qtyOnHand: 85, weightLbs: 12800, skuCount: 10 }, SUPPLIES: { qtyOnHand: 200, weightLbs: 900, skuCount: 28 }, OUTLET: { qtyOnHand: 8, weightLbs: 1600, skuCount: 5 } },
  'loc-4': { METALS: { qtyOnHand: 160, weightLbs: 55000, skuCount: 25 }, PLASTICS: { qtyOnHand: 60, weightLbs: 8400, skuCount: 9 }, SUPPLIES: { qtyOnHand: 300, weightLbs: 1300, skuCount: 35 }, OUTLET: { qtyOnHand: 20, weightLbs: 4200, skuCount: 10 } },
}

// ── Distance stub (Haversine-lite) ─────────────────────────────────────────
function haversineApprox(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lat2 == null) return null
  const R = 3959 // miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function distanceLabel(miles) {
  if (miles == null) return 'Unknown'
  if (miles < 50) return 'Local'
  if (miles < 150) return 'Regional'
  return 'Long haul'
}

// ── Scoring weights ────────────────────────────────────────────────────────
const WEIGHTS = {
  INVENTORY: 30,     // 0-30 pts
  CUTOFF: 30,        // 0-30 pts
  PROCESSING: 25,    // 0-25 pts
  DISTANCE: 15,      // 0-15 pts
}

function scoreInventory(inv, division) {
  const di = inv?.[division]
  if (!di || di.qtyOnHand === 0) return { score: 0, available: false, totalQty: 0, totalWeight: 0 }
  const s = Math.min(WEIGHTS.INVENTORY, (di.qtyOnHand / 100) * WEIGHTS.INVENTORY)
  return { score: Math.round(s), available: true, totalQty: di.qtyOnHand, totalWeight: di.weightLbs }
}

function scoreCutoff(tz, cutoffHHMM, shipDays, blackoutWindows) {
  if (!tz || !cutoffHHMM) return { score: 0, cutoffLocal: null, minutesLeft: null, cutoffMet: false }
  const mins = minutesUntilCutoff({ tz, cutoffLocalHHMM: cutoffHHMM })
  const now = getNowInTz(tz)
  const isShipDay = shipDays.includes(now.dayOfWeek)
  const todayStr = now.dateStr
  const inBlackout = (blackoutWindows || []).some(bw => todayStr >= bw.start && todayStr <= bw.end)
  if (inBlackout || !isShipDay) return { score: 0, cutoffLocal: cutoffHHMM, minutesLeft: mins, cutoffMet: false }
  if (mins <= 0) return { score: 2, cutoffLocal: cutoffHHMM, minutesLeft: mins, cutoffMet: false }
  const s = Math.min(WEIGHTS.CUTOFF, (mins / 240) * WEIGHTS.CUTOFF)
  return { score: Math.round(s), cutoffLocal: cutoffHHMM, minutesLeft: mins, cutoffMet: true }
}

function scoreProcessing(branchCapabilities, requiredOps) {
  if (!requiredOps || requiredOps.length === 0) return { score: WEIGHTS.PROCESSING, capable: true, missingOps: [] }
  const caps = (branchCapabilities || []).map(c => c.toUpperCase())
  const missing = requiredOps.filter(op => !caps.includes(op.toUpperCase()))
  if (missing.length === 0) return { score: WEIGHTS.PROCESSING, capable: true, missingOps: [] }
  const ratio = 1 - (missing.length / requiredOps.length)
  return { score: Math.round(ratio * WEIGHTS.PROCESSING), capable: false, missingOps: missing }
}

function scoreDistance(branchLat, branchLng, destLat, destLng) {
  const miles = haversineApprox(branchLat, branchLng, destLat, destLng)
  if (miles == null) return { score: Math.round(WEIGHTS.DISTANCE * 0.5), miles: null, estimateLabel: 'Unknown' }
  const s = miles <= 30 ? WEIGHTS.DISTANCE
    : miles <= 100 ? WEIGHTS.DISTANCE * 0.7
    : miles <= 250 ? WEIGHTS.DISTANCE * 0.4
    : WEIGHTS.DISTANCE * 0.1
  return { score: Math.round(s), miles, estimateLabel: distanceLabel(miles) }
}

// ── Reason code builder ────────────────────────────────────────────────────
function buildReasons(inv, cutoff, proc, dist) {
  const reasons = []
  // Inventory
  if (inv.available) {
    reasons.push({ code: 'INV_OK', label: `${inv.totalQty} pcs in stock`, impact: 'positive' })
  } else {
    reasons.push({ code: 'INV_NONE', label: 'No inventory at this branch', impact: 'negative' })
  }
  // Cutoff
  if (cutoff.cutoffMet && cutoff.minutesLeft > 60) {
    reasons.push({ code: 'CUTOFF_OK', label: `${Math.floor(cutoff.minutesLeft / 60)}h ${cutoff.minutesLeft % 60}m until cutoff`, impact: 'positive' })
  } else if (cutoff.cutoffMet) {
    reasons.push({ code: 'CUTOFF_SOON', label: `Only ${cutoff.minutesLeft}m until cutoff`, impact: 'neutral' })
  } else {
    reasons.push({ code: 'CUTOFF_PASSED', label: 'Cutoff has passed for today', impact: 'negative' })
  }
  // Processing
  if (proc.capable) {
    reasons.push({ code: 'PROC_OK', label: 'All processing available', impact: 'positive' })
  } else {
    reasons.push({ code: 'PROC_MISSING', label: `Missing: ${proc.missingOps.join(', ')}`, impact: 'negative' })
  }
  // Distance
  if (dist.miles != null) {
    reasons.push({ code: 'DIST', label: `~${dist.miles} mi (${dist.estimateLabel})`, impact: dist.miles < 100 ? 'positive' : 'neutral' })
  }
  return reasons
}

// ── Main API ───────────────────────────────────────────────────────────────

/**
 * Compare all branches for fulfillment suitability.
 *
 * @param {Object} params
 * @param {string} params.division - 'METALS', 'PLASTICS', etc.
 * @param {string[]} [params.requiredProcessing] - e.g. ['SAW', 'DRILL']
 * @param {Object} [params.shipTo] - { lat, lng } or null
 * @param {string} [params.excludeLocationId] - optionally exclude a branch
 * @returns {Promise<{ suggestions: FulfillmentSuggestion[] }>}
 */
export async function compareBranches({ division, requiredProcessing, shipTo, excludeLocationId } = {}) {
  if (!USE_MOCK) {
    const res = await fetch(`${API_BASE}/v1/fulfillment/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ division, requiredProcessing, shipTo, excludeLocationId }),
    })
    if (!res.ok) throw new Error('Branch comparison failed')
    return res.json()
  }

  // ── Mock evaluation ──
  const allCutoffRules = await getAllLocationCutoffRules()
  const rulesMap = {}
  for (const r of allCutoffRules.data || []) {
    rulesMap[r.locationId] = r
  }

  const div = division || 'METALS'
  const suggestions = []

  for (const branch of BRANCH_MASTER) {
    if (excludeLocationId && branch.locationId === excludeLocationId) continue

    const locRules = rulesMap[branch.locationId]
    const divRules = locRules?.divisionRules?.[div]

    const inv = scoreInventory(MOCK_BRANCH_INVENTORY[branch.locationId], div)
    const cutoff = scoreCutoff(
      locRules?.timezone,
      divRules?.cutoffLocal,
      divRules?.shipDays || [],
      locRules?.blackoutWindows || [],
    )
    const proc = scoreProcessing(branch.capabilities, requiredProcessing)
    const dist = scoreDistance(branch.lat, branch.lng, shipTo?.lat, shipTo?.lng)

    const totalScore = inv.score + cutoff.score + proc.score + dist.score

    suggestions.push({
      locationId: branch.locationId,
      locationName: branch.name,
      csrKey: branch.csrKey,
      rank: 0,
      score: totalScore,
      recommended: false,
      reasons: buildReasons(inv, cutoff, proc, dist),
      inventory: { available: inv.available, totalQty: inv.totalQty, totalWeight: inv.totalWeight },
      cutoff: { cutoffLocal: cutoff.cutoffLocal, minutesLeft: cutoff.minutesLeft, cutoffMet: cutoff.cutoffMet },
      processing: { capable: proc.capable, missingOps: proc.missingOps },
      distance: { miles: dist.miles, estimateLabel: dist.estimateLabel },
    })
  }

  // Sort by score descending
  suggestions.sort((a, b) => b.score - a.score)

  // Assign ranks + recommended flag
  suggestions.forEach((s, i) => {
    s.rank = i + 1
    s.recommended = i === 0
  })

  return { suggestions }
}

/**
 * Get a single branch's fulfillment suitability (convenience).
 */
export async function getBranchSuitability(locationId, { division, requiredProcessing, shipTo } = {}) {
  const { suggestions } = await compareBranches({ division, requiredProcessing, shipTo })
  return suggestions.find(s => s.locationId === locationId) || null
}

/**
 * Map a CSR location key (e.g. 'JACKSON') to a loc-id.
 */
export function csrKeyToLocationId(csrKey) {
  const b = BRANCH_MASTER.find(br => br.csrKey === csrKey)
  return b?.locationId || null
}

/**
 * Map a loc-id to a CSR location key.
 */
export function locationIdToCsrKey(locationId) {
  const b = BRANCH_MASTER.find(br => br.locationId === locationId)
  return b?.csrKey || null
}
