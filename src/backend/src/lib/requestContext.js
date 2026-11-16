/**
 * Per-request scratch space, so the database layer can tell the reply layer
 * "this query failed because of a value the caller sent".
 */
import { AsyncLocalStorage } from 'node:async_hooks';

export const requestContext = new AsyncLocalStorage();

/** True when a database error means a filter value was the wrong kind (not a bug in the query). */
export function isBadFilterValue(error) {
  return error?.name === 'PrismaClientValidationError' && /Invalid value for argument|Invalid value provided/.test(error.message || '');
}

/** True when a change was aimed at a record that does not exist (update or delete of an unknown id). */
export function isRecordNotFound(error) {
  return error?.code === 'P2025';
}

/** True when the database client refused the shape of what it was given: a required value missing, or the wrong kind of value. */
export function isRejectedShape(error) {
  return error?.name === 'PrismaClientValidationError';
}

/**
 * The database itself refused a change: a reference to a row that does not exist (or the
 * removal of one still in use), or a value check such as "the total equals its parts".
 * Returns 'REFERENCE', 'CHECK' or null.
 */
export function ruleRefusal(error) {
  if (!error) return null;
  if (error.code === 'P2003') return 'REFERENCE';
  if (error.code === 'P2004' || /violates check constraint|code: "23514"|SqlState\(E?23514\)/.test(String(error.message || ''))) return 'CHECK';
  return null;
}
