/**
 * The built-in roles, made from today's access rules.
 *
 * For every role and every permission in lib/permissionCatalog.js this asks today's rules "may this
 * role do that?" and writes the answer down as the role's starting grid. Nothing is typed by hand:
 *
 *   pages      src/frontend/src/config/roleAccess.js (what each role's menu opens)
 *   requests   the access gate (lib/roleAccess.js, middleware/apiGate.js) and the role checks inside
 *              routes/users.js, routes/admin.js, routes/ledger.js, routes/integrations.js and
 *              routes/partner/adminRoutes.js, asked for every route the server has
 *              (qa/enterprise-excellence/.discovery.json, written by qa/tools/discover.mjs)
 *   branches   lib/branchScope.js
 *
 *   node scripts/permission-defaults.js          prints the SQL that fills the Role table
 *   node scripts/permission-defaults.js --json   prints the roles as JSON
 *
 * test/permissionMatrix.test.js fails when the newest database update that fills the roles no
 * longer matches what this prints, so a change to today's rules cannot be forgotten in the roles.
 *
 * Not for the running server: it reads the frontend's menu rules and the QA route list.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { apiRoleDenial, COST_VIEWERS, EXTERNAL_ROLES, MONEY_MANAGERS, STAFF_GROUPS, staffGroupOf } from '../src/lib/roleAccess.js';
import { ADDED_IN } from '../src/lib/permissionCatalog.js';

// The role-name lists four routes kept to themselves until phase 5 (stock corrections, quality hold
// release, operators' pay, drop tag overrides). They live here now: the built-in default of each role.
const LEGACY = {
  stockAdjusters: new Set([...STAFF_GROUPS.admin, ...STAFF_GROUPS.leadership, 'INVENTORY_MANAGER']),
  holdReleasers: new Set(['QC_MANAGER', 'QC_INSPECTOR', 'PRODUCTION_MANAGER', 'SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN', 'COO', 'OPS_MANAGER']),
  payViewers: new Set([...STAFF_GROUPS.admin, ...STAFF_GROUPS.leadership, 'PRODUCTION_MANAGER']),
  tagManagers: new Set([...STAFF_GROUPS.admin, ...STAFF_GROUPS.leadership, 'PRODUCTION_MANAGER', 'INVENTORY_MANAGER', 'QC_MANAGER']),
};
import { ALL_BRANCH_ROLES } from '../src/lib/branchScope.js';
import { SYSTEM_ADMIN_ROLES, TOP_ROLES } from '../src/lib/viewScope.js';
import { adminAreaRoles, isPublicApi, topOnlyChange } from '../src/middleware/apiGate.js';
import { AREAS, OPEN_PAGES_PERMISSION, PERMISSIONS, permissionFor } from '../src/lib/permissionCatalog.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const fe = await import(pathToFileURL(path.join(root, 'src/frontend/src/config/roleAccess.js')));

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const under = (p, prefix) => p === prefix || p.startsWith(`${prefix}/`);
const roleAllowed = (role, roles) => SYSTEM_ADMIN_ROLES.has(role) || roles.includes(role);
const names = (text) => [...text.matchAll(/'([A-Z_]+)'/g)].map((m) => m[1]);

/** Every role the database knows (enum UserRole in prisma/schema.prisma). */
export const ROLES = read('src/backend/prisma/schema.prisma').match(/enum UserRole \{([\s\S]*?)\}/)[1]
  .split('\n').map((l) => l.replace(/\/\/.*/, '').trim()).filter(Boolean);

/** Every route that needs a signed-in login, with a sample address. */
export const ENDPOINTS = JSON.parse(read('qa/enterprise-excellence/.discovery.json')).backend.endpoints
  .map((e) => ({ ...e, url: e.full.replace(/:[A-Za-z0-9_]+/g, 'x').replace(/\/+$/, '') }))
  .filter((e) => !isPublicApi(e.method, e.url));

