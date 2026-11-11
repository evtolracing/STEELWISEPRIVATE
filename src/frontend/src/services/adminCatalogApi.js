/**
 * Admin Catalog API — manage product visibility, divisions, metadata for the online store.
 * Backed by /api/admin/catalog.
 */
const API_BASE = import.meta.env.VITE_API_URL || '/api'

export async function listCatalogItems(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v != null) qs.set(k, String(v)) })
  const res = await fetch(`${API_BASE}/admin/catalog?${qs}`)
  if (!res.ok) throw new Error('Failed to list catalog')
  return res.json()
}

async function patch(productId, path, body, message) {
  const res = await fetch(`${API_BASE}/admin/catalog/${encodeURIComponent(productId)}/${path}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(message)
  return res.json()
}

export async function updateVisibility(productId, visible) {
  return patch(productId, 'visibility', { visible }, 'Failed to update visibility')
}

export async function updateMetadata(productId, metadata) {
  return patch(productId, 'metadata', metadata, 'Failed to update metadata')
}
