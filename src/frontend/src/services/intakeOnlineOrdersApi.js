/**
 * Online Orders API — Order Intake Module
 * Manage the online order inbox: list, accept, reject, request-info.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const USE_MOCK = true

const MOCK_ONLINE = [
  { id: 'on-001', externalOrderId: 'WEB-90201', source: 'ONLINE', status: 'NEEDS_REVIEW', customerName: 'ABC Manufacturing', customerEmail: 'orders@abcmfg.com', receivedAt: '2026-02-07T08:15:00Z', items: [{ sku: 'HR-A36-PL', description: 'A36 Plate 0.5" × 48" × 120"', qty: 4, unitPrice: 343.73 }], subtotal: 1374.91, shippingMethod: 'FLATBED', notes: 'Need by Feb 14' },
  { id: 'on-002', externalOrderId: 'WEB-90205', source: 'ONLINE', status: 'NEEDS_REVIEW', customerName: 'Precision Parts Co', customerEmail: 'buy@precparts.com', receivedAt: '2026-02-07T09:30:00Z', items: [{ sku: 'SS-304-SH', description: '304 SS Sheet 0.060" × 48" × 120"', qty: 10, unitPrice: 271.95 }, { sku: 'CUT-DISC-9', description: 'Cut-Off Disc 9"', qty: 25, unitPrice: 6.49 }], subtotal: 2881.75, shippingMethod: 'UPS_FREIGHT', notes: '' },
  { id: 'on-003', externalOrderId: 'WEB-90208', source: 'ONLINE', status: 'NEEDS_REVIEW', customerName: 'Metro Fabricators', customerEmail: 'purchasing@metrofab.com', receivedAt: '2026-02-07T10:45:00Z', items: [{ sku: 'AL-6061-PL', description: '6061-T6 Al Plate 1.0" × 48" × 96"', qty: 2, unitPrice: 1372.80 }], subtotal: 2745.60, shippingMethod: 'WILL_CALL', notes: 'Will pick up at Detroit branch' },
  { id: 'on-004', externalOrderId: 'WEB-90199', source: 'ONLINE', status: 'HOLD', customerName: 'Unknown Buyer', customerEmail: 'joe@example.com', receivedAt: '2026-02-06T16:20:00Z', items: [{ sku: 'HR-A572-PL', description: 'A572-50 Plate 2" × 96" × 240"', qty: 1, unitPrice: 9408.00 }], subtotal: 9408.00, shippingMethod: 'FLATBED', notes: 'Large order — verify credit', holdReason: 'Customer not in system — credit check required' },
]

export async function listOnlineOrders({ status } = {}) {
  if (USE_MOCK) {
    let list = [...MOCK_ONLINE]
    if (status) list = list.filter(o => o.status === status)
    return { data: list, meta: { total: list.length, needsReview: MOCK_ONLINE.filter(o => o.status === 'NEEDS_REVIEW').length } }
  }
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  const res = await fetch(`${API_BASE}/orders/online?${params}`)
  if (!res.ok) throw new Error('Failed to list online orders')
  return res.json()
}

export async function acceptOnlineOrder(id, { customerId, division = 'METALS', locationId } = {}) {
  if (USE_MOCK) {
    const idx = MOCK_ONLINE.findIndex(o => o.id === id)
    if (idx >= 0) MOCK_ONLINE[idx].status = 'ACCEPTED'
    return { ...MOCK_ONLINE[idx], internalOrderId: 'ord-' + Date.now(), status: 'ACCEPTED' }
  }
  const res = await fetch(`${API_BASE}/orders/online/${id}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId, division, locationId }),
  })
  if (!res.ok) throw new Error('Failed to accept online order')
  return res.json()
}

export async function holdOnlineOrder(id, reason) {
  if (USE_MOCK) {
    const idx = MOCK_ONLINE.findIndex(o => o.id === id)
    if (idx >= 0) { MOCK_ONLINE[idx].status = 'HOLD'; MOCK_ONLINE[idx].holdReason = reason }
    return MOCK_ONLINE[idx]
  }
  const res = await fetch(`${API_BASE}/orders/online/${id}/hold`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
  if (!res.ok) throw new Error('Failed to hold online order')
  return res.json()
}

export async function rejectOnlineOrder(id, reason) {
  if (USE_MOCK) {
    const idx = MOCK_ONLINE.findIndex(o => o.id === id)
    if (idx >= 0) { MOCK_ONLINE[idx].status = 'REJECTED'; MOCK_ONLINE[idx].rejectReason = reason }
    return MOCK_ONLINE[idx]
  }
  const res = await fetch(`${API_BASE}/orders/online/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
  if (!res.ok) throw new Error('Failed to reject online order')
  return res.json()
}
