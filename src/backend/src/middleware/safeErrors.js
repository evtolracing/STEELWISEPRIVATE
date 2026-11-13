/**
 * Keeps database and server internals out of error replies.
 *
 * Many routes answer a failure with the raw error message. When that message
 * comes from the database layer it names tables, columns and query shapes.
 * This runs for every /api reply: on a 4xx/5xx, any such text is logged on the
 * server and replaced with a plain sentence. Messages written for people
 * ("Order not found") pass through untouched.
 */
const INTERNAL = /prisma|Invalid `|Unique constraint|Foreign key constraint|violates|relation "|column "|syntax error|ECONNREFUSED|ENOTFOUND|node_modules|\n\s+at |Cannot read properties|is not a function|is not defined/i;
const FIELDS = ['error', 'details', 'message', 'stack'];

export function looksInternal(text) {
  return typeof text === 'string' && INTERNAL.test(text);
}

export function safeErrors(req, res, next) {
  const json = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 400 && body && typeof body === 'object' && !Array.isArray(body)) {
      let cleaned = null;
      for (const field of FIELDS) {
        if (!looksInternal(body[field])) continue;
        cleaned ||= { ...body };
        if (field === 'error' || (field === 'message' && body.error === undefined)) {
          cleaned[field] = res.statusCode >= 500 ? 'Something went wrong on our side. Please try again.' : 'That request could not be processed. Check the values and try again.';
        } else delete cleaned[field];
      }
      if (cleaned) {
        console.error(`[safeErrors] ${req.method} ${req.originalUrl} → ${res.statusCode}:`, FIELDS.map((f) => body[f]).filter(Boolean).join(' | ').slice(0, 2000));
        return json(cleaned);
      }
    }
    return json(body);
  };
  next();
}

const PAGING = ['limit', 'offset', 'page', 'pageSize', 'perPage', 'take', 'skip'];

/** Paging values must be whole numbers, zero or more. Stops "limit=abc" from reaching a query. */
export function pagingGuard(req, res, next) {
  for (const name of PAGING) {
    const value = req.query?.[name];
    if (value === undefined || value === '') continue;
    if (typeof value !== 'string' || !/^\d{1,9}$/.test(value)) {
      return res.status(400).json({ error: `${name} must be a whole number, zero or more` });
    }
  }
  next();
}
