/**
 * Products & Catalog API — Order Intake Module
 * Search product catalog, get product details, division-aware.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const MOCK_PRODUCTS = [
  { id: 'prod-001', sku: 'HR-A36-PL', name: 'Hot Rolled A36 Plate', form: 'PLATE', grade: 'A36', spec: 'ASTM A36', division: 'METALS', category: 'Carbon Steel', thicknessRange: '0.25" – 4.0"', widthRange: '48" – 96"', basePrice: 0.42, priceUnit: 'LB', inStock: true },
  { id: 'prod-002', sku: 'CR-1018-BR', name: 'Cold Rolled 1018 Bar', form: 'BAR', grade: '1018', spec: 'ASTM A108', division: 'METALS', category: 'Carbon Steel', thicknessRange: '0.5" – 6.0" dia', widthRange: 'N/A', basePrice: 0.68, priceUnit: 'LB', inStock: true },
  { id: 'prod-003', sku: 'SS-304-SH', name: 'Stainless 304 Sheet', form: 'SHEET', grade: '304', spec: 'ASTM A240', division: 'METALS', category: 'Stainless Steel', thicknessRange: '0.024" – 0.187"', widthRange: '36" – 60"', basePrice: 1.85, priceUnit: 'LB', inStock: true },
  { id: 'prod-004', sku: 'AL-6061-PL', name: 'Aluminum 6061-T6 Plate', form: 'PLATE', grade: '6061-T6', spec: 'ASTM B209', division: 'METALS', category: 'Aluminum', thicknessRange: '0.25" – 6.0"', widthRange: '48" – 60"', basePrice: 2.45, priceUnit: 'LB', inStock: true },
  { id: 'prod-005', sku: 'HDPE-SH-NAT', name: 'HDPE Sheet Natural', form: 'SHEET', grade: 'HDPE', spec: 'ASTM D4976', division: 'PLASTICS', category: 'Polyethylene', thicknessRange: '0.125" – 4.0"', widthRange: '48" – 60"', basePrice: 3.20, priceUnit: 'LB', inStock: true },
  { id: 'prod-006', sku: 'UHMW-ROD-WH', name: 'UHMW Rod White', form: 'ROD', grade: 'UHMW', spec: 'ASTM D4020', division: 'PLASTICS', category: 'Ultra-High MW', thicknessRange: '1" – 12" dia', widthRange: 'N/A', basePrice: 5.10, priceUnit: 'LB', inStock: false },
  { id: 'prod-007', sku: 'WG-25', name: 'Welding Gloves – Heavy Duty', form: 'SUPPLY', grade: 'N/A', spec: 'N/A', division: 'SUPPLIES', category: 'Safety', thicknessRange: 'N/A', widthRange: 'N/A', basePrice: 24.99, priceUnit: 'EA', inStock: true },
  { id: 'prod-008', sku: 'CUT-DISC-9', name: 'Cut-Off Disc 9"', form: 'SUPPLY', grade: 'N/A', spec: 'N/A', division: 'SUPPLIES', category: 'Abrasives', thicknessRange: 'N/A', widthRange: 'N/A', basePrice: 6.49, priceUnit: 'EA', inStock: true },
  { id: 'prod-009', sku: 'REM-A36-PL', name: 'Remnant A36 Plate (various)', form: 'PLATE', grade: 'A36', spec: 'ASTM A36', division: 'OUTLET', category: 'Remnants', thicknessRange: 'Various', widthRange: 'Various', basePrice: 0.28, priceUnit: 'LB', inStock: true, isRemnant: true },
  { id: 'prod-010', sku: 'HR-A572-PL', name: 'Hot Rolled A572-50 Plate', form: 'PLATE', grade: 'A572-50', spec: 'ASTM A572', division: 'METALS', category: 'HSLA Steel', thicknessRange: '0.25" – 4.0"', widthRange: '48" – 120"', basePrice: 0.48, priceUnit: 'LB', inStock: true },
]

const USE_MOCK = true

export async function searchProducts(query, { division, category, limit = 25 } = {}) {
  if (USE_MOCK) {
    const q = (query || '').toLowerCase()
    let results = MOCK_PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.grade.toLowerCase().includes(q)
    )
    if (division) results = results.filter(p => p.division === division)
    if (category) results = results.filter(p => p.category === category)
    return { data: results.slice(0, limit), meta: { total: results.length } }
  }
  const params = new URLSearchParams({ search: query, limit: String(limit) })
  if (division) params.set('division', division)
  if (category) params.set('category', category)
  const res = await fetch(`${API_BASE}/products?${params}`)
  if (!res.ok) throw new Error('Product search failed')
  return res.json()
}

export async function getProductById(id) {
  if (USE_MOCK) {
    const p = MOCK_PRODUCTS.find(p => p.id === id)
    if (!p) throw new Error('Product not found')
    return p
  }
  const res = await fetch(`${API_BASE}/products/${id}`)
  if (!res.ok) throw new Error('Failed to fetch product')
  return res.json()
}

export async function getProductCategories(division) {
  if (USE_MOCK) {
    const cats = [...new Set(MOCK_PRODUCTS.filter(p => !division || p.division === division).map(p => p.category))]
    return cats.map(c => ({ name: c, count: MOCK_PRODUCTS.filter(p => p.category === c).length }))
  }
  const res = await fetch(`${API_BASE}/products/categories${division ? `?division=${division}` : ''}`)
  if (!res.ok) throw new Error('Failed to fetch categories')
  return res.json()
}
