/**
 * customerAccountApi.js — Enterprise Customer Account API.
 *
 * Multi-branch visibility for large accounts:
 *   - All open orders across branches
 *   - ETA & partial shipment tracking
 *   - Document downloads at scale
 *   - Branch management
 *   - Export (CSV, PDF)
 *   - Permissions enforcement stubs
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const USE_MOCK = true

// ── Permission levels ──────────────────────────────────────────────────────
export const ACCOUNT_ROLES = {
  OWNER:   'OWNER',    // Full access, user management
  ADMIN:   'ADMIN',    // All orders, all branches, exports
  BUYER:   'BUYER',    // Place orders, view own branch
  VIEWER:  'VIEWER',   // Read-only across branches
}

export const ACCOUNT_PERMISSIONS = {
  VIEW_ALL_ORDERS:    'VIEW_ALL_ORDERS',
  VIEW_ALL_BRANCHES:  'VIEW_ALL_BRANCHES',
  EXPORT_DATA:        'EXPORT_DATA',
  DOWNLOAD_DOCUMENTS: 'DOWNLOAD_DOCUMENTS',
  MANAGE_USERS:       'MANAGE_USERS',
  PLACE_ORDERS:       'PLACE_ORDERS',
}

const ROLE_PERMISSIONS = {
  OWNER: Object.values(ACCOUNT_PERMISSIONS),
  ADMIN: ['VIEW_ALL_ORDERS', 'VIEW_ALL_BRANCHES', 'EXPORT_DATA', 'DOWNLOAD_DOCUMENTS', 'PLACE_ORDERS'],
  BUYER: ['VIEW_ALL_ORDERS', 'DOWNLOAD_DOCUMENTS', 'PLACE_ORDERS'],
  VIEWER: ['VIEW_ALL_ORDERS', 'VIEW_ALL_BRANCHES', 'DOWNLOAD_DOCUMENTS'],
}

/**
 * Check if a role has a given permission.
 */
export function hasPermission(role, permission) {
  return (ROLE_PERMISSIONS[role] || []).includes(permission)
}

// ── Mock data ──────────────────────────────────────────────────────────────

const BRANCHES = [
  { id: 'br-1', name: 'Main Plant — Jackson', code: 'JACKSON', address: '123 Industrial Dr, Jackson, MI 49201', primary: true },
  { id: 'br-2', name: 'Detroit Facility', code: 'DETROIT', address: '4500 Michigan Ave, Detroit, MI 48210', primary: false },
  { id: 'br-3', name: 'West MI Warehouse', code: 'KALAMAZOO', address: '890 Commerce Blvd, Kalamazoo, MI 49001', primary: false },
  { id: 'br-4', name: 'Grand Rapids Office', code: 'GRAND_RAPIDS', address: '220 Fulton St, Grand Rapids, MI 49503', primary: false },
]

const MOCK_ACCOUNT = {
  id: 'acct-enterprise-001',
  companyName: 'Great Lakes Fabrication Group',
  accountNumber: 'GLF-ENTERPRISE-2024',
  priceLevel: 'CONTRACT_A',
  creditLimit: 250000,
  creditUsed: 87450,
  paymentTerms: 'Net 30',
  accountRep: { name: 'Sarah Mitchell', email: 'sarah.mitchell@alroware.com', phone: '(517) 555-0142' },
  branches: BRANCHES,
  userRole: 'ADMIN',
  stats: {
    totalOrders: 156,
    openOrders: 12,
    ytdSpend: 842600,
    avgOrderValue: 5402,
    onTimeDelivery: 94.2,
  },
}

