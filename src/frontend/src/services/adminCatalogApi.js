/**
 * Admin Catalog API — manage product visibility, divisions, metadata.
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const USE_MOCK = true

const MOCK_CATALOG_ITEMS = [
  { id: 'prod-001', sku: 'HR-A36-PL', name: 'Hot Rolled A36 Plate', division: 'METALS', visible: true, featured: true, sortOrder: 1 },
  { id: 'prod-002', sku: 'CR-1018-BR', name: 'Cold Rolled 1018 Bar', division: 'METALS', visible: true, featured: false, sortOrder: 2 },
  { id: 'prod-003', sku: 'SS-304-SH', name: 'Stainless 304 Sheet', division: 'METALS', visible: true, featured: true, sortOrder: 3 },
  { id: 'prod-004', sku: 'AL-6061-PL', name: 'Aluminum 6061-T6 Plate', division: 'METALS', visible: true, featured: false, sortOrder: 4 },
  { id: 'prod-005', sku: 'HDPE-SH-NAT', name: 'HDPE Sheet Natural', division: 'PLASTICS', visible: true, featured: false, sortOrder: 5 },
  { id: 'prod-006', sku: 'UHMW-ROD-WH', name: 'UHMW Rod White', division: 'PLASTICS', visible: true, featured: false, sortOrder: 6 },
  { id: 'prod-007', sku: 'WG-25', name: 'Welding Gloves – Heavy Duty', division: 'SUPPLIES', visible: true, featured: false, sortOrder: 7 },
  { id: 'prod-008', sku: 'CUT-DISC-9', name: 'Cut-Off Disc 9"', division: 'SUPPLIES', visible: true, featured: false, sortOrder: 8 },
  { id: 'prod-009', sku: 'REM-A36-PL', name: 'Remnant A36 Plate', division: 'OUTLET', visible: true, featured: false, sortOrder: 9 },
  { id: 'prod-010', sku: 'HR-A572-PL', name: 'Hot Rolled A572-50 Plate', division: 'METALS', visible: true, featured: false, sortOrder: 10 },
  { id: 'prod-011', sku: 'SS-316-PL', name: 'Stainless 316L Plate', division: 'METALS', visible: false, featured: false, sortOrder: 11 },
  { id: 'prod-012', sku: 'BR-C360-RD', name: 'Brass C360 Round Bar', division: 'METALS', visible: true, featured: false, sortOrder: 12 },
]

let _items = [...MOCK_CATALOG_ITEMS]

export async function listCatalogItems(params = {}) {
  if (USE_MOCK) {
    let items = [..._items]
    if (params.division) items = items.filter(i => i.division === params.division)
    if (params.visibleOnly) items = items.filter(i => i.visible)
    return { data: items, meta: { total: items.length } }
  }
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v != null) qs.set(k, String(v)) })
  const res = await fetch(`${API_BASE}/admin/catalog?${qs}`)
  if (!res.ok) throw new Error('Failed to list catalog')
  return res.json()
}

export async function updateVisibility(productId, visible) {
  if (USE_MOCK) {
    const idx = _items.findIndex(i => i.id === productId)
    if (idx >= 0) _items[idx] = { ..._items[idx], visible }
    return { success: true, item: _items[idx] }
  }
  const res = await fetch(`${API_BASE}/admin/catalog/${productId}/visibility`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visible }),
  })
  if (!res.ok) throw new Error('Failed to update visibility')
  return res.json()
}

export async function updateMetadata(productId, metadata) {
  if (USE_MOCK) {
    const idx = _items.findIndex(i => i.id === productId)
    if (idx >= 0) _items[idx] = { ..._items[idx], ...metadata }
    return { success: true, item: _items[idx] }
  }
  const res = await fetch(`${API_BASE}/admin/catalog/${productId}/metadata`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(metadata),
  })
  if (!res.ok) throw new Error('Failed to update metadata')
  return res.json()
}
