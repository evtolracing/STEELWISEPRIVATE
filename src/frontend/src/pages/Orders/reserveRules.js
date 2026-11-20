// Reserving stock for an order line: the small rules the Stock panel on the order page goes by.
// The server decides what may really be reserved (backend lib/reservationRules.js); these rules only
// keep the list short and the numbers right.
const UNIT_ALIASES = { LB: 'LB', LBS: 'LB', POUND: 'LB', POUNDS: 'LB', EA: 'EA', EACH: 'EA', PC: 'EA', PCS: 'EA', PIECE: 'EA', PIECES: 'EA' }
export const unitKey = (u) => UNIT_ALIASES[String(u || 'LB').trim().toUpperCase()] || String(u || '').trim().toUpperCase()
const n = (v) => Number(v || 0)
const round = (v) => Math.round(v * 1000) / 1000

export const reservedOn = (line) => round((line?.allocations || []).reduce((sum, a) => sum + n(a.qtyAllocated), 0))
// What the line still needs reserved: ordered, less what has shipped, less what is already reserved.
export const openToReserve = (line) => Math.max(round(n(line?.qtyOrdered) - n(line?.qtyShipped) - reservedOn(line)), 0)

// An order can have stock reserved once it is real and until it is finished.
export const mayReserve = (order) => Boolean(order) && !['DRAFT', 'CANCELLED', 'COMPLETE'].includes(order.status)

// Stock that could go to this line: counted in the line's unit, the grade ordered (when both say),
// not on hold, with some available. The order's own branch comes first, then the most available.
export function stockChoices(line, items, branchId) {
  return (items || [])
    .filter((c) => c?.inventory && n(c.inventory.qtyAvailable) > 0)
    .filter((c) => c.inventory.status !== 'IN_TRANSIT' && c.status !== 'HOLD' && !['FAILED', 'HOLD'].includes(c.qcStatus))
    .filter((c) => unitKey(c.inventory.unit) === unitKey(line?.unit))
    .filter((c) => !line?.gradeId || !c.gradeId || c.gradeId === line.gradeId)
    .sort((a, b) => (Number(b.locationId === branchId) - Number(a.locationId === branchId)) || (n(b.inventory.qtyAvailable) - n(a.inventory.qtyAvailable)))
}

// The quantity first offered: what the line still needs, or all that the item has if that is less.
export const suggestedQty = (line, item) => Math.min(openToReserve(line), n(item?.inventory?.qtyAvailable))

export function stockSummary(order) {
  const lines = order?.lines || []
  const short = lines.filter((l) => openToReserve(l) > 0)
  if (!lines.length) return { ready: false, text: 'The order has no lines.' }
  if (!short.length) return { ready: true, text: 'Stock is reserved for every line. The order can ship.' }
  return { ready: false, text: `${short.length} of ${lines.length} line${lines.length === 1 ? '' : 's'} still need${short.length === 1 ? 's' : ''} stock reserved. A shipment cannot be dispatched until it is.` }
}