const MOCK_ALL_ORDERS = [
  {
    id: 'eo-001', orderNumber: 'WEB-2026-4001', status: 'SHIPPED', source: 'ONLINE',
    branchId: 'br-1', branchName: 'Main Plant — Jackson',
    createdAt: '2026-01-28T14:30:00Z', requestedShipDate: '2026-02-03',
    actualShipDate: '2026-02-03', estimatedDelivery: '2026-02-05',
    lineCount: 3, subtotal: 1245.80, total: 1320.55, poNumber: 'PO-GLF-1028',
    placedBy: 'John Carter', trackingNumber: '1Z999AA10123456784',
    lines: [
      { lineNumber: 1, description: 'HR A36 Plate 1/2" – Cut 24×48', qty: 4, shipped: 4, status: 'DELIVERED' },
      { lineNumber: 2, description: 'Cut-Off Disc 9"', qty: 10, shipped: 10, status: 'DELIVERED' },
      { lineNumber: 3, description: 'SS 304 Sheet 0.060"', qty: 2, shipped: 2, status: 'DELIVERED' },
    ],
  },
  {
    id: 'eo-002', orderNumber: 'WEB-2026-4012', status: 'IN_PROCESS', source: 'REP',
    branchId: 'br-1', branchName: 'Main Plant — Jackson',
    createdAt: '2026-02-04T10:00:00Z', requestedShipDate: '2026-02-10',
    actualShipDate: null, estimatedDelivery: '2026-02-11',
    lineCount: 2, subtotal: 4820.00, total: 5109.20, poNumber: 'PO-GLF-1035',
    placedBy: 'John Carter', trackingNumber: null,
    lines: [
      { lineNumber: 1, description: 'Al 6061 Plate 1/2" – Cut 12×24', qty: 6, shipped: 0, status: 'IN_PROCESS' },
      { lineNumber: 2, description: 'HR A572-50 Plate 1.0"', qty: 2, shipped: 0, status: 'SCHEDULED' },
    ],
  },
  {
    id: 'eo-003', orderNumber: 'WEB-2026-4018', status: 'SHIPPED', source: 'ONLINE',
    branchId: 'br-2', branchName: 'Detroit Facility',
    createdAt: '2026-02-01T08:15:00Z', requestedShipDate: '2026-02-05',
    actualShipDate: '2026-02-05', estimatedDelivery: '2026-02-07',
    lineCount: 4, subtotal: 6340.00, total: 6720.40, poNumber: 'PO-GLF-1031',
    placedBy: 'Maria Lopez', trackingNumber: '1Z999AA10234567891',
    lines: [
      { lineNumber: 1, description: 'HR A36 Angle 3×3×1/4', qty: 20, shipped: 20, status: 'DELIVERED' },
      { lineNumber: 2, description: 'HR A500 Tube 4×4', qty: 10, shipped: 10, status: 'DELIVERED' },
      { lineNumber: 3, description: 'HR A36 Flat Bar 1/2×4', qty: 15, shipped: 8, status: 'PARTIAL' },
      { lineNumber: 4, description: 'Welding Rod E7018', qty: 50, shipped: 50, status: 'DELIVERED' },
    ],
  },
  {
    id: 'eo-004', orderNumber: 'WEB-2026-4022', status: 'CONFIRMED', source: 'ONLINE',
    branchId: 'br-3', branchName: 'West MI Warehouse',
    createdAt: '2026-02-05T11:30:00Z', requestedShipDate: '2026-02-12',
    actualShipDate: null, estimatedDelivery: '2026-02-13',
    lineCount: 1, subtotal: 8400.00, total: 8904.00, poNumber: 'PO-GLF-1037',
    placedBy: 'James Wu', trackingNumber: null,
    lines: [
      { lineNumber: 1, description: 'SS 316L Plate 1.0" – Custom profile', qty: 1, shipped: 0, status: 'CONFIRMED' },
    ],
  },
  {
    id: 'eo-005', orderNumber: 'WEB-2026-4025', status: 'SCHEDULED', source: 'REP',
    branchId: 'br-2', branchName: 'Detroit Facility',
    createdAt: '2026-02-06T09:00:00Z', requestedShipDate: '2026-02-14',
    actualShipDate: null, estimatedDelivery: '2026-02-15',
    lineCount: 3, subtotal: 2150.00, total: 2279.00, poNumber: 'PO-GLF-1039',
    placedBy: 'Maria Lopez', trackingNumber: null,
    lines: [
      { lineNumber: 1, description: 'CR 1018 Sheet 16 Ga', qty: 8, shipped: 0, status: 'SCHEDULED' },
      { lineNumber: 2, description: 'HR A36 Plate 1/4"', qty: 4, shipped: 0, status: 'SCHEDULED' },
      { lineNumber: 3, description: 'Cutting fluid 5 gal', qty: 2, shipped: 0, status: 'PENDING' },
    ],
  },
  {
    id: 'eo-006', orderNumber: 'WEB-2026-4030', status: 'NEEDS_REVIEW', source: 'ONLINE',
    branchId: 'br-4', branchName: 'Grand Rapids Office',
    createdAt: '2026-02-07T14:00:00Z', requestedShipDate: '2026-02-18',
    actualShipDate: null, estimatedDelivery: null,
    lineCount: 2, subtotal: 12800.00, total: 13568.00, poNumber: 'PO-GLF-1042',
    placedBy: 'James Wu', trackingNumber: null,
    lines: [
      { lineNumber: 1, description: 'Titanium Gr5 Rod 2" – Custom length', qty: 3, shipped: 0, status: 'REVIEW' },
      { lineNumber: 2, description: 'Inconel 625 Sheet 0.125"', qty: 1, shipped: 0, status: 'REVIEW' },
    ],
  },
  {
    id: 'eo-007', orderNumber: 'WEB-2026-3998', status: 'COMPLETED', source: 'ONLINE',
    branchId: 'br-1', branchName: 'Main Plant — Jackson',
    createdAt: '2026-01-22T10:00:00Z', requestedShipDate: '2026-01-27',
    actualShipDate: '2026-01-27', estimatedDelivery: '2026-01-29',
    lineCount: 5, subtotal: 3450.00, total: 3657.00, poNumber: 'PO-GLF-1020',
    placedBy: 'John Carter', trackingNumber: '1Z999AA10345678902',
    lines: [
      { lineNumber: 1, description: 'HR A36 Plate 3/8"', qty: 6, shipped: 6, status: 'DELIVERED' },
      { lineNumber: 2, description: 'HR A36 Plate 1/2"', qty: 4, shipped: 4, status: 'DELIVERED' },
      { lineNumber: 3, description: 'SS 304 Round Bar 1"', qty: 10, shipped: 10, status: 'DELIVERED' },
      { lineNumber: 4, description: 'Grinding wheel 7"', qty: 20, shipped: 20, status: 'DELIVERED' },
      { lineNumber: 5, description: 'Safety glasses', qty: 12, shipped: 12, status: 'DELIVERED' },
    ],
  },
  {
    id: 'eo-008', orderNumber: 'WEB-2026-4035', status: 'IN_PROCESS', source: 'ONLINE',
    branchId: 'br-3', branchName: 'West MI Warehouse',
    createdAt: '2026-02-07T08:00:00Z', requestedShipDate: '2026-02-13',
    actualShipDate: null, estimatedDelivery: '2026-02-14',
    lineCount: 2, subtotal: 1890.00, total: 2003.40, poNumber: 'PO-GLF-1041',
    placedBy: 'James Wu', trackingNumber: null,
    lines: [
      { lineNumber: 1, description: 'Al 6061 Plate 1/4"', qty: 10, shipped: 5, status: 'PARTIAL' },
      { lineNumber: 2, description: 'HR A36 Beam W8×31', qty: 2, shipped: 0, status: 'IN_PROCESS' },
    ],
  },
]

