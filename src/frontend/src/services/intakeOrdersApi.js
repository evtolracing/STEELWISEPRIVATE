/**
 * Orders API — Order Intake Module
 * Create, update, submit orders. Convert quotes → orders → work orders.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const USE_MOCK = false

let _mockOrders = []
let _seq = 1000

function nextOrderNumber() {
  _seq += 1
  return `ORD-${new Date().getFullYear()}-${String(_seq).padStart(4, '0')}`
}

export async function createIntakeOrder(payload) {
  if (USE_MOCK) {
    const order = {
      id: 'ord-' + Date.now(),
      orderNumber: nextOrderNumber(),
      status: payload.status || 'DRAFT',
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    _mockOrders.unshift(order)
    return { data: order }
  }
  const res = await fetch(`${API_BASE}/orders/intake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Failed to create order') }
  return res.json()
}

export async function updateIntakeOrder(id, payload) {
  if (USE_MOCK) {
    const idx = _mockOrders.findIndex(o => o.id === id)
    if (idx >= 0) _mockOrders[idx] = { ..._mockOrders[idx], ...payload, updatedAt: new Date().toISOString() }
    return { data: _mockOrders[idx] || { id, ...payload } }
  }
  const res = await fetch(`${API_BASE}/orders/intake/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to update order')
  return res.json()
}

export async function submitOrder(id) {
  if (USE_MOCK) {
    const idx = _mockOrders.findIndex(o => o.id === id)
    if (idx >= 0) { _mockOrders[idx].status = 'SUBMITTED'; _mockOrders[idx].submittedAt = new Date().toISOString() }
    return { data: _mockOrders[idx] || { id, status: 'SUBMITTED' } }
  }
  const res = await fetch(`${API_BASE}/orders/intake/${id}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
  if (!res.ok) throw new Error('Failed to submit order')
  return res.json()
}

export async function getIntakeOrder(id) {
  if (USE_MOCK) {
    const order = _mockOrders.find(o => o.id === id) || null
    return { data: order }
  }
  const res = await fetch(`${API_BASE}/orders/intake/${id}`)
  if (!res.ok) throw new Error('Failed to get order')
  return res.json()
}

export async function listIntakeOrders({ status, source, division, limit = 50, offset = 0 } = {}) {
  if (USE_MOCK) {
    let list = [..._mockOrders]
    if (status) list = list.filter(o => o.status === status)
    if (source) list = list.filter(o => o.source === source)
    if (division) list = list.filter(o => o.division === division)
    return { data: list.slice(offset, offset + limit), meta: { total: list.length } }
  }
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  if (status) params.set('status', status)
  if (source) params.set('source', source)
  if (division) params.set('division', division)
  const res = await fetch(`${API_BASE}/orders/intake?${params}`)
  if (!res.ok) throw new Error('Failed to list orders')
  return res.json()
}

export async function convertQuoteToOrder(quoteId) {
  if (USE_MOCK) {
    const order = {
      id: 'ord-' + Date.now(),
      orderNumber: nextOrderNumber(),
      status: 'DRAFT',
      source: 'QUOTE',
      convertedFromQuoteId: quoteId,
      createdAt: new Date().toISOString(),
      lines: [],
    }
    _mockOrders.unshift(order)
    return { data: order }
  }
  const res = await fetch(`${API_BASE}/orders/intake/convert-quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quoteId }),
  })
  if (!res.ok) throw new Error('Failed to convert quote')
  return res.json()
}

export async function createWorkOrdersFromOrder(orderId) {
  if (USE_MOCK) {
    const order = _mockOrders.find(o => o.id === orderId)
    const workOrders = (order?.lines || [])
      .filter(l => l.lineType === 'MATERIAL' && l.processes?.length > 0)
      .map((line, i) => ({
        id: 'wo-' + Date.now() + '-' + i,
        workOrderNumber: `WO-${new Date().getFullYear()}-${String(2000 + i).padStart(4, '0')}`,
        orderId,
        orderLineId: line.id,
        status: 'CREATED',
        processes: line.processes,
        createdAt: new Date().toISOString(),
      }))
    if (order) { order.status = 'PROCESSING'; order.workOrderIds = workOrders.map(w => w.id) }
    return { data: { workOrders, count: workOrders.length } }
  }
  const res = await fetch(`${API_BASE}/orders/intake/${orderId}/create-work-orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
  if (!res.ok) throw new Error('Failed to create work orders')
  return res.json()
}
