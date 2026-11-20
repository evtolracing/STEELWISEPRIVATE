// What a step in a work center's queue is called on screen: the job number people know, never a record id.
const RECORD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-/i

export const jobTitle = (op) => op?.job?.jobNumber || 'Job'
export const customerOf = (op) => op?.job?.customerName || ''
export const orderOf = (op) => op?.job?.orderNumber || '—'
// A thickness of 0 means none is on file.
export const thicknessOf = (value) => (Number(value) > 0 ? `${Number(value)}"` : '—')
export const branchLabel = (queue, locationId) => queue?.locationName || (locationId && !RECORD_ID.test(locationId) ? locationId : '')
