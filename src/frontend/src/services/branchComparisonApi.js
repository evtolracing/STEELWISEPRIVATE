/**
 * Which branch suits an order best: asked of the server, which scores the real branches the store sells from
 * on stock, cut-off time, processing and distance (backend lib/branchComparison.js).
 *
 * One suggestion:
 * {
 *   locationId, locationName, locationCode, csrKey (the branch code), rank, score, recommended,
 *   reasons: [{ code, label, impact }],
 *   inventory: { available, totalQty, totalWeight },
 *   cutoff: { cutoffLocal, minutesLeft, cutoffMet, isSet },
 *   processing: { capable, missingOps },
 *   distance: { miles, estimateLabel },
 * }
 */
const API_BASE = import.meta.env.VITE_API_URL || '/api'

/**
 * @param {Object} params
 * @param {string} params.division - 'METALS', 'PLASTICS', etc.
 * @param {string[]} [params.requiredProcessing] - e.g. ['SAW', 'DRILL']
 * @param {Object} [params.shipTo] - { lat, lng } or null
 * @param {string} [params.excludeLocationId] - a branch to leave out
 * @returns {Promise<{ suggestions: Object[] }>}
 */
export async function compareBranches({ division, requiredProcessing, shipTo, excludeLocationId } = {}) {
  const res = await fetch(`${API_BASE}/ecom/branch-comparison`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ division, requiredProcessing, shipTo, excludeLocationId }),
  })
  if (!res.ok) throw new Error('The branches could not be compared')
  return res.json()
}

/** One branch's suitability. */
export async function getBranchSuitability(locationId, { division, requiredProcessing, shipTo } = {}) {
  const { suggestions } = await compareBranches({ division, requiredProcessing, shipTo })
  return suggestions.find(s => s.locationId === locationId) || null
}
