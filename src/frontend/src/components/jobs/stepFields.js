/**
 * The questions the Plan Job box asks for one step, worded for the kind of work (owner, 2026-11-24: "cut to
 * length on a saw, it doesn't ask qty or anything"). Pure, so it is unit tested (backend test/stepFields.test.js).
 * Every step may say pieces, a length, a width, a tolerance and instructions; a kind of work that has no use
 * for one of them does not ask for it.
 */
const KINDS = [
  { match: /slit/i, length: null, width: 'Slit width (in)', qty: 'Number of cuts', hint: 'How many strips and how wide.' },
  { match: /saw|cut.?to.?length|ctl|cutoff|cut-off/i, length: 'Cut length (in)', width: null, qty: 'Pieces', hint: 'How many pieces and how long each is cut.' },
  { match: /shear|blank|level/i, length: 'Cut length (in)', width: 'Cut width (in)', qty: 'Pieces', hint: 'How many pieces and the size of each.' },
  { match: /laser|plasma|waterjet|water.?jet|router|cnc|oxy|flame|burn|mill|machin/i, length: 'Part length (in)', width: 'Part width (in)', qty: 'Pieces', hint: 'How many parts and the size of each. Put the drawing or program number in the instructions.' },
  { match: /pack|ship|label|bundl/i, length: null, width: null, qty: 'Pieces', hint: 'How many pieces and how they are packed.' },
]
const GENERAL = { length: 'Length (in)', width: 'Width (in)', qty: 'Pieces', hint: 'How many pieces and the size, where it matters.' }

/** { qty, length, width, hint }: the label of each question, or null for one this kind of work does not ask. */
export function stepFieldLabels(typeText) {
  const text = String(typeText || '')
  const kind = KINDS.find((k) => k.match.test(text))
  return kind ? { qty: kind.qty, length: kind.length, width: kind.width, hint: kind.hint } : { ...GENERAL }
}

const blank = (v) => v === undefined || v === null || v === ''

/** The details a new step starts with, from the job's material on file: the pieces ordered and the finished size. */
export function startingDetails(defaults, labels) {
  const d = defaults || {}
  return {
    qty: blank(d.qty) ? '' : String(d.qty),
    lengthIn: labels?.length && !blank(d.lengthIn) ? String(d.lengthIn) : '',
    widthIn: labels?.width && !blank(d.widthIn) ? String(d.widthIn) : '',
    tolerance: '',
    notes: '',
  }
}

/** What is sent for one step: only what was filled in, and nothing for a question the step does not ask. */
export function detailsToSend(details, labels) {
  const d = details || {}
  const out = {}
  if (!blank(d.qty)) out.qty = Number(d.qty)
  if (labels?.length && !blank(d.lengthIn)) out.lengthIn = Number(d.lengthIn)
  if (labels?.width && !blank(d.widthIn)) out.widthIn = Number(d.widthIn)
  if (String(d.tolerance || '').trim()) out.tolerance = String(d.tolerance).trim()
  if (String(d.notes || '').trim()) out.notes = String(d.notes).trim()
  return Object.keys(out).length ? out : undefined
}

/** "Filled in from order line 2 and stock item C-7." or '' when nothing was on file. */
export function filledFromText(from) {
  const places = [...new Set(Object.values(from || {}))].filter(Boolean)
  if (!places.length) return ''
  const list = places.length === 1 ? places[0] : `${places.slice(0, -1).join(', ')} and ${places[places.length - 1]}`
  return `Filled in from ${list === 'job' ? 'the job' : list.replace(/\bjob\b/, 'the job')}. Change anything that is wrong.`
}
