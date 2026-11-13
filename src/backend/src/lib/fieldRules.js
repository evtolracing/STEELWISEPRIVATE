/**
 * Reads a request body against a list of allowed fields, so a route never
 * writes whatever the browser sent (findings S-025, I-004).
 *
 *   const { data, error } = readFields(req.body, SPEC, { creating: true });
 *
 * SPEC: { field: { type, required?, values?, min?, max?, maxLength? } }
 * type: 'string' | 'number' | 'boolean' | 'enum' | 'date' | 'json' | 'id'
 * Fields not in SPEC are ignored. A field sent as null or '' clears it,
 * unless it is required. Pure: no database access.
 */
const empty = (v) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '');

function readOne(name, rule, value) {
  switch (rule.type) {
    case 'string':
    case 'id': {
      if (typeof value !== 'string' && typeof value !== 'number') return { error: `${name} must be text` };
      const text = String(value).trim();
      const max = rule.maxLength || (rule.type === 'id' ? 64 : 500);
      if (text.length > max) return { error: `${name} is too long (${max} characters at most)` };
      return { value: text };
    }
    case 'number': {
      const n = typeof value === 'string' ? Number(value.trim()) : value;
      if (typeof n !== 'number' || !Number.isFinite(n)) return { error: `${name} must be a number` };
      if (rule.min !== undefined && n < rule.min) return { error: `${name} must be ${rule.min} or more` };
      if (rule.max !== undefined && n > rule.max) return { error: `${name} must be ${rule.max} or less` };
      return { value: n };
    }
    case 'boolean':
      if (value === true || value === 'true') return { value: true };
      if (value === false || value === 'false') return { value: false };
      return { error: `${name} must be yes or no` };
    case 'enum':
      if (!rule.values.includes(value)) return { error: `${name} must be one of ${rule.values.join(', ')}` };
      return { value };
    case 'date': {
      const d = new Date(value);
      if (typeof value === 'boolean' || Number.isNaN(d.getTime())) return { error: `${name} must be a date` };
      const year = d.getUTCFullYear();
      if (year < 1950 || year > 2100) return { error: `${name} is not a believable date` };
      return { value: d };
    }
    case 'json': {
      if (typeof value !== 'object' || Array.isArray(value)) return { error: `${name} must be a set of named values` };
      if (JSON.stringify(value).length > (rule.maxLength || 4000)) return { error: `${name} is too large` };
      return { value };
    }
    default:
      return { error: `${name} cannot be set` };
  }
}

export function readFields(body, spec, { creating = false } = {}) {
  const source = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const data = {};
  for (const [name, rule] of Object.entries(spec)) {
    const sent = Object.prototype.hasOwnProperty.call(source, name);
    if (!sent || (creating && empty(source[name]) && !rule.required)) {
      if (creating && rule.required) return { data: null, error: `${name} is required` };
      continue;
    }
    if (empty(source[name])) {
      if (rule.required || rule.type === 'boolean') return { data: null, error: `${name} is required` };
      data[name] = null;
      continue;
    }
    const got = readOne(name, rule, source[name]);
    if (got.error) return { data: null, error: got.error };
    data[name] = got.value;
  }
  return { data, error: null };
}

/** min must not be above max for each [minField, maxField] pair present in `row`. Returns a message or null. */
export function rangeError(row, pairs) {
  for (const [lo, hi] of pairs) {
    if (row[lo] != null && row[hi] != null && Number(row[lo]) > Number(row[hi])) return `${lo} cannot be more than ${hi}`;
  }
  return null;
}
