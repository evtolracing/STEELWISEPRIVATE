/**
 * The permission catalog: every right a role can hold, and which right each request needs.
 *
 * A permission is "<area>:<action>", for example "orders:edit". A role is a set of them
 * (Role.grants in the database). This file is the list of what exists; the database holds who has
 * what. Phase 1 of the editable role matrix: nothing in the running server reads this yet. The
 * server still decides with lib/roleAccess.js, middleware/apiGate.js and the role checks inside a
 * few routes. test/permissionMatrix.test.js proves that the built-in roles made from those rules
 * (scripts/permission-defaults.js) give the same answer as those rules for every role on every
 * route and every page, so the server can be switched over without changing what anyone can do.
 *
 * Only rights one of the server's rules decides are listed. A box that changes nothing is not offered.
 * Approve and export are not here yet: today they are decided inside single handlers (price overrides,
 * for example) and join the catalog when those checks move over.
 *
 * Actions: view opens the area's pages (and its records where the server limits reading);
 * create, edit and delete follow the request (POST, PUT or PATCH, DELETE); the rest are single
 * named rights of one area.
 */
import { ruledPath } from './roleAccess.js';

const under = (path, prefix) => path === prefix || path.startsWith(`${prefix}/`);
const any = (path, prefixes) => prefixes.some((x) => under(path, x));
const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CRUD = ['create', 'edit', 'delete'];
const BY_METHOD = { POST: 'create', PUT: 'edit', PATCH: 'edit', DELETE: 'delete' };

