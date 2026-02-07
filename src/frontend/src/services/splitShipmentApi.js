/**
 * splitShipmentApi.js — Service for partial fulfillment & split shipment operations.
 *
 * Data model additions:
 *   OrderLine  → qtyOrdered / qtyShipped / qtyRemaining  (already in DB schema)
 *   Shipment   → parentOrderId, splitIndex, splitGroupId
 *   SplitEvent → audit trail entry per split action
 *
 * Mock-first: everything runs locally when window.__USE_MOCK_RULES__ ≠ false.
 */

const USE_MOCK = window.__USE_MOCK_RULES__ !== false

// ─── STATUS ENUMS ────────────────────────────────────────────────────────────
export const ORDER_FULFILLMENT_STATUS = {
  UNFULFILLED: 'UNFULFILLED',
  PARTIAL:     'PARTIAL',
  FULFILLED:   'FULFILLED',
  OVERSHIPPED: 'OVERSHIPPED',
}

export const LINE_FULFILLMENT_STATUS = {
  OPEN:      'OPEN',
  PARTIAL:   'PARTIAL',
  COMPLETE:  'COMPLETE',
  CANCELLED: 'CANCELLED',
}

export const SPLIT_SHIPMENT_STATUS = {
  DRAFT:         'DRAFT',
  READY:         'READY',
  PACKED:        'PACKED',
  SHIPPED:       'SHIPPED',
  IN_TRANSIT:    'IN_TRANSIT',
  DELIVERED:     'DELIVERED',
  EXCEPTION:     'EXCEPTION',
}

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

let _nextSplitId = 1000

/** Represents an order with line-level partial fulfillment tracking */
const MOCK_ORDERS_WITH_LINES = [
  {
    id: 'ORD-2026-0200',
    orderNumber: 'SO-2026-0200',
    customerName: 'ABC Steel Corporation',
    customerContact: 'John Smith',
    status: 'CONFIRMED',
    fulfillmentStatus: ORDER_FULFILLMENT_STATUS.PARTIAL,
    priority: 'HOT',
    lines: [
      {
        id: 'LINE-001',
        lineNumber: 1,
        material: 'HR Coil 0.125" x 48"',
        grade: 'A36',
        description: 'Hot Rolled Coil — Slit to 6"',
        qtyOrdered: 150,
        qtyShipped: 60,
        qtyRemaining: 90,
        uom: 'PCS',
        weightPerUnit: 190,
        totalWeightOrdered: 28500,
        totalWeightShipped: 11400,
        unitPrice: 0.42,
        lineStatus: LINE_FULFILLMENT_STATUS.PARTIAL,
        jobNumber: 'JOB-1005',
      },
      {
        id: 'LINE-002',
        lineNumber: 2,
        material: 'CR Sheet 16ga x 60"',
        grade: '1008',
        description: 'Cold Rolled Sheet — CTL 120"',
        qtyOrdered: 200,
        qtyShipped: 200,
        qtyRemaining: 0,
        uom: 'PCS',
        weightPerUnit: 90,
        totalWeightOrdered: 18000,
        totalWeightShipped: 18000,
        unitPrice: 0.55,
        lineStatus: LINE_FULFILLMENT_STATUS.COMPLETE,
        jobNumber: 'JOB-1006',
      },
    ],
    shipments: ['SPLIT-001'],
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'ORD-2026-0201',
    orderNumber: 'SO-2026-0201',
    customerName: 'Metro Manufacturing',
    customerContact: 'Sarah Johnson',
    status: 'IN_PRODUCTION',
    fulfillmentStatus: ORDER_FULFILLMENT_STATUS.UNFULFILLED,
    priority: 'NORMAL',
    lines: [
      {
        id: 'LINE-003',
        lineNumber: 1,
        material: 'Galv Coil 0.060" x 36"',
        grade: 'G90',
        description: 'Galvanized Coil — Slit to 12"',
        qtyOrdered: 75,
        qtyShipped: 0,
        qtyRemaining: 75,
        uom: 'PCS',
        weightPerUnit: 160,
        totalWeightOrdered: 12000,
        totalWeightShipped: 0,
        unitPrice: 0.62,
        lineStatus: LINE_FULFILLMENT_STATUS.OPEN,
        jobNumber: 'JOB-1007',
      },
      {
        id: 'LINE-004',
        lineNumber: 2,
        material: 'SS 304 Sheet 11ga x 48"',
        grade: '304',
        description: 'Stainless Sheet — CTL 96"',
        qtyOrdered: 50,
        qtyShipped: 0,
        qtyRemaining: 50,
        uom: 'PCS',
        weightPerUnit: 105,
        totalWeightOrdered: 5250,
        totalWeightShipped: 0,
        unitPrice: 2.85,
        lineStatus: LINE_FULFILLMENT_STATUS.OPEN,
        jobNumber: 'JOB-1008',
      },
    ],
    shipments: [],
    createdAt: '2026-02-03T14:00:00Z',
  },
  {
    id: 'ORD-2026-0202',
    orderNumber: 'SO-2026-0202',
    customerName: 'Industrial Corp',
    customerContact: 'Mike Davis',
    status: 'CONFIRMED',
    fulfillmentStatus: ORDER_FULFILLMENT_STATUS.PARTIAL,
    priority: 'RUSH',
    lines: [
      {
        id: 'LINE-005',
        lineNumber: 1,
        material: 'HR Plate 0.500" x 96"',
        grade: 'A572-50',
        description: 'Hot Rolled Plate — Plasma cut to shape',
        qtyOrdered: 20,
        qtyShipped: 12,
        qtyRemaining: 8,
        uom: 'PCS',
        weightPerUnit: 653,
        totalWeightOrdered: 13060,
        totalWeightShipped: 7836,
        unitPrice: 0.58,
        lineStatus: LINE_FULFILLMENT_STATUS.PARTIAL,
        jobNumber: 'JOB-1009',
      },
    ],
    shipments: ['SPLIT-002'],
    createdAt: '2026-02-02T09:30:00Z',
  },
]

