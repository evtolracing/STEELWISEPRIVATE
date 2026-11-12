/**
 * Role rules for the API, in step with src/frontend/src/config/roleAccess.js.
 *
 *  - Customer and partner logins (CUSTOMER_*, SUPPLIER_USER, CARRIER_USER) can
 *    only use the store APIs.
 *  - Executive dashboards and order-speed metrics are for leadership.
 */
export const EXTERNAL_ROLES = new Set(['CUSTOMER_ADMIN', 'CUSTOMER_BUYER', 'CUSTOMER_VIEWER', 'SUPPLIER_USER', 'CARRIER_USER']);

export const EXTERNAL_PREFIXES = [
  '/api/auth', '/api/ecom', '/api/enterprise', '/api/remnants', '/api/promise', '/api/v1/fulfillment',
];

export const LEADERSHIP_PREFIXES = ['/api/executive', '/api/metrics/compression'];
export const LEADERSHIP_ROLES = new Set([
  'SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN', 'BRANCH_MANAGER', 'OPS_MANAGER',
  'EXECUTIVE', 'CFO', 'COO', 'CIO', 'DIVISION_DIRECTOR', 'SERVICE_CENTER',
  'SALES_DIRECTOR', 'DATA_ANALYST',
]);

const under = (path, prefix) => path === prefix || path.startsWith(`${prefix}/`);

/** null when allowed, otherwise the reason for a 403. */
export function apiRoleDenial(role, path) {
  if (EXTERNAL_ROLES.has(role)) {
    return EXTERNAL_PREFIXES.some((p) => under(path, p)) ? null : 'Customer and partner accounts can only use the online store.';
  }
  if (LEADERSHIP_PREFIXES.some((p) => under(path, p)) && !LEADERSHIP_ROLES.has(role)) {
    return 'Executive pages are limited to leadership roles.';
  }
  return null;
}
