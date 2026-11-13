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
/** Who is sent what stock cost: managers, the inventory manager and buyers. Everyone else sees list price only. */
export const COST_VIEWERS = new Set([...MONEY_MANAGERS, 'INVENTORY_MANAGER', 'BUYER']);
const SHIPPING_EXTRA = new Set(['PRODUCTION_MANAGER', 'PACKAGING_LEAD', 'MATERIAL_HANDLER', 'WORKCENTER_LEAD']);

// The manager of each department, for changes that need one but not a branch manager.
const DEPARTMENT_MANAGERS = ['PRODUCTION_MANAGER', 'INVENTORY_MANAGER', 'QC_MANAGER', 'MAINTENANCE_MANAGER', 'SALES_DIRECTOR', 'CREDIT_MANAGER'];
// Every department that does work (not the view-only roles, not integrations).
const EVERY_DEPARTMENT = ['sales', 'production', 'warehouse', 'quality', 'maintenance'];

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
  // ── The areas that had no department until Phase 2 (finding B-004). The owner asked for the best
  // logical assignment (decision 3, 13 November 2026). An entry is a department or a single role;
  // managers and leadership may always change these. `m` is the request method.
  [(p, m) => under(p, '/api/documents') && m === 'DELETE', [...DEPARTMENT_MANAGERS], 'Deleting a document', 'a department manager'],
  [(p) => ['/api/processing-recipes', '/api/v1/bom'].some((x) => under(p, x)), ['PRODUCTION_MANAGER', 'SCHEDULER', 'QC_MANAGER'], 'Processing recipes and bills of material', 'the production manager, a scheduler or the quality manager'],
  [(p) => under(p, '/api/work-centers'), ['PRODUCTION_MANAGER', 'SCHEDULER', 'MAINTENANCE_MANAGER'], 'Work centers', 'the production manager, a scheduler or the maintenance manager'],
  [(p) => under(p, '/api/v1/dispatch'), ['PRODUCTION_MANAGER', 'SCHEDULER', 'WORKCENTER_LEAD'], 'Dispatch set-up and scheduling runs', 'the production manager, a scheduler or a work center lead'],
  [(p) => under(p, '/api/staff'), ['PRODUCTION_MANAGER', 'SCHEDULER', 'WORKCENTER_LEAD'], 'Operators, skills and shifts', 'the production manager, a scheduler or a work center lead'],
  [(p) => under(p, '/api/assets'), ['maintenance', 'PRODUCTION_MANAGER'], 'Equipment records', 'maintenance or the production manager'],
  [(p, m) => under(p, '/api/maintenance-orders') && m === 'DELETE', ['MAINTENANCE_MANAGER', 'PRODUCTION_MANAGER'], 'Deleting a maintenance order', 'the maintenance or production manager'],
  [(p) => under(p, '/api/maintenance-orders'), ['maintenance', 'production'], 'Maintenance orders', 'maintenance or production staff'],
  [(p) => under(p, '/api/drop-tags/templates'), ['PRODUCTION_MANAGER', 'INVENTORY_MANAGER', 'PACKAGING_LEAD'], 'Tag templates', 'the production manager, the inventory manager or the packaging lead'],
  [(p) => under(p, '/api/drop-tags'), ['production', 'warehouse'], 'Drop tags and packages', 'production or warehouse staff'],
  [(p) => under(p, '/api/print-queue'), ['production', 'warehouse', 'sales', 'quality'], 'The print queue', 'production, warehouse, sales or quality staff'],
  // Anyone may stop work for safety. Moving it on and clearing it is for a supervisor.
  [(p) => /^\/api\/safety\/stop-work\/[^/]+\/(status|clearance|steps\/[^/]+\/complete)$/.test(p), ['PRODUCTION_MANAGER', 'MAINTENANCE_MANAGER', 'QC_MANAGER', 'WORKCENTER_LEAD'], 'Clearing a stop-work', 'a production, maintenance or quality manager, or a work center lead'],
  [(p) => under(p, '/api/safety/stop-work'), EVERY_DEPARTMENT, 'Stop-work records', 'staff'],
  [(p) => under(p, '/api/v1/inventory'), ['warehouse', 'production', 'quality'], 'Stock records', 'warehouse, production or quality staff'],
  [(p) => /^\/api\/v1\/orders\/[^/]+\/(plan|mark-packaging)$/.test(p), ['production', 'sales', 'warehouse'], 'Planning and packaging an order', 'production, sales or warehouse staff'],
  [(p) => ['/api/v1/contacts', '/api/v1/rfq', '/api/v1/quotes', '/api/v1/orders'].some((x) => under(p, x)), ['sales'], 'Order hub contacts, requests, quotes and orders', 'sales staff'],
  [(p) => p === '/api/demand-shaping/config', ['SALES_DIRECTOR'], 'Demand shaping settings', 'the sales director'],
  [(p) => under(p, '/api/demand-shaping'), ['sales'], 'Demand shaping suggestions', 'sales staff'],
  [(p) => under(p, '/api/v1/events'), EVERY_DEPARTMENT, 'Exception events', 'staff'],
  [(p) => under(p, '/api/material-tracking'), ['warehouse', 'production', 'quality'], 'Material tracking', 'warehouse, production or quality staff'],
  [(p) => under(p, '/api/v1/operations'), ['production'], 'Shop-floor operations', 'production staff'],
  [(p) => under(p, '/api/qc'), ['quality', 'PRODUCTION_MANAGER'], 'Inspections', 'quality staff or the production manager'],
  [(p) => ['/api/v1/pipeline', '/api/v1/ingest'].some((x) => under(p, x)), ['sales'], 'The order pipeline', 'sales staff'],
  [(p) => under(p, '/api/ops-cockpit') && !p.endsWith('/explain'), ['PRODUCTION_MANAGER', 'SCHEDULER', 'INVENTORY_MANAGER'], 'Operations recommendations', 'the production manager, a scheduler or the inventory manager'],
];
const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Some records answer at two addresses (app.js mounts the same routes twice). The rules are
// written for the first address; a request to the second is judged as if it came to the first.
const SAME_RECORDS = [[/^\/api\/v1\/(jobs|work-centers)(?=\/|$)/, '/api/$1']];
export const ruledPath = (path) => SAME_RECORDS.reduce((p, [from, to]) => p.replace(from, to), path);