/** Represents split shipments already created */
let MOCK_SPLIT_SHIPMENTS = [
  {
    id: 'SPLIT-001',
    splitGroupId: 'SG-ORD-0200',
    orderId: 'ORD-2026-0200',
    orderNumber: 'SO-2026-0200',
    splitIndex: 1,
    status: SPLIT_SHIPMENT_STATUS.SHIPPED,
    customerName: 'ABC Steel Corporation',
    carrier: 'Fast Freight',
    bolNumber: 'BOL-2026-SP-001',
    trackingNumber: 'FF-887766',
    createdAt: '2026-02-04T08:00:00Z',
    shippedAt: '2026-02-04T14:30:00Z',
    packages: [
      { id: 'PKG-SP-001', skidNumber: 'SKD-501', pieces: 60, weight: 11400, bundleType: 'SKID' },
    ],
    lines: [
      { lineId: 'LINE-001', lineNumber: 1, material: 'HR Coil 0.125" x 48"', qtyInShipment: 60, weightInShipment: 11400 },
      { lineId: 'LINE-002', lineNumber: 2, material: 'CR Sheet 16ga x 60"', qtyInShipment: 200, weightInShipment: 18000 },
    ],
    totalPieces: 260,
    totalWeight: 29400,
    dropTags: ['DT-SP-001', 'DT-SP-002'],
    documents: ['BOL', 'PACKING_LIST', 'WEIGHT_CERT'],
  },
  {
    id: 'SPLIT-002',
    splitGroupId: 'SG-ORD-0202',
    orderId: 'ORD-2026-0202',
    orderNumber: 'SO-2026-0202',
    splitIndex: 1,
    status: SPLIT_SHIPMENT_STATUS.DELIVERED,
    customerName: 'Industrial Corp',
    carrier: 'ABC Trucking',
    bolNumber: 'BOL-2026-SP-002',
    trackingNumber: 'ABC-554433',
    createdAt: '2026-02-03T10:00:00Z',
    shippedAt: '2026-02-03T16:00:00Z',
    deliveredAt: '2026-02-05T09:15:00Z',
    packages: [
      { id: 'PKG-SP-002', skidNumber: 'SKD-502', pieces: 12, weight: 7836, bundleType: 'SKID' },
    ],
    lines: [
      { lineId: 'LINE-005', lineNumber: 1, material: 'HR Plate 0.500" x 96"', qtyInShipment: 12, weightInShipment: 7836 },
    ],
    totalPieces: 12,
    totalWeight: 7836,
    dropTags: ['DT-SP-003'],
    documents: ['BOL', 'PACKING_LIST', 'COA'],
  },
]