const MOCK_SHIPMENTS = [
  {
    id: 'shp-001', shipmentNumber: 'SHP-2026-0812', orderId: 'eo-001', orderNumber: 'WEB-2026-4001',
    branchName: 'Main Plant — Jackson', status: 'DELIVERED',
    carrier: 'FedEx Freight', trackingNumber: '1Z999AA10123456784',
    shipDate: '2026-02-03', estimatedDelivery: '2026-02-05', actualDelivery: '2026-02-05',
    pieces: 3, weight: 842, pallets: 1,
    items: [
      { description: 'HR A36 Plate 1/2"', qty: 4, weight: 680 },
      { description: 'Cut-Off Disc 9"', qty: 10, weight: 12 },
      { description: 'SS 304 Sheet 0.060"', qty: 2, weight: 150 },
    ],
  },
  {
    id: 'shp-002', shipmentNumber: 'SHP-2026-0845', orderId: 'eo-003', orderNumber: 'WEB-2026-4018',
    branchName: 'Detroit Facility', status: 'DELIVERED',
    carrier: 'ABF Freight', trackingNumber: '1Z999AA10234567891',
    shipDate: '2026-02-05', estimatedDelivery: '2026-02-07', actualDelivery: '2026-02-06',
    pieces: 4, weight: 2150, pallets: 2,
    items: [
      { description: 'HR A36 Angle 3×3×1/4', qty: 20, weight: 800 },
      { description: 'HR A500 Tube 4×4', qty: 10, weight: 620 },
      { description: 'HR A36 Flat Bar 1/2×4 (partial)', qty: 8, weight: 680 },
      { description: 'Welding Rod E7018', qty: 50, weight: 50 },
    ],
  },
  {
    id: 'shp-003', shipmentNumber: 'SHP-2026-0860', orderId: 'eo-003', orderNumber: 'WEB-2026-4018',
    branchName: 'Detroit Facility', status: 'PENDING',
    carrier: 'TBD', trackingNumber: null,
    shipDate: null, estimatedDelivery: '2026-02-12', actualDelivery: null,
    pieces: 1, weight: 595, pallets: 1,
    items: [
      { description: 'HR A36 Flat Bar 1/2×4 (backorder)', qty: 7, weight: 595 },
    ],
  },
  {
    id: 'shp-004', shipmentNumber: 'SHP-2026-0870', orderId: 'eo-008', orderNumber: 'WEB-2026-4035',
    branchName: 'West MI Warehouse', status: 'IN_TRANSIT',
    carrier: 'XPO Logistics', trackingNumber: '7X12345678',
    shipDate: '2026-02-07', estimatedDelivery: '2026-02-09', actualDelivery: null,
    pieces: 1, weight: 320, pallets: 1,
    items: [
      { description: 'Al 6061 Plate 1/4" (partial)', qty: 5, weight: 320 },
    ],
  },
]

