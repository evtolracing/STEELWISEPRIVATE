/**
 * The routing templates of the Plan Job box name kinds of work ("SAW", "PACKOUT"). The work center
 * types a company actually has are its own (their ids are whatever was typed when they were made),
 * so a template step is matched to a real type here. Pure.
 */
const WORDS = {
  SAW: ['SAW'], DEBURR: ['DEBURR', 'DEBURRING'], PACKOUT: ['PACKOUT', 'PACK', 'PACKAGING', 'PACKING'], SHEAR: ['SHEAR'],
  WATERJET: ['WATERJET'], SLITTER: ['SLITTER', 'SLIT'], CTL_LINE: ['CTL', 'CTL_LINE'], LEVELER: ['LEVELER', 'LEVELLER'],
  PLASMA: ['PLASMA'], LASER: ['LASER'], PRESS_BRAKE: ['BRAKE', 'BEND', 'PRESS_BRAKE'], BEND: ['BEND', 'BRAKE'],
}
const wordsOf = (text) => String(text || '').toUpperCase().split(/[^A-Z0-9_]+/).filter(Boolean)

/**
 * The id of the company's work center type for a template step, or '' when it has none.
 * types: [{ id, label }]; wanted: the template's word; hasMachine(typeId): true when the chosen
 * branch has a machine of that type (those are preferred).
 */
export function typeFor(types, wanted, hasMachine = () => false) {
  const list = (types || []).filter((t) => t && t.isActive !== false)
  const exact = list.find((t) => String(t.id).toUpperCase() === String(wanted).toUpperCase())
  if (exact) return exact.id
  const looked = WORDS[wanted] || [String(wanted).toUpperCase()]
  const matches = list.filter((t) => [...wordsOf(t.id), ...wordsOf(t.label), ...wordsOf(t.name)].some((w) => looked.includes(w)))
  if (!matches.length) return ''
  return (matches.find((t) => hasMachine(t.id)) || matches[0]).id
}

/** A template as it can be used here: its steps with real type ids, and the kinds of work that are missing. */
export function usableTemplate(template, types, hasMachine) {
  const ops = template.ops.map((op) => ({ ...op, typeId: typeFor(types, op.type, hasMachine) }))
  return { ...template, ops, missing: ops.filter((op) => !op.typeId).map((op) => op.type) }
}

/** The branch a job is planned at by default: its work center's, else its order's, else the planner's, else the first. */
export function defaultBranch(job, locations, homeLocationId) {
  const ids = new Set((locations || []).map((l) => l.id))
  return [job?.workCenter?.locationId, job?.orderLocationId, homeLocationId].find((id) => id && ids.has(id)) || locations?.[0]?.id || ''
}
