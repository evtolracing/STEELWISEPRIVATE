/**
 * Keeps database and server internals out of error replies.
 *
 * Many routes answer a failure with the raw error message. When that message
 * comes from the database layer it names tables, columns and query shapes.
 * This runs for every /api reply: on a 4xx/5xx, any such text is logged on the
 * server and replaced with a plain sentence. Messages written for people
 * ("Order not found") pass through untouched.
 */
import { requestContext } from '../lib/requestContext.js';

const INTERNAL = /prisma|Invalid `|Unique constraint|Foreign key constraint|violates|relation "|column "|syntax error|ECONNREFUSED|ENOTFOUND|node_modules|\n\s+at |Cannot read properties|is not a function|is not defined/i;
const FIELDS = ['error', 'details', 'message', 'stack'];

export function looksInternal(text) {
  return typeof text === 'string' && INTERNAL.test(text);
}

const READS = new Set(['GET', 'HEAD']);

/**
 * True when the database client rejected a value that came from the request's
 * own query string or path. A rejected value the code supplied is our bug and
 * stays a server error.
 */
export function blamesCaller(message, req) {
  if (!message) return false;
  const sent = [...Object.values(req.query || {}), ...Object.values(req.params || {})]
    .flat().filter((v) => typeof v === 'string' && v.length > 0);
  return sent.some((v) => message.includes(JSON.stringify(v)) || message.includes(`'${v}'`));
}

/**
 * A change that failed for a reason that is the caller's, when the route answered 500 anyway.
 *  - the record to change does not exist                       → 404
 *  - the request carried values the database layer would not take (a required one missing, or
 *    the wrong kind)                                           → 400, and the detail is logged
 * Returns null for everything else, which stays a server error.
 */
export function callerMistake(statusCode, req, store) {
  if (statusCode === 500 && store?.outsideBranch) return { status: 403, error: 'That record belongs to another branch.' };
  if (statusCode !== 500 || READS.has(req.method)) return null;
  if (store?.recordNotFound) return { status: 404, error: 'That record was not found.' };
  if (store?.rejectedShape) return { status: 400, error: 'Some of the values in this request are missing or not valid.' };
  // The database's own rules refused the change (finding H-017). The route did not expect it,
  // but nothing was saved, and the caller can act on a 409 where a 500 says nothing.
  if (store?.ruleRefusal === 'REFERENCE') return { status: 409, code: 'RULE_REFUSED', error: 'This change refers to a record that does not exist, or would remove one that other records still use.' };
  if (store?.ruleRefusal === 'CHECK') return { status: 409, code: 'RULE_REFUSED', error: 'This change was refused because the values do not agree with each other (for example a total that does not equal its parts, or a quantity below zero).' };
  return null;
}

export function safeErrors(req, res, next) {
  const json = res.json.bind(res);
  const store = {};
  res.json = (body) => {
    // A read that failed only because a filter value was the wrong kind is the caller's mistake, not ours.
    if (res.statusCode === 500 && READS.has(req.method) && blamesCaller(store.badFilterValue, req)) {
      res.status(400);
      return json({ error: 'One of the filter values in this request is not valid.' });
    }
    const verdict = callerMistake(res.statusCode, req, store);
    if (verdict) {
      if (verdict.status === 400) console.error(`[safeErrors] ${req.id || '-'} ${req.method} ${req.originalUrl.split('?')[0]} → 400 (values refused by the database layer):`, store.rejectedShape);
      if (verdict.code === 'RULE_REFUSED') console.error(`[safeErrors] ${req.id || '-'} ${req.method} ${req.originalUrl.split('?')[0]} → 409 (refused by a database rule; the route should check this first):`, store.ruleRefusalDetail);
      res.status(verdict.status);
      return json({ error: verdict.error, ...(verdict.code && { code: verdict.code }), ...(req.id && { requestId: req.id }) });
    }
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
        if (res.statusCode >= 500 && req.id) cleaned.requestId = req.id;
        console.error(`[safeErrors] ${req.id || '-'} ${req.method} ${req.originalUrl.split('?')[0]} → ${res.statusCode}:`, FIELDS.map((f) => body[f]).filter(Boolean).join(' | ').slice(0, 2000));
        return json(cleaned);
      }
      // Every server-error reply carries the request id so it can be found in the logs.
      if (res.statusCode >= 500 && req.id && body.requestId === undefined) return json({ ...body, requestId: req.id });
    }
    return json(body);
  };
  requestContext.run(store, next);
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
