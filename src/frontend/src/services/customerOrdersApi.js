/**
 * Customer Orders API — "My Orders" for customer portal.
 * List, detail, documents for the logged-in customer's orders.
 */
const API_BASE = import.meta.env.VITE_API_URL || '/api'
const USE_MOCK = true

const MOCK_MY_ORDERS = [
  {
    id: 'myord-001', orderNumber: 'WEB-2026-4001', status: 'SHIPPED', source: 'ONLINE',
    createdAt: '2026-01-28T14:30:00Z', updatedAt: '2026-02-03T09:15:00Z',
    requestedShipDate: '2026-02-03', shipTo: { name: 'Main Plant', address: '123 Industrial Dr', city: 'Jackson', state: 'MI', zip: '49201' },
    lineCount: 3, subtotal: 1245.80, tax: 74.75, total: 1320.55,
    trackingNumber: '1Z999AA10123456784',
    statusHistory: [
      { status: 'DRAFT', at: '2026-01-28T14:30:00Z' },
      { status: 'NEEDS_REVIEW', at: '2026-01-28T14:30:00Z' },
      { status: 'CONFIRMED', at: '2026-01-28T16:00:00Z' },
      { status: 'SCHEDULED', at: '2026-01-29T08:00:00Z' },
      { status: 'IN_PROCESS', at: '2026-01-30T07:00:00Z' },
      { status: 'READY_TO_SHIP', at: '2026-02-02T15:00:00Z' },
      { status: 'SHIPPED', at: '2026-02-03T09:15:00Z' },
    ],
    documents: [
      { id: 'doc-001', type: 'PACKING_LIST', name: 'Packing List WEB-2026-4001.pdf', url: '#' },
      { id: 'doc-002', type: 'MTR', name: 'MTR – A36 Plate Heat L-2024-0891.pdf', url: '#' },
    ],
    lines: [
      { lineNumber: 1, sku: 'HR-A36-PL', description: 'HR A36 Plate 0.50" – Cut 24" × 48"', qty: 4, unitPrice: 0.39, extPrice: 637.20 },
      { lineNumber: 2, sku: 'CUT-DISC-9', description: 'Cut-Off Disc 9"', qty: 10, unitPrice: 6.49, extPrice: 64.90 },
      { lineNumber: 3, sku: 'SS-304-SH', description: 'SS 304 Sheet 0.060" – Full sheet', qty: 2, unitPrice: 271.85, extPrice: 543.70 },
    ],
  },
  {
    id: 'myord-002', orderNumber: 'WEB-2026-4002', status: 'IN_PROCESS', source: 'ONLINE',
    createdAt: '2026-02-04T10:00:00Z', updatedAt: '2026-02-06T08:30:00Z',
    requestedShipDate: '2026-02-10', shipTo: { name: 'Main Plant', address: '123 Industrial Dr', city: 'Jackson', state: 'MI', zip: '49201' },
    lineCount: 2, subtotal: 892.40, tax: 53.54, total: 945.94,
    trackingNumber: null,
    statusHistory: [
      { status: 'DRAFT', at: '2026-02-04T10:00:00Z' },
      { status: 'NEEDS_REVIEW', at: '2026-02-04T10:00:00Z' },
      { status: 'CONFIRMED', at: '2026-02-04T11:30:00Z' },
      { status: 'SCHEDULED', at: '2026-02-05T08:00:00Z' },
      { status: 'IN_PROCESS', at: '2026-02-06T08:30:00Z' },
    ],
    documents: [],
    lines: [
      { lineNumber: 1, sku: 'AL-6061-PL', description: 'Al 6061-T6 Plate 0.50" – Cut 12" × 24"', qty: 6, unitPrice: 2.26, extPrice: 488.40 },
      { lineNumber: 2, sku: 'HR-A572-PL', description: 'HR A572-50 Plate 1.0" – Cut 24" × 36"', qty: 2, unitPrice: 202.00, extPrice: 404.00 },
    ],
  },
  {
    id: 'myord-003', orderNumber: 'WEB-2026-4003', status: 'NEEDS_REVIEW', source: 'ONLINE',
    createdAt: '2026-02-06T16:45:00Z', updatedAt: '2026-02-06T16:45:00Z',
    requestedShipDate: '2026-02-14', shipTo: { name: 'South Warehouse', address: '456 Commerce Blvd', city: 'Kalamazoo', state: 'MI', zip: '49001' },
    lineCount: 1, subtotal: 3200.00, tax: 192.00, total: 3392.00,
    trackingNumber: null, quoteRequested: true,
    statusHistory: [
      { status: 'DRAFT', at: '2026-02-06T16:45:00Z' },
      { status: 'NEEDS_REVIEW', at: '2026-02-06T16:45:00Z' },
    ],
    documents: [],
    lines: [
      { lineNumber: 1, sku: 'SS-316-PL', description: 'SS 316L Plate 1.0" – Custom profile cut', qty: 1, unitPrice: 3200.00, extPrice: 3200.00, priceSource: 'REVIEW_REQUIRED' },
    ],
  },
]

export async function listMyOrders(params = {}) {
  if (USE_MOCK) {
    let orders = [...MOCK_MY_ORDERS]
    if (params.status) orders = orders.filter(o => o.status === params.status)
    return { data: orders, meta: { total: orders.length } }
  }
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v) })
  const res = await fetch(`${API_BASE}/ecom/my-orders?${qs}`)
  if (!res.ok) throw new Error('Failed to list orders')
  return res.json()
}

export async function getMyOrderById(id) {
  if (USE_MOCK) {
    const order = MOCK_MY_ORDERS.find(o => o.id === id)
    if (!order) throw new Error('Order not found')
    return { data: order }
  }
  const res = await fetch(`${API_BASE}/ecom/my-orders/${id}`)
  if (!res.ok) throw new Error('Failed to fetch order')
  return res.json()
}

export async function getMyOrderDocuments(id) {
  if (USE_MOCK) {
    const order = MOCK_MY_ORDERS.find(o => o.id === id)
    return { data: order?.documents || [] }
  }
  const res = await fetch(`${API_BASE}/ecom/my-orders/${id}/documents`)
  if (!res.ok) throw new Error('Failed to fetch documents')
  return res.json()
}
