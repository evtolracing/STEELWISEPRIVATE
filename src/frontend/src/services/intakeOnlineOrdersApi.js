/**
 * Online Orders API — Order Intake Module
 * Online order inbox: list, accept, hold, reject. Backed by /api/orders/online.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'
export async function listOnlineOrders({ status } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  const res = await fetch(`${API_BASE}/orders/online?${params}`)
  if (!res.ok) throw new Error('Failed to list online orders')
  return res.json()
}

export async function acceptOnlineOrder(id, { customerId, division = 'METALS', locationId } = {}) {
  const res = await fetch(`${API_BASE}/orders/online/${id}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId, division, locationId }),
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to accept online order')
  return res.json()
}

export async function holdOnlineOrder(id, reason) {
  const res = await fetch(`${API_BASE}/orders/online/${id}/hold`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
  if (!res.ok) throw new Error('Failed to hold online order')
  return res.json()
}

export async function rejectOnlineOrder(id, reason) {
  const res = await fetch(`${API_BASE}/orders/online/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
  if (!res.ok) throw new Error('Failed to reject online order')
  return res.json()
}
