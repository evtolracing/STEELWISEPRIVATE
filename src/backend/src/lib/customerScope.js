/**
 * Customer logins (CUSTOMER_* roles) buy for one customer account, set on
 * User.customerId. These helpers pin store and portal requests to it, so a
 * customer only ever sees their own account's orders and documents.
 */
export const CUSTOMER_ROLES = new Set(['CUSTOMER_ADMIN', 'CUSTOMER_BUYER', 'CUSTOMER_VIEWER']);

export const isCustomerLogin = (user) => CUSTOMER_ROLES.has(user?.role);

/**
 * The customer account a request may use.
 *  - staff: whatever the request asked for (`requested`)
 *  - customer logins: always their own account; undefined if none is linked
 */
export function scopedCustomerId(req, requested) {
  if (!isCustomerLogin(req.user)) return requested;
  return req.user.customerId || undefined;
}

/** Express middleware: customer logins without a linked account get a 403. */
export function requireLinkedCustomer(req, res, next) {
  if (isCustomerLogin(req.user) && !req.user.customerId) {
    return res.status(403).json({ error: 'This login is not linked to a customer account yet. Ask your sales rep to link it.' });
  }
  next();
}