export const ACTION_LABELS = { view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete' };

/**
 * id       the area's name in a permission
 * page     the menu area it opens (SECTION_PATHS in src/frontend/src/config/roleAccess.js), if it has pages
 * actions  the grid boxes that do something for this area
 * special  single rights of this area: [action, what it allows, sensitive]
 */
const area = (id, label, group, page, actions, special = []) => ({ id, label, group, page, actions, special: special.map(([action, text, sensitive = false]) => ({ action, label: text, sensitive })) });

export const AREAS = [
  area('sales', 'Sales and pricing', 'Sales', 'sales', ['view', ...CRUD], [
    ['ask', 'Run a what-if on the order pipeline (changes nothing)'],
    ['configure', 'Change the demand shaping settings'],
    ['editProducts', 'Add or change a product'],
    ['editGrades', 'Add or change a grade'],
    ['setListPrice', 'Set or change a list price', true],
    ['approveOverride', 'Approve a price override or a counter discount, and read the override log', true],
  ]),
  area('customers', 'Customers and contacts', 'Sales', null, CRUD, [
    ['setCredit', 'Change a customer\'s price tier or credit limit', true],
  ]),
  area('quotes', 'Quotes and requests for quote', 'Sales', null, CRUD),
  area('orders', 'Orders', 'Sales', 'orders', ['view', ...CRUD], [
    ['allocate', 'Reserve stock for an order'],
    ['plan', 'Plan an order and mark it for packaging'],
    ['releaseCreditHold', 'Release an order from credit hold', true],
  ]),
  area('returns', 'Returns', 'Sales', null, CRUD, [['receive', 'Receive a return']]),
  area('billing', 'Invoices and payments', 'Sales', 'billing', ['view', ...CRUD], [
    ['credit', 'Issue credits and refunds, cancel an invoice', true],
  ]),
  area('counterSales', 'Counter sales', 'Sales', null, CRUD, [
    ['ask', 'Look up and price a counter sale (changes nothing)'],
    ['void', 'Void a counter sale', true],
  ]),

  area('inventory', 'Stock', 'Stock and purchasing', 'inventory', ['view', ...CRUD], [
    ['viewCost', 'See what stock cost and the margin', true],
    ['adjust', 'Correct a stock balance and settle a shortage', true],
  ]),
  area('materialTracking', 'Material tracking', 'Stock and purchasing', 'materialTracking', ['view', ...CRUD]),
  area('purchasing', 'Purchase orders', 'Stock and purchasing', 'purchasing', ['view', ...CRUD]),
  area('logistics', 'Receiving and shipping', 'Stock and purchasing', 'logistics', ['view', ...CRUD], [
    ['markLost', 'Record a load as lost (credits its invoice)', true],
  ]),
  area('opsCockpit', 'Operations cockpit', 'Stock and purchasing', 'opsCockpit', ['view', ...CRUD]),

  area('production', 'Production screens', 'Production', 'production', ['view']),
  area('jobs', 'Jobs and work orders', 'Production', null, CRUD, [
    ['releaseQualityHold', 'Release a quality hold on a work order'],
  ]),
  area('shopFloor', 'Shop-floor operations', 'Production', null, CRUD),
  area('recipes', 'Processing recipes and bills of material', 'Production', 'adminRecipes', ['view', ...CRUD], [
    ['ask', 'Match a recipe and ask for a suggestion (changes nothing)'],
  ]),
  area('workCenters', 'Work centers', 'Production', null, CRUD),
  area('dispatch', 'Dispatch and scheduling runs', 'Production', null, CRUD),
  area('staff', 'Operators, skills and shifts', 'Production', 'adminStaff', ['view', ...CRUD], [
    ['viewPay', 'See what operators are paid', true],
  ]),
  area('dropTags', 'Drop tags and packages', 'Production', null, CRUD, [
    ['qcRelease', 'Release or hold a package after inspection'],
    ['override', 'Print a tag again past the limit, and void a tag after the material left the dock'],
  ]),
  area('tagTemplates', 'Tag templates', 'Production', null, CRUD),
  area('printQueue', 'Print queue', 'Production', null, CRUD),

  area('quality', 'Inspections', 'Quality and safety', 'quality', ['view', ...CRUD]),
  area('supplierQuality', 'Supplier quality', 'Quality and safety', 'supplierQuality', ['view']),
  area('customerQuality', 'Customer quality', 'Quality and safety', 'customerQuality', ['view']),
  area('safety', 'Stop-work records', 'Quality and safety', null, CRUD, [
    ['clear', 'Move a stop-work on and clear it'],
  ]),
  area('events', 'Exception events', 'Quality and safety', null, CRUD),
  area('documents', 'Documents', 'Quality and safety', null, CRUD),

  area('maintenance', 'Maintenance orders', 'Maintenance', 'maintenance', ['view', ...CRUD]),
  area('assets', 'Equipment records', 'Maintenance', null, CRUD),
  area('contractors', 'Contractors', 'Maintenance', 'contractors', ['view']),

  area('ecommerce', 'Web shop', 'Web shop', 'ecommerce', ['view']),
  area('ecommerceAdmin', 'Web shop catalog and online settings', 'Web shop', 'ecommerceAdmin', ['view', 'edit']),

  area('executive', 'Executive dashboards', 'Leadership and finance', 'executive', ['view', 'create', 'edit']),
  area('finance', 'Financial ledger', 'Leadership and finance', 'finance', ['view', ...CRUD], [
    ['company', 'Read the whole company\'s books: chart, periods, reconciliations and exports', true],
    ['activate', 'Start and stop the books, change ledger settings', true],
  ]),

  area('adminUsers', 'Users', 'Administration', 'adminUsers', ['view', ...CRUD], [
    ['resetPassword', 'Reset another person\'s password', true],
  ]),
  area('roles', 'Roles and permissions', 'Administration', null, [], [
    ['edit', 'Create roles and change what a role may do', true],
  ]),
  area('adminIntegrations', 'Partner API and integrations', 'Administration', 'adminIntegrations', ['view', ...CRUD], [
    ['report', 'Read the integrations health report'],
  ]),
  area('taxRates', 'Tax rates', 'Administration', null, CRUD),
  area('locations', 'Locations', 'Administration', null, [], [
    ['add', 'Add a location', true],
    ['edit', 'Change a location\'s details'],
    ['remove', 'Switch a location off or on, or delete one that was never used', true],
  ]),
  area('admin', 'System settings and audit log', 'Administration', 'admin', ['view', 'create'], [
    ['retention', 'Read the record retention report'],
    ['preview', 'Preview what another role sees (View as)', true],
  ]),
  area('general', 'Everything else', 'Administration', null, ['view', ...CRUD]),
];

/** Every permission there is, as "<area>:<action>". */
export const PERMISSIONS = AREAS.flatMap((a) => [...a.actions, ...a.special.map((s) => s.action)].map((action) => `${a.id}:${action}`));
export const PERMISSION_SET = new Set(PERMISSIONS);

/**
 * The catalog's version, and the permissions each version added. A role saved under an older
 * version has never been asked about the newer permissions: until it is saved again it holds the
 * ones its built-in default holds (lib/roleStore.js, storedRole). That keeps everyone's access the
 * same when a right that used to be decided by role name becomes a box in the grid, with no
 * database update.
 *
 * Version 2 (phase 5): the rights the routes used to decide by fixed lists of role names.
 * Version 3 (2026-11-22): managing locations. Adding and removing is for the two top roles; the admin may change details.
 */
export const CATALOG_VERSION = 3;
export const ADDED_IN = {
  'sales:editProducts': 2, 'sales:editGrades': 2, 'sales:setListPrice': 2, 'sales:approveOverride': 2,
  'customers:setCredit': 2, 'orders:releaseCreditHold': 2, 'inventory:adjust': 2, 'jobs:releaseQualityHold': 2,
  'staff:viewPay': 2, 'dropTags:override': 2,
  'locations:add': 3, 'locations:edit': 3, 'locations:remove': 3,
};
/** The permissions a role saved under `version` has not been asked about. */
export const addedSince = (version) => Object.keys(ADDED_IN).filter((p) => ADDED_IN[p] > version);
/** The menu area (frontend section) each view permission opens. */
export const PAGE_PERMISSION = Object.fromEntries(AREAS.filter((a) => a.page).map((a) => [a.page, `${a.id}:view`]));
/** Pages outside every menu area (dashboards, safety, training, help). */
export const OPEN_PAGES_PERMISSION = 'general:view';

// ── Which permission a request needs ─────────────────────────────────────────────────────────────

// Questions that change nothing and sit under no area: any staff login may send them.
const ASK_FREELY = ['/api/auth', '/api/ai', '/api/v1/ai', '/api/pricing'];
const LEDGER_SWITCHES = /^\/api\/ledger\/(activate|deactivate|resume|settings|sandbox\/start)$/;
const LEDGER_COMPANY_READS = /^\/api\/ledger\/(chart|periods|reconciliations|external-accounts|exports)(\/|$)/;

// Changing requests. First match wins. [test(path, method), area, action]; no action = by the request's method.
const CHANGES = [
  [(p) => any(p, ASK_FREELY) || p === '/api/ops-cockpit/recommendations/explain', null],
  [(p) => any(p, ['/api/pos/validation', '/api/pos/quick-sale/lookup', '/api/pos/quick-sale/price']), 'counterSales', 'ask'],
  [(p) => any(p, ['/api/v1/bom/recipes/match', '/api/v1/bom/ai-suggest']), 'recipes', 'ask'],
  [(p) => under(p, '/api/v1/pipeline/simulate'), 'sales', 'ask'],

  [(p) => /^\/api\/invoices\/[^/]+\/(credit|refund|cancel)$/.test(p) || /^\/api\/returns\/[^/]+\/credit$/.test(p), 'billing', 'credit'],
  [(p) => /^\/api\/shipments\/[^/]+\/lost$/.test(p), 'logistics', 'markLost'],
  [(p) => /^\/api\/pos\/quick-sale\/[^/]+\/void$/.test(p), 'counterSales', 'void'],
  [(p) => under(p, '/api/tax-rates'), 'taxRates'],

  [(p) => LEDGER_SWITCHES.test(p), 'finance', 'activate'],
  [(p) => under(p, '/api/ledger'), 'finance'],

  [(p) => /^\/api\/orders\/[^/]+\/allocate$/.test(p), 'orders', 'allocate'],
  [(p) => /^\/api\/returns\/[^/]+\/receive$/.test(p), 'returns', 'receive'],
  [(p) => under(p, '/api/pos'), 'counterSales'],
  [(p) => under(p, '/api/purchase-orders'), 'purchasing'],
  [(p) => under(p, '/api/orders'), 'orders'],
  [(p) => any(p, ['/api/rfqs', '/api/quotes']), 'quotes'],
  [(p) => under(p, '/api/returns'), 'returns'],
  [(p) => under(p, '/api/customers'), 'customers'],
  [(p) => under(p, '/api/invoices'), 'billing'],
  [(p) => under(p, '/api/sales'), 'sales'],
  [(p) => any(p, ['/api/inventory', '/api/coils', '/api/heats', '/api/v1/inventory']), 'inventory'],
  [(p) => under(p, '/api/shipments'), 'logistics'],
  [(p) => any(p, ['/api/jobs', '/api/work-orders']), 'jobs'],
  [(p) => under(p, '/api/documents'), 'documents'],
  [(p) => any(p, ['/api/processing-recipes', '/api/v1/bom']), 'recipes'],
  [(p) => under(p, '/api/work-centers'), 'workCenters'],
  [(p) => under(p, '/api/v1/dispatch'), 'dispatch'],
  [(p) => under(p, '/api/staff'), 'staff'],
  [(p) => under(p, '/api/assets'), 'assets'],
  [(p) => under(p, '/api/maintenance-orders'), 'maintenance'],
  [(p) => under(p, '/api/drop-tags/templates'), 'tagTemplates'],
  [(p) => /^\/api\/drop-tags\/packages\/[^/]+\/qc-(release|hold)$/.test(p), 'dropTags', 'qcRelease'],
  [(p) => under(p, '/api/drop-tags'), 'dropTags'],
  [(p) => under(p, '/api/print-queue'), 'printQueue'],
  [(p) => /^\/api\/safety\/stop-work\/[^/]+\/(status|clearance|steps\/[^/]+\/complete)$/.test(p), 'safety', 'clear'],
  [(p) => under(p, '/api/safety/stop-work'), 'safety'],
  [(p) => /^\/api\/v1\/orders\/[^/]+\/(plan|mark-packaging)$/.test(p), 'orders', 'plan'],
  [(p) => under(p, '/api/v1/contacts'), 'customers'],
  [(p) => any(p, ['/api/v1/rfq', '/api/v1/quotes']), 'quotes'],
  [(p) => under(p, '/api/v1/orders'), 'orders'],
  [(p) => p === '/api/demand-shaping/config', 'sales', 'configure'],
  [(p) => any(p, ['/api/demand-shaping', '/api/v1/pipeline', '/api/v1/ingest']), 'sales'],
  [(p) => under(p, '/api/v1/events'), 'events'],
  [(p) => under(p, '/api/material-tracking'), 'materialTracking'],
  [(p) => under(p, '/api/v1/operations'), 'shopFloor'],
  [(p) => under(p, '/api/qc'), 'quality'],
  [(p) => under(p, '/api/ops-cockpit'), 'opsCockpit'],

  [(p, m) => under(p, '/api/admin/locations') && (m === 'DELETE' || /\/(deactivate|reactivate)$/.test(p)), 'locations', 'remove'],
  [(p, m) => under(p, '/api/admin/locations') && m === 'POST', 'locations', 'add'],
  [(p) => under(p, '/api/admin/locations'), 'locations', 'edit'],
  [(p) => any(p, ['/api/admin/catalog', '/api/admin/online-settings']), 'ecommerceAdmin'],
  [(p) => any(p, ['/api/admin/integrations', '/api/v1/admin/partners']), 'adminIntegrations'],
  [(p) => any(p, ['/api/admin', '/api/v1/admin']), 'admin'],
  [(p) => under(p, '/api/users/roles'), 'roles', 'edit'],
  [(p) => /^\/api\/users\/[^/]+\/reset-password$/.test(p), 'adminUsers', 'resetPassword'],
  [(p) => under(p, '/api/users'), 'adminUsers'],
  [(p) => any(p, ['/api/executive', '/api/metrics/compression']), 'executive'],
  [() => true, 'general'],
];

// Reading requests the server limits. Every other read is open to any signed-in staff login.
const READS = [
  [(p) => under(p, '/api/invoices'), 'billing:view'],
  [(p) => any(p, ['/api/executive', '/api/metrics/compression']), 'executive:view'],
  [(p) => LEDGER_COMPANY_READS.test(p), 'finance:company'],
  [(p) => under(p, '/api/ledger'), 'finance:view'],
  [(p) => under(p, '/api/admin/integrations'), 'adminIntegrations:report'],
  [(p) => under(p, '/api/v1/admin/partners'), 'adminIntegrations:view'],
  [(p) => under(p, '/api/admin/retention'), 'admin:retention'],
  [(p) => under(p, '/api/admin/seed-demo'), 'admin:view'],
  [(p) => /^\/api\/users\/roles\/[^/]+\/history$/.test(p), 'roles:edit'],
];

/**
 * The permission a staff request needs, or null when any signed-in staff login may send it.
 * path: the request path with no query string and no trailing slash.
 */
export function permissionFor(rawPath, method = 'GET') {
  const path = ruledPath(rawPath);
  if (READ_METHODS.has(method)) return (READS.find(([test]) => test(path)) || [])[1] || null;
  const [, areaId, action] = CHANGES.find(([test]) => test(path, method));
  return areaId ? `${areaId}:${action || BY_METHOD[method] || 'edit'}` : null;
}
