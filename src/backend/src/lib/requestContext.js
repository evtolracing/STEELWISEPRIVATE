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
