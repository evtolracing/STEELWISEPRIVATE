// Small rules the QC screens go by.

// An inspection is open until it is decided. One started with no inspector is PENDING, and it is
// just as much work in hand as one that is IN_PROGRESS.
export const OPEN_INSPECTION_STATUSES = ['PENDING', 'IN_PROGRESS']
export const isOpenInspection = (inspection) => OPEN_INSPECTION_STATUSES.includes(inspection?.status)

// The open inspection of a job in the QC queue, if it has one.
export const openInspectionOf = (job) => (job?.inspections || []).find(isOpenInspection) || null

const STATUS_WORDS = { PENDING: 'Not started', IN_PROGRESS: 'In progress', PASSED: 'Passed', FAILED: 'Failed', CONDITIONAL: 'Conditional' }
export const inspectionStatusLabel = (status) => STATUS_WORDS[status] || String(status || '').replace(/_/g, ' ')

// A job made from an order line keeps its details in the notes as JSON. People are shown words.
export function jobNotesText(notes) {
  if (!notes) return ''
  let data
  try { data = JSON.parse(notes) } catch { return String(notes) }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return String(notes)
  const lines = []
  if (data.customerName) lines.push(`Customer: ${data.customerName}`)
  if (data.orderNumber) lines.push(`Order: ${data.orderNumber}${data.lineNumber ? `, line ${data.lineNumber}` : ''}`)
  const processes = (Array.isArray(data.processes) ? data.processes : []).map((p) => (typeof p === 'string' ? p : p?.name || p?.label || p?.type || p?.code)).filter(Boolean)
  if (processes.length) lines.push(`Processing: ${processes.join(', ')}`)
  const req = data.requirements && typeof data.requirements === 'object' ? data.requirements : {}
  if (req.gradeOverride) lines.push(`Grade: ${req.gradeOverride}`)
  if (req.surfaceFinish) lines.push(`Finish: ${req.surfaceFinish}`)
  if (req.certRequirements) lines.push(`Certificates: ${Array.isArray(req.certRequirements) ? req.certRequirements.join(', ') : req.certRequirements}`)
  if (req.specNotes) lines.push(`Notes: ${req.specNotes}`)
  if (typeof data.notes === 'string' && data.notes.trim()) lines.push(data.notes.trim())
  return lines.join('\n')
}
