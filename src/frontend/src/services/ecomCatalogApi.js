/**
 * E-Commerce Catalog API
 * Product search, detail, availability for customer-facing portal. Backed by /api/ecom/catalog.
 */
const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function getJson(url, message) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(message)
  return res.json()
}

export async function searchProducts(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') qs.set(k, v) })
  return getJson(`${API_BASE}/ecom/catalog?${qs}`, 'Catalog search failed')
}

export async function getProduct(id) {
  return getJson(`${API_BASE}/ecom/catalog/${encodeURIComponent(id)}`, 'Failed to fetch product')
}

export async function getAvailability(productId, locationId) {
  const qs = new URLSearchParams({ productId })
  if (locationId) qs.set('locationId', locationId)
  return getJson(`${API_BASE}/ecom/catalog/availability?${qs}`, 'Availability check failed')
}

export async function getDivisions() {
  return getJson(`${API_BASE}/ecom/catalog/divisions`, 'Failed to fetch divisions')
}

export async function getFamilies(division) {
  return getJson(`${API_BASE}/ecom/catalog/families?division=${encodeURIComponent(division || '')}`, 'Failed to fetch families')
}
