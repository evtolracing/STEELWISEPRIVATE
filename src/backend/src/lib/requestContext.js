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
