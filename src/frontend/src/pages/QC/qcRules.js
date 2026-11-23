// Small rules the QC screens go by.

// An inspection is open until it is decided. One started with no inspector is PENDING, and it is
// just as much work in hand as one that is IN_PROGRESS.
export const OPEN_INSPECTION_STATUSES = ['PENDING', 'IN_PROGRESS']
export const isOpenInspection = (inspection) => OPEN_INSPECTION_STATUSES.includes(inspection?.status)

// The open inspection of a job in the QC queue, if it has one.
export const openInspectionOf = (job) => (job?.inspections || []).find(isOpenInspection) || null

const STATUS_WORDS = { PENDING: 'Not started', IN_PROGRESS: 'In progress', PASSED: 'Passed', FAILED: 'Failed', CONDITIONAL: 'Conditional' }
export const inspectionStatusLabel = (status) => STATUS_WORDS[status] || String(status || '').replace(/_/g, ' ')

// A job made from an order line keeps its details in the notes as data. People are shown words: one function for
// every screen (utils/readableNotes.js).
export { readableNotes as jobNotesText } from '../../utils/readableNotes.js'
