/**
 * Rules and rates kept per kind of work center (owner's decision of 2026-11-15; L-022, L-026, L-028):
 * whether an operator needs a current certification, whether an operator may be clocked on to more
 * than one step of this kind at once, the labor rate used for job cost, and the checks an inspection
 * of this kind of work starts with. Pure: reads a request body, returns { data } or { error, status }.
 */
export const CHECKLIST_MAX = 40;

/** A checklist as stored: [{ item, required }]. Returns { list } or { error }. */
export function readChecklist(value) {
  if (value === null) return { list: null };
  if (!Array.isArray(value)) return { error: 'inspectionChecklist must be a list of checks, or empty to use the standard list' };
  if (value.length === 0) return { list: null };
  if (value.length > CHECKLIST_MAX) return { error: `An inspection checklist can hold ${CHECKLIST_MAX} checks at most` };
  const seen = new Set(); const list = [];
  for (const [i, row] of value.entries()) {
    const item = typeof row === 'string' ? row.trim() : typeof row?.item === 'string' ? row.item.trim() : '';
    if (!item) return { error: `Check ${i + 1} has no wording` };
    if (item.length > 200) return { error: `Check ${i + 1} is longer than 200 characters` };
    if (seen.has(item.toLowerCase())) return { error: `"${item}" is on the checklist twice` };
    seen.add(item.toLowerCase());
    const required = typeof row === 'string' ? true : row.required === undefined ? true : row.required;
    if (typeof required !== 'boolean') return { error: `Check ${i + 1}: required must be yes or no` };
    list.push({ item, required });
  }
  return { list };
}

/** Reads the rule fields present in a body. mayCost: the person may set the labor rate. */
export function readKindRules(body, { mayCost = false } = {}) {
  const data = {};
  for (const f of ['certificationRequired', 'allowsConcurrentSteps']) {
    if (body?.[f] === undefined) continue;
    if (typeof body[f] !== 'boolean') return { status: 400, error: `${f} must be true or false` };
    data[f] = body[f];
  }
  if (body?.hourlyRate !== undefined) {
    if (!mayCost) return { status: 403, error: 'Setting a labor rate needs a manager, the inventory manager or a buyer.' };
    if (body.hourlyRate === null || body.hourlyRate === '') data.hourlyRate = null;
    else {
      const rate = Number(body.hourlyRate);
      if (typeof body.hourlyRate === 'boolean' || !Number.isFinite(rate) || rate < 0 || rate > 100000) return { status: 400, error: 'hourlyRate must be an amount per hour, zero or more' };
      data.hourlyRate = Math.round(rate * 100) / 100;
    }
  }
  if (body?.inspectionChecklist !== undefined) {
    const read = readChecklist(body.inspectionChecklist);
    if (read.error) return { status: 400, error: read.error };
    data.inspectionChecklist = read.list;
  }
  return { data };
}

/** The checks a new inspection starts with: the kind's own list when it has one, else the standard list. */
export function checklistFor(kind, standard) {
  const own = Array.isArray(kind?.inspectionChecklist) ? kind.inspectionChecklist : null;
  if (!own || !own.length) return standard;
  return own.map((c) => ({ item: c.item, required: c.required !== false, result: null, notes: '' }));
}
