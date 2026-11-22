/**
 * What the Freight screens show, worked out from real shipments (GET /api/shipments). Pure, checked in
 * src/backend/test/freightView.test.js. Before 2026-11-22 these screens showed made-up shipments.
 */
export const BOARD_COLUMNS = [
  { key: 'PENDING', label: 'On the dock' },
  { key: 'LOADING', label: 'Loading' },
  { key: 'IN_TRANSIT', label: 'In transit' },
  { key: 'DELIVERED', label: 'Delivered, last 7 days' },
]
const DAY = 86400000
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }

/** Still on the dock after the day it was scheduled to leave. */
export function isLate(shipment, now = new Date()) {
  if (!['PENDING', 'LOADING'].includes(shipment.status) || !shipment.scheduledDate) return false
  return new Date(shipment.scheduledDate) < startOfDay(now)
}

/** "CT Charlotte to Lansing, MI": where it leaves from and the customer's town, from what is on file. */
export function routeLine(shipment) {
  const from = [shipment.fromLocation?.code, shipment.fromLocation?.name].filter(Boolean).join(' ')
  const buyer = shipment.order?.buyer
  const to = [buyer?.city, buyer?.state].filter(Boolean).join(', ')
  return [from || 'No branch on file', to || 'no delivery town on file'].join(' to ')
}

/** The board: each open shipment under its status, and deliveries of the last seven days. */
export function boardColumns(shipments, now = new Date()) {
  const cut = now.getTime() - 7 * DAY
  const out = Object.fromEntries(BOARD_COLUMNS.map((c) => [c.key, []]))
  for (const s of shipments || []) {
    if (!out[s.status]) continue
    if (s.status === 'DELIVERED' && !(s.deliveredAt && new Date(s.deliveredAt).getTime() >= cut)) continue
    out[s.status].push(s)
  }
  return out
}

export const EXCEPTION_KINDS = {
  LOST: { label: 'Recorded as lost', severity: 'error' },
  EXCEPTION: { label: 'Marked as an exception', severity: 'error' },
  LATE: { label: 'Still on the dock after its scheduled day', severity: 'warning' },
  NO_POD: { label: 'Delivered with no proof of delivery and no reason given', severity: 'warning' },
}

/** Shipments that need someone's attention, worst first, each with the reason. */
export function exceptionRows(shipments, now = new Date()) {
  const rows = []
  for (const s of shipments || []) {
    let kind = null
    if (s.status === 'LOST') kind = 'LOST'
    else if (s.status === 'EXCEPTION') kind = 'EXCEPTION'
    else if (isLate(s, now)) kind = 'LATE'
    else if (s.status === 'DELIVERED' && !s.podCaptured && !s.noPodReason) kind = 'NO_POD'
    if (kind) rows.push({ shipment: s, kind, ...EXCEPTION_KINDS[kind] })
  }
  const order = Object.keys(EXCEPTION_KINDS)
  return rows.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || String(a.shipment.shipmentNumber).localeCompare(String(b.shipment.shipmentNumber)))
}

/** Days until the promised date (negative when it has passed), or null when none is on file. */
export function daysToPromise(order, now = new Date()) {
  if (!order?.promisedDate) return null
  return Math.round((startOfDay(order.promisedDate) - startOfDay(now)) / DAY)
}
