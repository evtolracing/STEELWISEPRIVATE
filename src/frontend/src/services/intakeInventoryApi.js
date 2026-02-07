/**
 * Inventory Availability API — Order Intake Module
 * Check stock levels, reserve, and allocate for orders.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const MOCK_INVENTORY = [
  { id: 'inv-001', productId: 'prod-001', sku: 'HR-A36-PL', description: 'HR A36 Plate 0.50" × 48" × 120"', locationId: 'loc-1', locationName: 'Jackson Branch', division: 'METALS', thickness: 0.5, width: 48, length: 120, weight: 816.0, qty: 12, status: 'AVAILABLE', isRemnant: false, lotNumber: 'L-2024-0891' },
  { id: 'inv-002', productId: 'prod-001', sku: 'HR-A36-PL', description: 'HR A36 Plate 1.0" × 96" × 240"', locationId: 'loc-1', locationName: 'Jackson Branch', division: 'METALS', thickness: 1.0, width: 96, length: 240, weight: 6528.0, qty: 3, status: 'AVAILABLE', isRemnant: false, lotNumber: 'L-2024-0902' },
  { id: 'inv-003', productId: 'prod-003', sku: 'SS-304-SH', description: 'SS 304 Sheet 0.060" × 48" × 120"', locationId: 'loc-1', locationName: 'Jackson Branch', division: 'METALS', thickness: 0.06, width: 48, length: 120, weight: 147.0, qty: 25, status: 'AVAILABLE', isRemnant: false, lotNumber: 'L-2024-1001' },
  { id: 'inv-004', productId: 'prod-004', sku: 'AL-6061-PL', description: 'Al 6061-T6 Plate 0.50" × 48" × 120"', locationId: 'loc-2', locationName: 'Detroit Branch', division: 'METALS', thickness: 0.5, width: 48, length: 120, weight: 280.0, qty: 8, status: 'AVAILABLE', isRemnant: false, lotNumber: 'L-2024-1102' },
  { id: 'inv-005', productId: 'prod-005', sku: 'HDPE-SH-NAT', description: 'HDPE Sheet Nat 1.0" × 48" × 96"', locationId: 'loc-1', locationName: 'Jackson Branch', division: 'PLASTICS', thickness: 1.0, width: 48, length: 96, weight: 188.0, qty: 15, status: 'AVAILABLE', isRemnant: false, lotNumber: 'L-2024-1201' },
  { id: 'inv-006', productId: 'prod-009', sku: 'REM-A36-PL', description: 'Remnant A36 Plate 0.75" × 24" × 36"', locationId: 'loc-1', locationName: 'Jackson Branch', division: 'OUTLET', thickness: 0.75, width: 24, length: 36, weight: 184.0, qty: 1, status: 'AVAILABLE', isRemnant: true, lotNumber: 'REM-0045', remnantDiscount: 0.35 },
  { id: 'inv-007', productId: 'prod-009', sku: 'REM-A36-PL', description: 'Remnant A36 Plate 1.5" × 18" × 48"', locationId: 'loc-1', locationName: 'Jackson Branch', division: 'OUTLET', thickness: 1.5, width: 18, length: 48, weight: 367.0, qty: 1, status: 'AVAILABLE', isRemnant: true, lotNumber: 'REM-0046', remnantDiscount: 0.40 },
]

const USE_MOCK = true

export async function checkAvailability(productId, { locationId, division } = {}) {
  if (USE_MOCK) {
    let items = MOCK_INVENTORY.filter(i => i.productId === productId && i.status === 'AVAILABLE')
    if (locationId) items = items.filter(i => i.locationId === locationId)
    if (division) items = items.filter(i => i.division === division)
    const totalQty = items.reduce((s, i) => s + i.qty, 0)
    const totalWeight = items.reduce((s, i) => s + i.weight * i.qty, 0)
    return { available: items.length > 0, items, totalQty, totalWeight }
  }
  const params = new URLSearchParams({ productId })
  if (locationId) params.set('locationId', locationId)
  if (division) params.set('division', division)
  const res = await fetch(`${API_BASE}/v1/inventory/availability?${params}`)
  if (!res.ok) throw new Error('Availability check failed')
  return res.json()
}

export async function reserveInventory(inventoryId, { orderId, qty, weight }) {
  if (USE_MOCK) {
    return { id: 'res-' + Date.now(), inventoryId, orderId, qty, weight, status: 'RESERVED', reservedAt: new Date().toISOString() }
  }
  const res = await fetch(`${API_BASE}/v1/inventory/${inventoryId}/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, qty, weight }),
  })
  if (!res.ok) throw new Error('Failed to reserve inventory')
  return res.json()
}

export async function searchInventory(query, { locationId, division, isRemnant } = {}) {
  if (USE_MOCK) {
    const q = (query || '').toLowerCase()
    let items = MOCK_INVENTORY.filter(i =>
      i.description.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || i.lotNumber.toLowerCase().includes(q)
    )
    if (locationId) items = items.filter(i => i.locationId === locationId)
    if (division) items = items.filter(i => i.division === division)
    if (isRemnant !== undefined) items = items.filter(i => i.isRemnant === isRemnant)
    return { data: items, meta: { total: items.length } }
  }
  const params = new URLSearchParams()
  if (query) params.set('search', query)
  if (locationId) params.set('locationId', locationId)
  if (division) params.set('division', division)
  if (isRemnant !== undefined) params.set('isRemnant', String(isRemnant))
  const res = await fetch(`${API_BASE}/v1/inventory?${params}`)
  if (!res.ok) throw new Error('Inventory search failed')
  return res.json()
}