const MOCK_DOCUMENTS = [
  { id: 'doc-a1', type: 'MTR', name: 'MTR – A36 Plate Heat H-2026-0142.pdf', orderId: 'eo-001', orderNumber: 'WEB-2026-4001', branchName: 'Main Plant — Jackson', createdAt: '2026-02-03', size: '245 KB', url: '#' },
  { id: 'doc-a2', type: 'PACKING_LIST', name: 'Packing List SHP-2026-0812.pdf', orderId: 'eo-001', orderNumber: 'WEB-2026-4001', branchName: 'Main Plant — Jackson', createdAt: '2026-02-03', size: '128 KB', url: '#' },
  { id: 'doc-a3', type: 'BOL', name: 'BOL SHP-2026-0812.pdf', orderId: 'eo-001', orderNumber: 'WEB-2026-4001', branchName: 'Main Plant — Jackson', createdAt: '2026-02-03', size: '98 KB', url: '#' },
  { id: 'doc-a4', type: 'INVOICE', name: 'Invoice INV-2026-4001.pdf', orderId: 'eo-001', orderNumber: 'WEB-2026-4001', branchName: 'Main Plant — Jackson', createdAt: '2026-02-04', size: '156 KB', url: '#' },
  { id: 'doc-a5', type: 'MTR', name: 'MTR – A572-50 Plate Heat H-2026-0155.pdf', orderId: 'eo-003', orderNumber: 'WEB-2026-4018', branchName: 'Detroit Facility', createdAt: '2026-02-05', size: '312 KB', url: '#' },
  { id: 'doc-a6', type: 'PACKING_LIST', name: 'Packing List SHP-2026-0845.pdf', orderId: 'eo-003', orderNumber: 'WEB-2026-4018', branchName: 'Detroit Facility', createdAt: '2026-02-05', size: '134 KB', url: '#' },
  { id: 'doc-a7', type: 'BOL', name: 'BOL SHP-2026-0845.pdf', orderId: 'eo-003', orderNumber: 'WEB-2026-4018', branchName: 'Detroit Facility', createdAt: '2026-02-05', size: '102 KB', url: '#' },
  { id: 'doc-a8', type: 'COC', name: 'Certificate of Conformance – SS 316L.pdf', orderId: 'eo-004', orderNumber: 'WEB-2026-4022', branchName: 'West MI Warehouse', createdAt: '2026-02-06', size: '89 KB', url: '#' },
  { id: 'doc-a9', type: 'MTR', name: 'MTR – A36 Plate Heat H-2026-0138.pdf', orderId: 'eo-007', orderNumber: 'WEB-2026-3998', branchName: 'Main Plant — Jackson', createdAt: '2026-01-27', size: '278 KB', url: '#' },
  { id: 'doc-a10', type: 'INVOICE', name: 'Invoice INV-2026-3998.pdf', orderId: 'eo-007', orderNumber: 'WEB-2026-3998', branchName: 'Main Plant — Jackson', createdAt: '2026-01-29', size: '148 KB', url: '#' },
  { id: 'doc-a11', type: 'PACKING_LIST', name: 'Packing List SHP-2026-0870.pdf', orderId: 'eo-008', orderNumber: 'WEB-2026-4035', branchName: 'West MI Warehouse', createdAt: '2026-02-07', size: '118 KB', url: '#' },
  { id: 'doc-a12', type: 'MTR', name: 'MTR – 6061 Plate Heat H-2026-0180.pdf', orderId: 'eo-008', orderNumber: 'WEB-2026-4035', branchName: 'West MI Warehouse', createdAt: '2026-02-07', size: '290 KB', url: '#' },
]