// ── The role checks written inside route files, read from their source ──────────────────────────
const ledgerSrc = read('src/backend/src/routes/ledger.js');
const list = (src, name) => {
  const body = src.match(new RegExp(`const ${name} = \\[(.*?)\\];`))[1];
  return [...body.matchAll(/\.\.\.([A-Z_]+)|'([A-Z_]+)'/g)].flatMap((m) => (m[1] ? list(src, m[1]) : [m[2]]));
};
const LEDGER = {
  finance: list(ledgerSrc, 'FINANCE_ROLES'),
  activator: list(ledgerSrc, 'ACTIVATION_ROLES'),
  reader: list(ledgerSrc, 'LEDGER_READERS'),
  // No named check on the route: the handler asks readScope(), which also lets a branch manager read their own branch.
  scoped: [...list(ledgerSrc, 'LEDGER_READERS'), ...list(ledgerSrc, 'BRANCH_READERS')],
};
const ledgerCheck = Object.fromEntries([...ledgerSrc.matchAll(/^router\.(get|post|put|patch|delete)\('([^']+)',\s*(\w+)/gm)]
  .map(([, method, route, word]) => [`${method.toUpperCase()} ${route}`, LEDGER[word] ? word : 'scoped']));

const integrationsSrc = read('src/backend/src/routes/integrations.js');
const COMPANY_WIDE = list(integrationsSrc, 'COMPANY_WIDE');
const integrationsCheck = Object.fromEntries([...integrationsSrc.matchAll(/^router\.(get|post|put|patch|delete)\('([^']+)',\s*only\(([^)]*)\)/gm)]
  .map(([, method, route, args]) => [`${method.toUpperCase()} ${route}`, args.includes('...COMPANY_WIDE') ? COMPANY_WIDE : names(args)]));

const partnerAdmin = names(read('src/backend/src/routes/partner/adminRoutes.js').match(/^router\.use\(requireRole\(([^)]*)\)\)/m)[1]);

/** Does the role check inside the route let this role through? */
function routeAllows(role, e) {
  for (const g of e.guards || []) {
    const m = g.match(/^requireRole\((.*)\)$/);
    if (m && !roleAllowed(role, names(m[1]))) return false;
  }
  if (e.mount === '/api/ledger') {
    const word = ledgerCheck[`${e.method} ${e.path}`];
    if (!word) throw new Error(`No ledger check read for ${e.key}`);
    return LEDGER[word].includes(role);
  }
  if (e.mount === '/api/admin/integrations') {
    const roles = integrationsCheck[`${e.method} ${e.path}`];
    if (!roles) throw new Error(`No integrations check read for ${e.key}`);
    return roles.includes(role);
  }
  if (e.mount === '/api/v1/admin/partners') return roleAllowed(role, partnerAdmin);
  return true;
}

/** Today's answer: may this role send this request? The gate first, then the route's own check. */
export function todayAllows(role, e, user = { role }) {
  if (apiRoleDenial(user, e.url, e.method)) return false;
  if (!READ_METHODS.has(e.method) && ['/api/admin', '/api/v1/admin'].some((p) => under(e.url, p)) && !roleAllowed(role, adminAreaRoles(e.url))) return false;
  if (topOnlyChange(e.url, e.method) && !TOP_ROLES.has(role)) return false;
  return routeAllows(role, e);
}

/** Today's answer for a menu area: may this role open its pages? */
export const todayOpens = (role, section) => fe.canAccessPath(role, `/${fe.SECTION_PATHS[section][0]}`);

// Rights the server checks inside a handler, not at the door of a route.
const HANDLER_RIGHTS = {
  'inventory:viewCost': (role) => COST_VIEWERS.has(role),
  'admin:preview': (role) => SYSTEM_ADMIN_ROLES.has(role),
  // Catalog version 2 (phase 5): the lists of role names the routes used until then.
  'sales:editProducts': (role) => COST_VIEWERS.has(role),
  'sales:editGrades': (role) => COST_VIEWERS.has(role) || role === 'QC_MANAGER',
  'sales:setListPrice': (role) => MONEY_MANAGERS.has(role),
  'sales:approveOverride': (role) => MONEY_MANAGERS.has(role),
  'customers:setCredit': (role) => MONEY_MANAGERS.has(role),
  'orders:releaseCreditHold': (role) => MONEY_MANAGERS.has(role),
  'inventory:adjust': (role) => LEGACY.stockAdjusters.has(role),
  'jobs:releaseQualityHold': (role) => LEGACY.holdReleasers.has(role),
  'staff:viewPay': (role) => LEGACY.payViewers.has(role),
  'dropTags:override': (role) => LEGACY.tagManagers.has(role),
};

const byPermission = {};
for (const e of ENDPOINTS) {
  const key = permissionFor(e.url, e.method);
  if (key) (byPermission[key] = byPermission[key] || []).push(e);
}
export const ENDPOINTS_BY_PERMISSION = byPermission;

// An address in each area, for the create, edit or delete of an area that has no such route today.
// The gate's rule for the area still decides it, so a route added later is already covered.
const SAMPLE = {
  sales: '/api/sales/x', customers: '/api/customers/x', quotes: '/api/quotes/x', orders: '/api/orders/x', returns: '/api/returns/x',
  billing: '/api/invoices/x', counterSales: '/api/pos/x', inventory: '/api/inventory/x', materialTracking: '/api/material-tracking/x',
  purchasing: '/api/purchase-orders/x', logistics: '/api/shipments/x', opsCockpit: '/api/ops-cockpit/x', jobs: '/api/jobs/x',
  shopFloor: '/api/v1/operations/x', recipes: '/api/processing-recipes/x', workCenters: '/api/work-centers/x', dispatch: '/api/v1/dispatch/x',
  staff: '/api/staff/x', dropTags: '/api/drop-tags/x', tagTemplates: '/api/drop-tags/templates/x', printQueue: '/api/print-queue/x',
  quality: '/api/qc/x', safety: '/api/safety/stop-work/x', events: '/api/v1/events/x', documents: '/api/documents/x',
  maintenance: '/api/maintenance-orders/x', assets: '/api/assets/x', taxRates: '/api/tax-rates/x', general: '/api/grades/x',
};
const METHOD = { create: 'POST', edit: 'PUT', delete: 'DELETE' };
const sampleFor = (key) => {
  const [areaId, action] = key.split(':');
  if (!SAMPLE[areaId] || !METHOD[action]) return null;
  const e = { key: `the gate's rule for ${METHOD[action]} ${SAMPLE[areaId]}`, method: METHOD[action], url: SAMPLE[areaId], guards: [] };
  if (permissionFor(e.url, e.method) !== key) throw new Error(`The sample address for ${key} belongs to ${permissionFor(e.url, e.method)}`);
  return e;
};

/**
 * The one place the built-in roles differ from today's rules, on purpose. Reported to the owner.
 * Five old role names (SALES, QUALITY, LOGISTICS, FINANCE, VIEWER) belong to no department. The gate
 * judges invoice reading by department, so it lets them read invoices through the API, although
 * they have no invoice page and the rule's intent (F-009) is sales, accounting and managers only.
 * Their built-in roles follow the pages: no invoice reading.
 */
export const acceptedDifferences = [];

const pageOf = Object.fromEntries(AREAS.filter((a) => a.page).map((a) => [`${a.id}:view`, a.page]));

/**
 * Where today's rules do not give one answer for a permission (two routes under it disagree, or its
 * pages and its routes disagree), and permissions nothing in the server stands behind. Must be empty.
 */
export const conflicts = [];

function holds(role, key) {
  const votes = [];
  if (pageOf[key]) votes.push(['its pages', todayOpens(role, pageOf[key])]);
  if (key === OPEN_PAGES_PERMISSION) votes.push(['the pages open to all staff', fe.canAccessPath(role, '/safety')]);
  if (HANDLER_RIGHTS[key]) votes.push(['the handler', HANDLER_RIGHTS[key](role)]);
  if (!EXTERNAL_ROLES.has(role)) {
    const routes = byPermission[key] || (sampleFor(key) ? [sampleFor(key)] : []);
    if (key === 'billing:view' && !staffGroupOf(role)) acceptedDifferences.push(`${role}: no invoice reading (today the API lets this old role name read invoices)`);
    else for (const e of routes) votes.push([e.key, todayAllows(role, e)]);
  }
  if (!votes.length) {
    if (!EXTERNAL_ROLES.has(role)) conflicts.push(`${key}: nothing in the server stands behind it`);
    return false;
  }
  const yes = votes.filter(([, v]) => v);
  if (yes.length && yes.length !== votes.length) {
    conflicts.push(`${key} for ${role}: allowed by ${yes.map(([w]) => w).slice(0, 3).join(', ')} but refused by ${votes.filter(([, v]) => !v).map(([w]) => w).slice(0, 3).join(', ')}`);
  }
  return yes.length === votes.length;
}

const label = (role) => role.split('_').map((w) => (['CFO', 'COO', 'CIO', 'CSR', 'QC'].includes(w) ? w : w[0] + w.slice(1).toLowerCase())).join(' ');

/** The built-in roles: [{ name, displayName, audience, branchScope, grants }]. */
export const BUILTIN_ROLES = ROLES.map((name) => {
  const external = EXTERNAL_ROLES.has(name);
  const grants = PERMISSIONS.filter((key) => holds(name, key));
  return {
    name,
    displayName: label(name),
    audience: !external ? 'STAFF' : name.startsWith('CUSTOMER') ? 'CUSTOMER' : 'PARTNER',
    branchScope: external || ALL_BRANCH_ROLES.has(name) ? 'ALL' : 'ASSIGNED',
    // The two top roles hold everything there is and everything that is added later.
    grants: TOP_ROLES.has(name) ? ['*'] : grants,
    // What the rules give a top role today, kept to prove that "everything" is what they have.
    ruled: grants,
  };
});

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
export const SEED_BEGIN = '-- BUILT-IN ROLES: BEGIN (written by scripts/permission-defaults.js; do not edit by hand)';
export const SEED_END = '-- BUILT-IN ROLES: END';
/**
 * SQL that creates or resets the built-in roles. Safe to run again.
 * version: the catalog version the database update was written for. Database update 19 was written for
 * version 1; permissions added since reach a saved role through lib/roleStore.js, not through SQL.
 */
export function seedSql(version = 1) {
  const rows = BUILTIN_ROLES.map((r) => `  (gen_random_uuid()::text, ${q(r.name)}, ${q(r.displayName)}, '[]'::jsonb, ${q(JSON.stringify(r.grants.filter((p) => !(ADDED_IN[p] > version))))}::jsonb, ${q(r.audience)}, ${q(r.branchScope)}, ${q(r.name)}, true, true, CURRENT_TIMESTAMP)`);
  return [
    SEED_BEGIN,
    'INSERT INTO "Role" ("id", "name", "displayName", "permissions", "grants", "audience", "branchScope", "baseRole", "isSystem", "isActive", "updatedAt") VALUES',
    `${rows.join(',\n')}`,
    'ON CONFLICT ("name") DO UPDATE SET "grants" = EXCLUDED."grants", "audience" = EXCLUDED."audience", "branchScope" = EXCLUDED."branchScope", "baseRole" = EXCLUDED."baseRole", "isSystem" = true, "updatedAt" = CURRENT_TIMESTAMP;',
    SEED_END,
  ].join('\n');
}

/** src/lib/builtinRoleDefaults.js: what "Reset to default" returns a built-in role to. */
export function defaultsModule() {
  const rows = BUILTIN_ROLES.map((r) => `  ${r.name}: { displayName: ${JSON.stringify(r.displayName)}, audience: '${r.audience}', branchScope: '${r.branchScope}', grants: ${JSON.stringify(r.grants)} },`);
  return [
    '/**',
    ' * The starting grid of each built-in role: what today\'s access rules give it.',
    ' * Written by scripts/permission-defaults.js (node scripts/permission-defaults.js --module). Do not edit by hand;',
    ' * test/roleEditRules.test.js fails when it no longer matches the rules.',
    ' */',
    'export const BUILTIN_DEFAULTS = {',
    ...rows,
    '};',
    '',
  ].join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (conflicts.length) { console.error(conflicts.join('\n')); process.exit(1); }
  console.log(process.argv.includes('--json') ? JSON.stringify(BUILTIN_ROLES.map(({ ruled, ...r }) => r), null, 1) : process.argv.includes('--module') ? defaultsModule() : seedSql());
}