// Requests that ask a question and change no record: signing in, asking the assistant, pricing a
// basket, checking a form. Read-only roles may send these; every other change is refused for them.
export const ASK_ONLY_PREFIXES = [
  '/api/auth', '/api/ai', '/api/v1/ai', '/api/pricing', '/api/pos/validation',
  '/api/pos/quick-sale/lookup', '/api/pos/quick-sale/price',
  '/api/v1/bom/recipes/match', '/api/v1/bom/ai-suggest', '/api/v1/pipeline/simulate', '/api/ops-cockpit/recommendations/explain',
];

/** The department rule a changing request falls under, or null when the area has none. Used by the coverage check. */
export const writeRuleFor = (rawPath, method) => { const path = ruledPath(rawPath); if (MANAGER_ONLY.some((re) => re.test(path))) return 'manager only'; const r = WRITE_RULES.find(([test]) => test(path, method)); return r ? r[2] : null; };

/** null when allowed, otherwise the reason for a 403. Only for staff roles and requests that change something. */
export function staffWriteDenial(role, rawPath, method) {
  if (READ_METHODS.has(method)) return null;
  const path = ruledPath(rawPath);
  const group = staffGroupOf(role);
  if (group === 'admin' || group === 'leadership') return null;
  if (group === 'readOnly') {
    return ASK_ONLY_PREFIXES.some((p) => under(path, p)) ? null : `Your role (${role}) can view records and cannot change them.`;
  }
  if (MANAGER_ONLY.some((re) => re.test(path))) {
    return MONEY_MANAGERS.has(role) ? null : 'Credits, refunds, cancelling an invoice, voiding a sale and changing tax rates need a manager.';
  }
  const rule = WRITE_RULES.find(([test]) => test(path, method));
  if (!rule) return null;
  const [, allowed, what, who] = rule;
  if (allowed.includes(group) || allowed.includes(role)) return null;
  if (under(path, '/api/shipments') && SHIPPING_EXTRA.has(role)) return null;
  return `${what} can only be changed by ${who || `${allowed.join(', ')} staff`} or a manager. Your role (${role || 'none'}) can view them.`;
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