/** Audit trail */
let MOCK_SPLIT_EVENTS = [
  {
    id: 'EVT-001',
    orderId: 'ORD-2026-0200',
    splitShipmentId: 'SPLIT-001',
    action: 'SPLIT_CREATED',
    user: 'jdoe',
    timestamp: '2026-02-04T08:00:00Z',
    details: 'Split shipment created with 260 pcs across 2 lines',
  },
  {
    id: 'EVT-002',
    orderId: 'ORD-2026-0200',
    splitShipmentId: 'SPLIT-001',
    action: 'SPLIT_SHIPPED',
    user: 'jdoe',
    timestamp: '2026-02-04T14:30:00Z',
    details: 'Shipment SPLIT-001 shipped via Fast Freight',
  },
  {
    id: 'EVT-003',
    orderId: 'ORD-2026-0202',
    splitShipmentId: 'SPLIT-002',
    action: 'SPLIT_CREATED',
    user: 'mwilliams',
    timestamp: '2026-02-03T10:00:00Z',
    details: 'Split shipment created with 12 pcs',
  },
  {
    id: 'EVT-004',
    orderId: 'ORD-2026-0202',
    splitShipmentId: 'SPLIT-002',
    action: 'SPLIT_DELIVERED',
    user: 'system',
    timestamp: '2026-02-05T09:15:00Z',
    details: 'Shipment SPLIT-002 delivered — signed by M. Davis',
  },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function delay(ms = 250) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Derive order-level fulfillment status from its lines. */
export function deriveOrderFulfillmentStatus(lines) {
  if (!lines?.length) return ORDER_FULFILLMENT_STATUS.UNFULFILLED
  const allComplete = lines.every((l) => l.qtyRemaining <= 0 || l.lineStatus === 'COMPLETE')
  const anyShipped = lines.some((l) => l.qtyShipped > 0)
  if (allComplete) return ORDER_FULFILLMENT_STATUS.FULFILLED
  if (anyShipped)  return ORDER_FULFILLMENT_STATUS.PARTIAL
  return ORDER_FULFILLMENT_STATUS.UNFULFILLED
}

/** Calculate total remaining across lines. */
export function calcRemaining(lines) {
  return {
    totalQtyRemaining: lines.reduce((s, l) => s + (l.qtyRemaining || 0), 0),
    totalWeightRemaining: lines.reduce((s, l) => s + ((l.qtyRemaining || 0) * (l.weightPerUnit || 0)), 0),
  }
}

/** Percentage shipped for a single line. */
export function lineShippedPct(line) {
  if (!line?.qtyOrdered) return 0
  return Math.min((line.qtyShipped / line.qtyOrdered) * 100, 100)
}

/** Percentage shipped for the whole order (by weight). */
export function orderShippedPct(lines) {
  if (!lines?.length) return 0
  const orderedW = lines.reduce((s, l) => s + (l.totalWeightOrdered || 0), 0)
  const shippedW = lines.reduce((s, l) => s + (l.totalWeightShipped || 0), 0)
  if (!orderedW) return 0
  return Math.min((shippedW / orderedW) * 100, 100)
}

// ─── VALIDATION ──────────────────────────────────────────────────────────────

/**
 * Validates a proposed split against order lines.
 * @param {object}   order       Full order with lines
 * @param {object[]} splitLines  Array of { lineId, qtyToShip }
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSplit(order, splitLines) {
  const errors = []

  if (!splitLines?.length) {
    errors.push('At least one line must be included in the split.')
    return { valid: false, errors }
  }

  for (const sl of splitLines) {
    const orderLine = order.lines.find((l) => l.id === sl.lineId)
    if (!orderLine) {
      errors.push(`Line ${sl.lineId} not found on order.`)
      continue
    }
    if (sl.qtyToShip <= 0) {
      errors.push(`Line ${orderLine.lineNumber}: quantity must be > 0.`)
    }
    if (sl.qtyToShip > orderLine.qtyRemaining) {
      errors.push(
        `Line ${orderLine.lineNumber}: requested ${sl.qtyToShip} exceeds remaining ${orderLine.qtyRemaining}.`
      )
    }
  }

  return { valid: errors.length === 0, errors }
}

// ─── API FUNCTIONS ───────────────────────────────────────────────────────────

/**
 * Fetch all orders with partial-fulfillment line data.
 * @param {{ fulfillmentStatus?: string }} filters
 */
export async function getOrdersWithFulfillment(filters = {}) {
  if (USE_MOCK) {
    await delay()
    let result = [...MOCK_ORDERS_WITH_LINES]
    if (filters.fulfillmentStatus) {
      result = result.filter((o) => o.fulfillmentStatus === filters.fulfillmentStatus)
    }
    return { data: result }
  }
  const qs = new URLSearchParams(filters).toString()
  const res = await fetch(`/api/orders/fulfillment?${qs}`)
  if (!res.ok) throw new Error('Failed to fetch orders')
  return res.json()
}

/**
 * Get a single order with its lines + existing split shipments.
 */
export async function getOrderFulfillmentDetail(orderId) {
  if (USE_MOCK) {
    await delay()
    const order = MOCK_ORDERS_WITH_LINES.find((o) => o.id === orderId)
    if (!order) throw new Error('Order not found')
    const splits = MOCK_SPLIT_SHIPMENTS.filter((s) => s.orderId === orderId)
    const events = MOCK_SPLIT_EVENTS.filter((e) => e.orderId === orderId)
    return { data: { ...order, splitShipments: splits, events } }
  }
  const res = await fetch(`/api/orders/${orderId}/fulfillment`)
  if (!res.ok) throw new Error('Failed to fetch order fulfillment')
  return res.json()
}

/**
 * Get all split shipments (optionally filtered by status).
 */
export async function getSplitShipments(filters = {}) {
  if (USE_MOCK) {
    await delay()
    let result = [...MOCK_SPLIT_SHIPMENTS]
    if (filters.status) result = result.filter((s) => s.status === filters.status)
    if (filters.orderId) result = result.filter((s) => s.orderId === filters.orderId)
    return { data: result }
  }
  const qs = new URLSearchParams(filters).toString()
  const res = await fetch(`/api/shipments/splits?${qs}`)
  if (!res.ok) throw new Error('Failed to fetch split shipments')
  return res.json()
}

/**
 * Create a new split shipment from an order.
 *
 * @param {string}   orderId
 * @param {object[]} splitLines  Array of { lineId, qtyToShip }
 * @param {object}   meta        { carrier?, notes? }
 * @returns Split shipment object with generated packages + drop tags
 */
export async function createSplitShipment(orderId, splitLines, meta = {}) {
  if (USE_MOCK) {
    await delay(400)
    const order = MOCK_ORDERS_WITH_LINES.find((o) => o.id === orderId)
    if (!order) throw new Error('Order not found')

    // validate
    const { valid, errors } = validateSplit(order, splitLines)
    if (!valid) throw new Error(errors.join(' | '))

    const existingSplits = MOCK_SPLIT_SHIPMENTS.filter((s) => s.orderId === orderId)
    const splitIndex = existingSplits.length + 1
    const splitId = `SPLIT-${String(++_nextSplitId).padStart(3, '0')}`
    const splitGroupId = `SG-${order.id.replace('ORD-2026-', 'ORD-')}`

    // Build shipment lines + packages
    const shipmentLines = []
    const packages = []
    let totalPieces = 0
    let totalWeight = 0

    for (const sl of splitLines) {
      const ol = order.lines.find((l) => l.id === sl.lineId)
      const weight = sl.qtyToShip * ol.weightPerUnit
      shipmentLines.push({
        lineId: ol.id,
        lineNumber: ol.lineNumber,
        material: ol.material,
        qtyInShipment: sl.qtyToShip,
        weightInShipment: weight,
      })
      totalPieces += sl.qtyToShip
      totalWeight += weight

      // auto-generate a package per line
      packages.push({
        id: `PKG-SP-${Date.now()}-${ol.lineNumber}`,
        skidNumber: `SKD-${Date.now().toString().slice(-3)}-${ol.lineNumber}`,
        pieces: sl.qtyToShip,
        weight,
        bundleType: weight > 10000 ? 'SKID' : 'BUNDLE',
      })
    }

    // Create the split shipment
    const newSplit = {
      id: splitId,
      splitGroupId,
      orderId,
      orderNumber: order.orderNumber,
      splitIndex,
      status: SPLIT_SHIPMENT_STATUS.READY,
      customerName: order.customerName,
      carrier: meta.carrier || null,
      bolNumber: `BOL-${new Date().getFullYear()}-SP-${splitId.slice(-3)}`,
      trackingNumber: null,
      createdAt: new Date().toISOString(),
      shippedAt: null,
      packages,
      lines: shipmentLines,
      totalPieces,
      totalWeight,
      dropTags: shipmentLines.map(
        (_, i) => `DT-SP-${splitId.slice(-3)}-${i + 1}`
      ),
      documents: ['BOL', 'PACKING_LIST'],
      notes: meta.notes || null,
    }

    MOCK_SPLIT_SHIPMENTS = [...MOCK_SPLIT_SHIPMENTS, newSplit]

    // Update order lines
    for (const sl of splitLines) {
      const ol = order.lines.find((l) => l.id === sl.lineId)
      ol.qtyShipped += sl.qtyToShip
      ol.qtyRemaining -= sl.qtyToShip
      ol.totalWeightShipped += sl.qtyToShip * ol.weightPerUnit
      ol.lineStatus =
        ol.qtyRemaining <= 0
          ? LINE_FULFILLMENT_STATUS.COMPLETE
          : LINE_FULFILLMENT_STATUS.PARTIAL
    }

    // Update order-level
    order.fulfillmentStatus = deriveOrderFulfillmentStatus(order.lines)
    if (!order.shipments.includes(splitId)) order.shipments.push(splitId)

    // Audit event
    MOCK_SPLIT_EVENTS.push({
      id: `EVT-${Date.now()}`,
      orderId,
      splitShipmentId: splitId,
      action: 'SPLIT_CREATED',
      user: 'current-user',
      timestamp: new Date().toISOString(),
      details: `Split #${splitIndex} created — ${totalPieces} pcs / ${totalWeight.toLocaleString()} lbs across ${shipmentLines.length} line(s)`,
    })

    return { data: newSplit }
  }

  const res = await fetch(`/api/orders/${orderId}/splits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ splitLines, ...meta }),
  })
  if (!res.ok) throw new Error('Failed to create split shipment')
  return res.json()
}

/**
 * Transition a split shipment's status.
 */
export async function updateSplitShipmentStatus(splitId, newStatus, meta = {}) {
  if (USE_MOCK) {
    await delay(300)
    const idx = MOCK_SPLIT_SHIPMENTS.findIndex((s) => s.id === splitId)
    if (idx === -1) throw new Error('Split shipment not found')

    const updated = { ...MOCK_SPLIT_SHIPMENTS[idx], status: newStatus }
    if (newStatus === SPLIT_SHIPMENT_STATUS.SHIPPED) {
      updated.shippedAt = new Date().toISOString()
      updated.carrier = meta.carrier || updated.carrier
      updated.trackingNumber = meta.trackingNumber || updated.trackingNumber
    }
    if (newStatus === SPLIT_SHIPMENT_STATUS.DELIVERED) {
      updated.deliveredAt = new Date().toISOString()
    }

    MOCK_SPLIT_SHIPMENTS[idx] = updated

    // Audit event
    MOCK_SPLIT_EVENTS.push({
      id: `EVT-${Date.now()}`,
      orderId: updated.orderId,
      splitShipmentId: splitId,
      action: `SPLIT_${newStatus}`,
      user: 'current-user',
      timestamp: new Date().toISOString(),
      details: `Status → ${newStatus}${meta.notes ? ': ' + meta.notes : ''}`,
    })

    return { data: updated }
  }

  const res = await fetch(`/api/shipments/splits/${splitId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus, ...meta }),
  })
  if (!res.ok) throw new Error('Failed to update split shipment')
  return res.json()
}

/**
 * Get the timeline / event log for an order's fulfillment.
 */
export async function getOrderFulfillmentTimeline(orderId) {
  if (USE_MOCK) {
    await delay()
    const events = MOCK_SPLIT_EVENTS
      .filter((e) => e.orderId === orderId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    return { data: events }
  }
  const res = await fetch(`/api/orders/${orderId}/fulfillment/timeline`)
  if (!res.ok) throw new Error('Failed to fetch timeline')
  return res.json()
}