// ── API Functions ──────────────────────────────────────────────────────────

/**
 * Get enterprise account profile with branches and stats.
 */
export async function getAccountProfile(accountId) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return { data: MOCK_ACCOUNT }
  }
  const res = await fetch(`${API_BASE}/enterprise/accounts/${accountId}`)
  if (!res.ok) throw new Error('Failed to load account')
  return res.json()
}

/**
 * List all orders across branches. Supports filters.
 */
export async function listAccountOrders(params = {}) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 400))
    let orders = [...MOCK_ALL_ORDERS]
    if (params.branchId) orders = orders.filter(o => o.branchId === params.branchId)
    if (params.status) orders = orders.filter(o => o.status === params.status)
    if (params.search) {
      const q = params.search.toLowerCase()
      orders = orders.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.poNumber?.toLowerCase().includes(q) ||
        o.placedBy?.toLowerCase().includes(q) ||
        o.lines?.some(l => l.description.toLowerCase().includes(q))
      )
    }
    if (params.dateFrom) orders = orders.filter(o => o.createdAt >= params.dateFrom)
    if (params.dateTo) orders = orders.filter(o => o.createdAt <= params.dateTo)
    if (params.sortBy === 'total') orders.sort((a, b) => b.total - a.total)
    else if (params.sortBy === 'date') orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return { data: orders, meta: { total: orders.length, openCount: orders.filter(o => !['SHIPPED', 'COMPLETED'].includes(o.status)).length } }
  }
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v) })
  const res = await fetch(`${API_BASE}/enterprise/orders?${qs}`)
  if (!res.ok) throw new Error('Failed to list account orders')
  return res.json()
}

/**
 * Get a single order with full detail + line-level ship status.
 */
export async function getAccountOrderDetail(orderId) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 250))
    const order = MOCK_ALL_ORDERS.find(o => o.id === orderId)
    if (!order) throw new Error('Order not found')
    return { data: order }
  }
  const res = await fetch(`${API_BASE}/enterprise/orders/${orderId}`)
  if (!res.ok) throw new Error('Failed to load order')
  return res.json()
}

/**
 * List all shipments across branches.
 */
export async function listAccountShipments(params = {}) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 350))
    let shipments = [...MOCK_SHIPMENTS]
    if (params.branchId) {
      const branchName = BRANCHES.find(b => b.id === params.branchId)?.name
      shipments = shipments.filter(s => s.branchName === branchName)
    }
    if (params.status) shipments = shipments.filter(s => s.status === params.status)
    if (params.search) {
      const q = params.search.toLowerCase()
      shipments = shipments.filter(s =>
        s.shipmentNumber.toLowerCase().includes(q) ||
        s.orderNumber.toLowerCase().includes(q) ||
        s.trackingNumber?.toLowerCase().includes(q)
      )
    }
    return { data: shipments, meta: { total: shipments.length } }
  }
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v) })
  const res = await fetch(`${API_BASE}/enterprise/shipments?${qs}`)
  if (!res.ok) throw new Error('Failed to list shipments')
  return res.json()
}

/**
 * List all documents across branches with filtering.
 */
