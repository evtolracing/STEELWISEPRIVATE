/**
 * Products & Catalog API — Order Intake Module
 * Search the product catalog, division-aware. Backed by /api/products.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export async function searchProducts(query, { division, category, limit = 25 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (query) params.set('search', query)
  if (division) params.set('division', division)
  if (category) params.set('category', category)
  const res = await fetch(`${API_BASE}/products/search?${params}`)
  if (!res.ok) throw new Error('Product search failed')
  return res.json()
}

export async function getProductById(id) {
  const res = await fetch(`${API_BASE}/products/${id}`)
  if (!res.ok) throw new Error('Failed to fetch product')
  return res.json()
}

export async function getProductCategories(division) {
  const res = await fetch(`${API_BASE}/products/categories${division ? `?division=${encodeURIComponent(division)}` : ''}`)
  if (!res.ok) throw new Error('Failed to fetch categories')
  return res.json()
}
