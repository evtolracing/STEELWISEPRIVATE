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

/**
 * Who may CHANGE business records through the API (reads are not limited here).
 * Departments match the role groups the screens use.
 *
 *  - Sales records (orders, quotes, RFQs, customers, counter sales, invoices
 *    and payments, opening a return): sales, managers and leadership.
 *  - Reserving stock for an order and receiving a return also: warehouse and production.
 *  - Stock records: warehouse, production, quality, managers and leadership.
 *  - Shipments: warehouse, sales, production leads, managers and leadership.
 *  - Jobs and work orders: production, sales, warehouse, quality, managers and leadership.
 *  - Credits, refunds, cancelling an invoice and voiding a counter sale: managers only.
 *  - Analysts and auditors can look at everything their screens show and change none of the above.
 */
export const STAFF_GROUPS = {
  admin: ['SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN', 'BRANCH_MANAGER', 'OPS_MANAGER'],
  leadership: ['EXECUTIVE', 'CFO', 'COO', 'CIO', 'DIVISION_DIRECTOR', 'SERVICE_CENTER'],
  sales: ['SALES_DIRECTOR', 'SALES_REP', 'CSR', 'ESTIMATOR', 'CREDIT_MANAGER', 'SUPPORT_AGENT'],
  production: ['PRODUCTION_MANAGER', 'SCHEDULER', 'WORKCENTER_LEAD', 'OPERATOR_SAW', 'OPERATOR_ROUTER', 'OPERATOR_SHEAR', 'OPERATOR_PLASMA', 'OPERATOR_GENERAL', 'MILL_OPERATOR', 'PACKAGING_LEAD', 'MATERIAL_HANDLER'],
  warehouse: ['INVENTORY_MANAGER', 'BUYER', 'RECEIVING_CLERK', 'SHIPPING_COORDINATOR'],
  quality: ['QC_MANAGER', 'QC_INSPECTOR'],
  maintenance: ['MAINTENANCE_MANAGER'],
  readOnly: ['DATA_ANALYST', 'AUDITOR'],
  integration: ['INTEGRATION_ADMIN'],
};
export const staffGroupOf = (role) => Object.keys(STAFF_GROUPS).find((g) => STAFF_GROUPS[g].includes(role)) || null;
export const MONEY_MANAGERS = new Set([...STAFF_GROUPS.admin, ...STAFF_GROUPS.leadership, 'CREDIT_MANAGER', 'SALES_DIRECTOR']);
const SHIPPING_EXTRA = new Set(['PRODUCTION_MANAGER', 'PACKAGING_LEAD', 'MATERIAL_HANDLER', 'WORKCENTER_LEAD']);

const MANAGER_ONLY = [
  /^\/api\/invoices\/[^/]+\/(credit|refund|cancel)$/,
  /^\/api\/pos\/quick-sale\/[^/]+\/void$/,
  /^\/api\/tax-rates(\/|$)/,
];
// First match wins. [test, groups allowed, what to tell everyone else]
const WRITE_RULES = [
  [(p) => /^\/api\/orders\/[^/]+\/allocate$/.test(p), ['sales', 'warehouse', 'production'], 'Reserving stock for an order'],
  [(p) => /^\/api\/returns\/[^/]+\/receive$/.test(p), ['sales', 'warehouse', 'production'], 'Receiving a return'],
  [(p) => under(p, '/api/pos'), ['sales', 'warehouse'], 'Counter sales'],
  [(p) => ['/api/orders', '/api/rfqs', '/api/quotes', '/api/returns', '/api/customers', '/api/invoices', '/api/sales'].some((x) => under(p, x)), ['sales'], 'Orders, quotes, customers and invoices'],
  [(p) => ['/api/inventory', '/api/coils', '/api/heats'].some((x) => under(p, x)), ['warehouse', 'production', 'quality'], 'Stock records'],
  [(p) => under(p, '/api/shipments'), ['warehouse', 'sales'], 'Shipments'],
  [(p) => ['/api/jobs', '/api/work-orders'].some((x) => under(p, x)), ['production', 'sales', 'warehouse', 'quality'], 'Jobs'],
];
const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** null when allowed, otherwise the reason for a 403. Only for staff roles and requests that change something. */
export function staffWriteDenial(role, path, method) {
  if (READ_METHODS.has(method)) return null;
  const group = staffGroupOf(role);
  if (group === 'admin' || group === 'leadership') return null;
  if (MANAGER_ONLY.some((re) => re.test(path))) {
    return MONEY_MANAGERS.has(role) ? null : 'Credits, refunds, cancelling an invoice, voiding a sale and changing tax rates need a manager.';
  }
  const rule = WRITE_RULES.find(([test]) => test(path));
  if (!rule) return null;
  const [, groups, what] = rule;
  if (groups.includes(group)) return null;
  if (under(path, '/api/shipments') && SHIPPING_EXTRA.has(role)) return null;
  return `${what} can only be changed by ${groups.join(', ')} staff or a manager. Your role (${role || 'none'}) can view them.`;
}

/** null when allowed, otherwise the reason for a 403. */
export function apiRoleDenial(user, path, method = 'GET') {
  const role = user?.role;
  if (EXTERNAL_ROLES.has(role)) {
    if (EXTERNAL_PREFIXES.some((p) => under(path, p))) return null;
    // A customer login may read its own account's saved store preferences.
    if (method === 'GET' && user.customerId && path === `/api/customers/${user.customerId}/preferences`) return null;
    return 'Customer and partner accounts can only use the online store.';
  }
  if (LEADERSHIP_PREFIXES.some((p) => under(path, p)) && !LEADERSHIP_ROLES.has(role)) {
    return 'Executive pages are limited to leadership roles.';
  }
  return staffWriteDenial(role, path, method);
}
