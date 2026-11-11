/**
 * Customer Orders API — "My Orders" for customer portal.
 * List, detail, documents for the customer's web orders. Backed by /api/ecom/my-orders.
 */
const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function getJson(url, message) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(message)
  return res.json()
}

export async function listMyOrders(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v) })
  return getJson(`${API_BASE}/ecom/my-orders?${qs}`, 'Failed to list orders')
}

export async function getMyOrderById(id) {
  return getJson(`${API_BASE}/ecom/my-orders/${encodeURIComponent(id)}`, 'Failed to fetch order')
}

export async function getMyOrderDocuments(id) {
  return getJson(`${API_BASE}/ecom/my-orders/${encodeURIComponent(id)}/documents`, 'Failed to fetch documents')
}
