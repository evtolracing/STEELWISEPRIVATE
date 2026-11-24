/**
 * What a person needs to do a step correctly, kept on the step (owner, 2026-11-24: "the planning card
 * doesn't ask qty or anything ... work orders and job cards need all the important details"), and the
 * material facts a plan starts from, filled in from what is already on file. Pure, so it is unit tested.
 *
 *   step details: { qty, lengthIn, widthIn, tolerance, notes }   (any of them; none is required)
 */
const blank = (v) => v === undefined || v === null || v === '';
const num = (v) => (blank(v) || !Number.isFinite(Number(v)) ? null : Number(v));
const trim = (n) => String(Number(Number(n).toFixed(4)));

export const STEP_DETAIL_FIELDS = ['qty', 'lengthIn', 'widthIn', 'tolerance', 'notes'];

/** Reads one step's details from a request. { details } (null when nothing was given) or { error }. */
export function readStepDetails(raw) {
  if (blank(raw)) return { details: null };
  if (typeof raw !== 'object' || Array.isArray(raw)) return { error: 'A step\'s details must be an object' };
  const out = {};
  if (!blank(raw.qty)) {
    const n = Number(raw.qty);
    if (!Number.isInteger(n) || n < 1 || n > 1000000) return { error: 'Pieces must be a whole number of 1 or more' };
    out.qty = n;
  }
  for (const [field, label] of [['lengthIn', 'Length'], ['widthIn', 'Width']]) {
    if (blank(raw[field])) continue;
    const n = Number(raw[field]);
    if (!Number.isFinite(n) || n <= 0 || n > 100000) return { error: `${label} must be a number more than zero (inches)` };
    out[field] = Number(n.toFixed(4));
  }
  for (const [field, max] of [['tolerance', 60], ['notes', 500]]) {
    if (blank(raw[field])) continue;
    if (typeof raw[field] !== 'string' && typeof raw[field] !== 'number') return { error: `${field} must be text` };
    const text = String(raw[field]).trim().slice(0, max);
    if (text) out[field] = text;
  }
  return { details: Object.keys(out).length ? out : null };
}

/** One line a person reads at the machine: 12 pcs · 24" long · 6" wide · tol ±1/16 · Deburr both ends. '' when empty. */
export function stepDetailText(details) {
  if (!details || typeof details !== 'object') return '';
  return [
    num(details.qty) ? `${num(details.qty).toLocaleString('en-US')} ${num(details.qty) === 1 ? 'pc' : 'pcs'}` : null,
    num(details.lengthIn) ? `${trim(details.lengthIn)}" long` : null,
    num(details.widthIn) ? `${trim(details.widthIn)}" wide` : null,
    details.tolerance ? `tol ${details.tolerance}` : null,
    details.notes || null,
  ].filter(Boolean).join(' · ');
}

/** Thickness x width x length of whatever is on file: 0.25" x 48" x 96". '' when none. */
export function sizeText({ thicknessIn, widthIn, lengthIn } = {}) {
  return [thicknessIn, widthIn, lengthIn].map(num).filter((n) => n > 0).map((n) => `${trim(n)}"`).join(' x ');
}

const PIECE_UNITS = ['EA', 'PC', 'PCS', 'PIECE', 'PIECES', 'EACH'];
const FORMS = ['PLATE', 'SHEET', 'BAR', 'COIL', 'TUBE', 'ANGLE', 'BEAM'];

/**
 * The material facts a new plan starts from. Each one is taken from the first place that has it:
 * the job's own specification, then the order line, then the stock item its work order cuts.
 * Nothing is assumed: a fact nobody recorded is null. `from` says where each came from.
 *   job:  { thicknessIn, widthIn, lengthIn, gradeOverride, instructions }
 *   line: { lineNumber, description, thicknessIn, widthIn, lengthIn, gradeOverride, grade: { code }, product: { name, form }, qtyOrdered, unit, tolerance... }
 *   item: { coilNumber, form, thicknessIn, widthIn, lengthIn, grade: { code }, product: { name } }  (the work order's source stock)
 */
export function planDefaults({ job = null, line = null, item = null } = {}) {
  const from = {};
  const pick = (field, choices) => {
    for (const [where, value] of choices) {
      if (!blank(value) && !(typeof value === 'number' && !(value > 0))) { from[field] = where; return value; }
    }
    return null;
  };
  const lineName = line ? `order line ${line.lineNumber ?? ''}`.trim() : 'order line';
  const itemName = item?.coilNumber ? `stock item ${item.coilNumber}` : 'stock item';
  const size = (field) => pick(field, [['job', num(job?.[field])], [lineName, num(line?.[field])], [itemName, num(item?.[field])]]);
  const form = String(pick('form', [[lineName, line?.product?.form], [itemName, item?.form]]) || '').toUpperCase();
  const unit = String(line?.unit || '').toUpperCase();
  const qtyOrdered = num(line?.qtyOrdered);
  const out = {
    material: pick('material', [[lineName, line?.product?.name], [lineName, line?.description], [itemName, item?.product?.name], ['job', job?.instructions]]),
    grade: pick('grade', [['job', job?.gradeOverride], [lineName, line?.gradeOverride], [lineName, line?.grade?.code], [itemName, item?.grade?.code]]),
    form: FORMS.includes(form) ? form : null,
    thicknessIn: size('thicknessIn'),
    widthIn: size('widthIn'),
    lengthIn: size('lengthIn'),
    // Pieces only when the line was sold by the piece: pounds or feet are not a count of cuts.
    qty: PIECE_UNITS.includes(unit) && Number.isInteger(qtyOrdered) && qtyOrdered > 0 ? (from.qty = lineName, qtyOrdered) : null,
    orderedQty: qtyOrdered,
    orderedUnit: unit || null,
    stockItem: item?.coilNumber || null,
  };
  if (!FORMS.includes(form)) delete from.form;
  return { ...out, from };
}
