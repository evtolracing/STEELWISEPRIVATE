/**
 * What a customer asked for on a line, carried unchanged from the request for quote to the
 * quote and on to the sales order (Phase 5, finding J-001). No database access, so it can be
 * unit tested.
 *
 *   RFQ line    keeps the requirements in its `specifications` JSON
 *   Quote line  and order line keep them in their own columns (same names on both)
 *
 * Nothing here decides a price or a process: it only makes sure a requirement typed once is
 * still there at the next step.
 */
export const SIZE_FIELDS = ['thicknessIn', 'widthIn', 'lengthIn'];
export const TOLERANCE_FIELDS = ['thkTolerancePlus', 'thkToleranceMinus', 'widTolerancePlus', 'widToleranceMinus', 'lenTolerancePlus', 'lenToleranceMinus'];
export const NUMBER_FIELDS = [...SIZE_FIELDS, ...TOLERANCE_FIELDS];
// Text a screen may send under either name; the first is the column name.
export const TEXT_FIELDS = [['gradeOverride', 'grade'], ['surfaceFinish', 'finish'], ['tolerancePreset'], ['specNotes'], ['processing']];
export const COLUMN_FIELDS = [...NUMBER_FIELDS, 'gradeOverride', 'surfaceFinish', 'tolerancePreset', 'certRequirements', 'specNotes'];

const blank = (v) => v === undefined || v === null || v === '';

/**
 * Reads the requirements from one line of a request. Returns { specs } (only the fields given)
 * or { error } naming the field that is wrong.
 */
export function readSpecs(raw = {}) {
  const specs = {};
  for (const f of NUMBER_FIELDS) {
    if (blank(raw[f])) continue;
    const n = Number(raw[f]);
    if (!Number.isFinite(n) || n < 0 || n > 100000) return { error: `${f} must be a number of zero or more` };
    if (SIZE_FIELDS.includes(f) && n === 0) return { error: `${f} must be more than zero` };
    specs[f] = n;
  }
  for (const [name, alias] of TEXT_FIELDS) {
    const v = blank(raw[name]) ? (alias ? raw[alias] : undefined) : raw[name];
    if (blank(v)) continue;
    if (typeof v !== 'string' && typeof v !== 'number') return { error: `${name} must be text` };
    specs[name] = String(v).trim().slice(0, name === 'specNotes' || name === 'processing' ? 1000 : 120);
  }
  if (!blank(raw.certRequirements)) {
    const list = Array.isArray(raw.certRequirements) ? raw.certRequirements : [raw.certRequirements];
    if (list.some((c) => typeof c !== 'string' || !c.trim())) return { error: 'certRequirements must be a list of certificate names' };
    specs.certRequirements = [...new Set(list.map((c) => c.trim().toUpperCase().slice(0, 30)))];
  }
  if (!blank(raw.gradeId)) specs.gradeId = String(raw.gradeId);
  return { specs };
}

/** Requirements on the line first, then whatever the earlier step held for the fields not given. */
export function mergeSpecs(given = {}, earlier = {}) {
  return { ...(earlier || {}), ...(given || {}) };
}

/**
 * The quote-line and order-line columns for a set of requirements. Processing has no column of
 * its own on those lines, so it is kept in the spec notes, said once.
 */
export function specColumns(specs = {}) {
  const out = {};
  for (const f of COLUMN_FIELDS) if (specs[f] !== undefined && f !== 'specNotes') out[f] = specs[f];
  const notes = [specs.specNotes, specs.processing && !String(specs.specNotes || '').includes(specs.processing) ? `Processing: ${specs.processing}` : null].filter(Boolean);
  if (notes.length) out.specNotes = notes.join(' · ').slice(0, 2000);
  return out;
}

/** Requirements back out of a quote or order line's columns (null and empty left out). */
export function specsOfLine(line = {}) {
  const out = {};
  for (const f of COLUMN_FIELDS) {
    const v = line[f];
    if (blank(v) || (Array.isArray(v) && !v.length)) continue;
    out[f] = NUMBER_FIELDS.includes(f) ? Number(v) : v;
  }
  return out;
}
