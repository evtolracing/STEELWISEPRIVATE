/**
 * Notes as people read them.
 *
 * Some records keep details in their notes as data: a job made from an order line keeps the customer, the order and
 * the processing; an order line keeps its list of processes; an order taken at intake keeps its intake details beside
 * what the person typed. The stored text is kept as it is, because the system reads it back. On a screen it is always
 * shown in words, through this one function (owner, 2026-11-22: "this should be human readable and anywhere else
 * should be also").
 */
const words = (key) => String(key).replace(/^_+|_+$/g, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim().toLowerCase().replace(/^./, (c) => c.toUpperCase())
const plain = (v) => {
  if (v === null || v === undefined || v === '') return ''
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (Array.isArray(v)) return v.map(plain).filter(Boolean).join(', ')
  if (typeof v === 'object') return Object.entries(v).map(([k, x]) => (plain(x) ? `${words(k).toLowerCase()} ${plain(x)}` : '')).filter(Boolean).join(', ')
  return String(v)
}

/** "Shear to Size (width 12, length 16)" from one process as it is stored. */
export function processText(p) {
  if (!p) return ''
  if (typeof p === 'string') return p
  const name = p.name || p.label || p.type || p.code || ''
  const params = p.params && typeof p.params === 'object' ? plain(p.params) : ''
  return params ? `${name} (${params})` : String(name)
}

const REQUIREMENTS = [['gradeOverride', 'Grade'], ['surfaceFinish', 'Finish'], ['tolerancePreset', 'Tolerance'], ['certRequirements', 'Certificates'], ['processing', 'Processing notes'], ['specNotes', 'Notes']]
const looksLikeProcess = (p) => typeof p === 'string' || (p && typeof p === 'object' && (p.name || p.code || p.type || p.label))

export function readableNotes(notes) {
  if (notes === null || notes === undefined) return ''
  if (typeof notes !== 'string') return plain(notes)
  const text = notes.trim()
  if (!text) return notes
  if (!/^[[{]/.test(text)) {
    // Words first and the kept details after them (a rework note is written in front of a job's details).
    const at = text.search(/\n\s*[[{]/)
    if (at === -1) return notes
    const tail = text.slice(at).trim()
    const said = readableNotes(tail)
    return said === tail ? notes : [text.slice(0, at).trim(), said].filter(Boolean).join('\n\n')
  }
  let data
  try { data = JSON.parse(text) } catch { return notes }
  if (data === null || typeof data !== 'object') return notes

  // An order line: its list of processes.
  if (Array.isArray(data)) {
    if (!data.length) return ''
    return data.every(looksLikeProcess) ? `Processing: ${data.map(processText).filter(Boolean).join(', ')}` : plain(data)
  }
  // An order taken at intake: only what the person typed is a note. The intake details are shown in their own places.
  if (data.__intakeMeta__) return typeof data.userNotes === 'string' ? data.userNotes : ''

  const lines = []
  const used = new Set()
  const take = (key) => { used.add(key); return data[key] }
  if (take('customerName')) lines.push(`Customer: ${data.customerName}`)
  const lineNumber = take('lineNumber')
  if (take('orderNumber')) lines.push(`Order: ${data.orderNumber}${lineNumber ? `, line ${lineNumber}` : ''}`)
  const processes = take('processes')
  if (Array.isArray(processes) && processes.length) lines.push(`Processing: ${processes.map(processText).filter(Boolean).join(', ')}`)
  const req = take('requirements')
  if (req && typeof req === 'object' && !Array.isArray(req)) {
    const known = new Set(REQUIREMENTS.map(([k]) => k))
    for (const [key, label] of REQUIREMENTS) if (plain(req[key])) lines.push(`${label}: ${plain(req[key])}`)
    for (const [key, value] of Object.entries(req)) if (!known.has(key) && plain(value)) lines.push(`${words(key)}: ${plain(value)}`)
  }
  const own = take('notes'); take('userNotes')
  // Anything else kept there is still shown, in words, so nothing is hidden and nothing is shown as code.
  for (const [key, value] of Object.entries(data)) if (!used.has(key) && plain(value)) lines.push(`${words(key)}: ${plain(value)}`)
  if (typeof data.userNotes === 'string' && data.userNotes.trim()) lines.push(data.userNotes.trim())
  if (typeof own === 'string' && own.trim()) lines.push(own.trim())
  return lines.join('\n')
}
