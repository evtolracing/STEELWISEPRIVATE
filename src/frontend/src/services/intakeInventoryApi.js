/**
 * Inventory search API — Order Intake Module
 * Searches stock on hand (coils, plate, sheet, remnants). Backed by
 * /api/inventory/search.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export async function searchInventory(query, { locationId, division, isRemnant, limit } = {}) {
  const params = new URLSearchParams()
  if (query) params.set('search', query)
  if (locationId) params.set('locationId', locationId)
  if (division) params.set('division', division)
  if (isRemnant !== undefined) params.set('isRemnant', String(isRemnant))
  if (limit) params.set('limit', String(limit))
  const res = await fetch(`${API_BASE}/inventory/search?${params}`)
  if (!res.ok) throw new Error('Inventory search failed')
  return res.json()
}
