/**
 * The Locations form: what it starts with and what it sends. Pure, checked in src/backend/test/locations.test.js.
 */
export const LOCATION_TYPES = [
  { id: 'WAREHOUSE', label: 'Warehouse or service center' },
  { id: 'YARD', label: 'Yard' },
  { id: 'FLOOR', label: 'Floor area' },
  { id: 'RACK', label: 'Rack' },
  { id: 'BIN', label: 'Bin' },
]

export const TIME_ZONES = [
  { id: 'America/Detroit', label: 'Eastern (Michigan)' },
  { id: 'America/New_York', label: 'Eastern' },
  { id: 'America/Chicago', label: 'Central' },
  { id: 'America/Denver', label: 'Mountain' },
  { id: 'America/Phoenix', label: 'Mountain, no daylight saving (Arizona)' },
  { id: 'America/Los_Angeles', label: 'Pacific' },
]

const TEXT = ['code', 'name', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country', 'phone', 'fax', 'email', 'hours', 'notes']
const NUMBERS = ['lat', 'lng', 'squareFeet', 'maxWeightLb']
const FLAGS = ['isOutdoor', 'hasCrane', 'sellsFrom', 'shipsFrom']

export function blankLocation() {
  return {
    ...Object.fromEntries([...TEXT, ...NUMBERS].map((k) => [k, ''])),
    country: 'US', type: 'WAREHOUSE', isBranch: true, parentId: '', managerId: '', timezone: 'America/Detroit',
    divisions: [], processes: [], isOutdoor: false, hasCrane: false, sellsFrom: true, shipsFrom: true,
  }
}

/** The form for a location on file: every blank shown as an empty box. */
export function formFromLocation(l) {
  return {
    id: l.id,
    ...Object.fromEntries(TEXT.map((k) => [k, l[k] ?? ''])),
    ...Object.fromEntries(NUMBERS.map((k) => [k, l[k] === null || l[k] === undefined ? '' : String(l[k])])),
    ...Object.fromEntries(FLAGS.map((k) => [k, Boolean(l[k])])),
    type: l.type || 'WAREHOUSE', isBranch: Boolean(l.isBranch), parentId: l.parentId || '', managerId: l.managerId || '',
    timezone: l.timezone || 'America/Detroit', divisions: [...(l.divisions || [])], processes: [...(l.processes || [])],
  }
}

/** What is sent to the server: trimmed text, and an empty box as "none". */
export function locationPayload(form) {
  const out = {}
  for (const k of TEXT) out[k] = String(form[k] ?? '').trim()
  for (const k of NUMBERS) out[k] = String(form[k] ?? '').trim()
  for (const k of FLAGS) out[k] = Boolean(form[k])
  out.type = form.type
  out.isBranch = Boolean(form.isBranch)
  out.parentId = form.isBranch ? '' : form.parentId || ''
  out.managerId = form.managerId || ''
  out.timezone = form.timezone
  out.divisions = (form.divisions || []).map((d) => String(d).trim()).filter(Boolean)
  out.processes = (form.processes || []).map((d) => String(d).trim()).filter(Boolean)
  return out
}

/** "1298 Lipsey Dr., Charlotte, MI 48813" from whatever parts are on file. */
export function addressLine(l) {
  const cityLine = [l.city, [l.state, l.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  return [l.addressLine1, l.addressLine2, cityLine].filter(Boolean).join(', ')
}