export async function listAccountDocuments(params = {}) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 300))
    let docs = [...MOCK_DOCUMENTS]
    if (params.branchId) {
      const branchName = BRANCHES.find(b => b.id === params.branchId)?.name
      docs = docs.filter(d => d.branchName === branchName)
    }
    if (params.type) docs = docs.filter(d => d.type === params.type)
    if (params.orderId) docs = docs.filter(d => d.orderId === params.orderId)
    if (params.search) {
      const q = params.search.toLowerCase()
      docs = docs.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.orderNumber.toLowerCase().includes(q)
      )
    }
    return { data: docs, meta: { total: docs.length } }
  }
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v) })
  const res = await fetch(`${API_BASE}/enterprise/documents?${qs}`)
  if (!res.ok) throw new Error('Failed to list documents')
  return res.json()
}

/**
 * Download a single document by ID.
 */
export async function downloadDocument(docId) {
  if (USE_MOCK) {
    // Simulate download — in prod this would stream a blob
    await new Promise(r => setTimeout(r, 200))
    return { success: true, message: 'Download started' }
  }
  const res = await fetch(`${API_BASE}/enterprise/documents/${docId}/download`)
  if (!res.ok) throw new Error('Download failed')
  return res.blob()
}

/**
 * Bulk download documents as ZIP.
 */
export async function bulkDownloadDocuments(docIds) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return { success: true, message: `${docIds.length} documents queued for download` }
  }
  const res = await fetch(`${API_BASE}/enterprise/documents/bulk-download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentIds: docIds }),
  })
  if (!res.ok) throw new Error('Bulk download failed')
  return res.blob()
}

/**
 * Export orders to CSV.
 */
export async function exportOrdersCSV(params = {}) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const orders = (await listAccountOrders(params)).data
    const header = 'Order #,PO,Branch,Status,Date,Items,Total,Placed By,Tracking'
    const rows = orders.map(o =>
      `${o.orderNumber},${o.poNumber || ''},${o.branchName},${o.status},${o.createdAt.split('T')[0]},${o.lineCount},${o.total},${o.placedBy || ''},${o.trackingNumber || ''}`
    )
    const csv = [header, ...rows].join('\n')
    return { data: csv, filename: `orders-export-${new Date().toISOString().split('T')[0]}.csv` }
  }
  const qs = new URLSearchParams({ ...params, format: 'csv' })
  const res = await fetch(`${API_BASE}/enterprise/orders/export?${qs}`)
  if (!res.ok) throw new Error('Export failed')
  return { data: await res.text(), filename: `orders-export-${new Date().toISOString().split('T')[0]}.csv` }
}

/**
 * Get account-level KPIs.
 */
export async function getAccountKPIs(accountId) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 200))
    return {
      data: {
        openOrders: 6,
        totalOrders: 8,
        openValue: 37583.60,
        shippedThisWeek: 2,
        pendingShipments: 2,
        documentsAvailable: 12,
        partialShipments: 2,
        onTimeRate: 94.2,
        branchBreakdown: [
          { branchId: 'br-1', name: 'Jackson', openOrders: 1, totalSpend: 6429.55 },
          { branchId: 'br-2', name: 'Detroit', openOrders: 2, totalSpend: 8999.40 },
          { branchId: 'br-3', name: 'Kalamazoo', openOrders: 2, totalSpend: 10907.40 },
          { branchId: 'br-4', name: 'Grand Rapids', openOrders: 1, totalSpend: 13568.00 },
        ],
      },
    }
  }
  const res = await fetch(`${API_BASE}/enterprise/accounts/${accountId}/kpis`)
  if (!res.ok) throw new Error('Failed to load KPIs')
  return res.json()
}

// ── Document type labels ───────────────────────────────────────────────────
export const DOC_TYPE_LABELS = {
  MTR: 'Mill Test Report',
  PACKING_LIST: 'Packing List',
  BOL: 'Bill of Lading',
  INVOICE: 'Invoice',
  COC: 'Certificate of Conformance',
  PO: 'Purchase Order',
  QUOTE: 'Quote',
}

export const DOC_TYPE_COLORS = {
  MTR: 'info',
  PACKING_LIST: 'default',
  BOL: 'secondary',
  INVOICE: 'warning',
  COC: 'success',
  PO: 'primary',
  QUOTE: 'default',
}
