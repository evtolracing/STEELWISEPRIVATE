/**
 * Which parts of the app a login can open. The sidebar hides areas it
 * can't use, and the layout shows a "no access" page for their URLs.
 *
 * Since the role matrix switchover the server sends each login its permissions and these pages go
 * by them (setCurrentAccess below). To change what a role sees, use Administration, Roles and
 * permissions. The tables here are the built-in default of each role: the server's built-in roles
 * are made from them (src/backend/scripts/permission-defaults.js) and a test holds the two together.
 */

// App areas, by the first part of the page URL (two parts where noted).
// Every page on the menu belongs to an area or is listed in OPEN_TO_STAFF below; a check
// (src/backend/test/frontendRoleAccess.test.js) fails when a new page is in neither.
export const SECTION_PATHS = {
  sales: ['customers', 'sales', 'commercial', 'pricing', 'mobile-rep'],
  orders: ['orders', 'order-board', 'orderhub', 'pos', 'portal'],
  // Invoices, payments and credit holds: what customers owe. The server lets only sales, managers,
  // leadership and the view-only roles read them (INVOICE_READERS in src/backend/src/lib/roleAccess.js).
  billing: ['orders/invoices', 'orders/credit-holds'],
  production: ['planning', 'schedule', 'shopfloor', 'shop-floor', 'time-tracking', 'production', 'jobs', 'work-orders', 'optimization', 'boms', 'bom'],
  inventory: ['inventory', 'heats', 'units', 'provenance', 'transfers'],
  purchasing: ['purchase-orders'],
  opsCockpit: ['ops-cockpit'],
  quality: ['qc', 'qaqc', 'production-quality'],
  materialTracking: ['material-tracking'],
  logistics: ['receiving', 'shipping', 'freight', 'logistics'],
  supplierQuality: ['sqm'],
  customerQuality: ['customer-quality'],
  ecommerce: ['shop', 'account'],
  ecommerceAdmin: ['admin/catalog', 'admin/online-settings'],
  maintenance: ['maintenance'],
  contractors: ['contractors'],
  executive: ['executive'],
  // The admin pages, one area each, so a manager can be given one without the rest.
  adminUsers: ['admin/users'],
  adminStaff: ['admin/staff'],
  adminRecipes: ['admin/processing-recipes'],
  adminIntegrations: ['admin/partners', 'admin/integrations'],
  // Everything else under /admin: audit log, tax rates.
  admin: ['admin'],
  finance: ['finance'],
}

// Pages every staff login may open: the dashboards (which show the person's own role and branch),
// safety, training and help.
export const OPEN_TO_STAFF = ['', 'role-dashboard', 'safety', 'training', 'help']

// Must match STAFF_GROUPS in src/backend/src/lib/roleAccess.js, except that the auditor sits with
// quality here (for the quality screens) and the system administrators are split from the managers.
const ROLE_GROUPS = {
  // The system administrators: everything, every branch.
  system: ['SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN'],
  // Managers run branches (BRANCH_MANAGER: their own; OPS_MANAGER: every branch). They see every
  // working area but not the system's settings, partner API keys or audit log.
  management: ['BRANCH_MANAGER', 'OPS_MANAGER'],
  leadership: ['EXECUTIVE', 'CFO', 'COO', 'CIO', 'DIVISION_DIRECTOR', 'SERVICE_CENTER'],
  sales: ['SALES_DIRECTOR', 'SALES_REP', 'CSR', 'ESTIMATOR', 'CREDIT_MANAGER', 'SUPPORT_AGENT'],
  production: ['PRODUCTION_MANAGER', 'SCHEDULER', 'WORKCENTER_LEAD', 'OPERATOR_SAW', 'OPERATOR_ROUTER', 'OPERATOR_SHEAR', 'OPERATOR_PLASMA', 'OPERATOR_GENERAL', 'MILL_OPERATOR', 'PACKAGING_LEAD', 'MATERIAL_HANDLER'],
  warehouse: ['INVENTORY_MANAGER', 'BUYER', 'RECEIVING_CLERK', 'SHIPPING_COORDINATOR'],
  quality: ['QC_MANAGER', 'QC_INSPECTOR', 'AUDITOR'],
  maintenance: ['MAINTENANCE_MANAGER'],
  analyst: ['DATA_ANALYST'],
  integration: ['INTEGRATION_ADMIN'],
  customer: ['CUSTOMER_ADMIN', 'CUSTOMER_BUYER', 'CUSTOMER_VIEWER'],
  partner: ['SUPPLIER_USER', 'CARRIER_USER'],
}

export const SYSTEM_ADMIN_ROLES = ROLE_GROUPS.system

const ADMIN_AREAS = ['admin', 'adminUsers', 'adminStaff', 'adminRecipes', 'adminIntegrations', 'ecommerceAdmin']
const WORKING_AREAS = Object.keys(SECTION_PATHS).filter((s) => !ADMIN_AREAS.includes(s))

const GROUP_SECTIONS = {
  system: ['*'],
  management: [...WORKING_AREAS, 'adminStaff', 'adminRecipes'],
  leadership: [...WORKING_AREAS, 'ecommerceAdmin'],
  sales: ['sales', 'orders', 'billing', 'inventory', 'logistics', 'customerQuality', 'ecommerce'],
  production: ['production', 'orders', 'inventory', 'materialTracking', 'quality', 'maintenance'],
  warehouse: ['inventory', 'purchasing', 'materialTracking', 'logistics', 'supplierQuality', 'orders'],
  quality: ['quality', 'supplierQuality', 'customerQuality', 'materialTracking', 'inventory', 'orders', 'production'],
  maintenance: ['maintenance', 'production', 'inventory', 'contractors'],
  analyst: ['executive', 'sales', 'orders', 'billing', 'inventory', 'purchasing', 'opsCockpit', 'production', 'quality', 'logistics'],
  // The integration admin runs the partner API and the integrations (owner, 2026-11-20). The server
  // agrees: routes/integrations.js, routes/partner/adminRoutes.js and ADMIN_AREA_ROLES in middleware/apiGate.js.
  integration: ['adminIntegrations'],
  customer: ['ecommerce'],
  partner: [],
}

// Areas opened by role alone, whatever the group: the financial ledger is for the finance roles, the
// executive role and the auditor, and for a branch manager (own branch reports). The server decides
// the same way in src/backend/src/routes/ledger.js.
const ROLE_ONLY_SECTIONS = {
  finance: ['SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN', 'CFO', 'EXECUTIVE', 'AUDITOR', 'BRANCH_MANAGER'],
}

// A few roles get extra areas on top of their group.
const ROLE_EXTRAS = {
  SALES_DIRECTOR: ['executive'],
  PRODUCTION_MANAGER: ['logistics', 'contractors', 'opsCockpit'],
  SCHEDULER: ['opsCockpit'],
  // The inventory manager runs the web shop catalog and online settings, and may save them (owner, 2026-11-20).
  INVENTORY_MANAGER: ['ecommerceAdmin', 'opsCockpit'],
  // A branch manager adds and changes the staff logins of their own branch (lib/userAdminRules.js).
  BRANCH_MANAGER: ['adminUsers'],
  AUDITOR: ['billing'],
}

const EXTERNAL_GROUPS = new Set(['customer', 'partner'])
export const ALL_ROLES = Object.values(ROLE_GROUPS).flat()

function groupOf(role) {
  return Object.keys(ROLE_GROUPS).find((g) => ROLE_GROUPS[g].includes(role)) || null
}

/** Sections a role can open; ['*'] means everything. Unknown roles get only the pages open to all staff. */
export function sectionsFor(role) {
  const group = groupOf(role)
  if (!group) return []
  return [...GROUP_SECTIONS[group], ...(ROLE_EXTRAS[role] || [])]
}

export const isExternalRole = (role) => EXTERNAL_GROUPS.has(groupOf(role))

/** The section a page URL belongs to, or null for pages every signed-in user can open. */
export function sectionForPath(pathname) {
  const parts = String(pathname || '').replace(/^\/+/, '').split('/')
  const two = parts.slice(0, 2).join('/')
  for (const [section, paths] of Object.entries(SECTION_PATHS)) {
    if (paths.includes(two)) return section
  }
  for (const [section, paths] of Object.entries(SECTION_PATHS)) {
    if (paths.includes(parts[0])) return section
  }
  return null
}

// What the signed-in login may open, as the server sent it with /auth/me (role matrix, phase 3): its
// permissions and the permission that opens each menu area. hooks/useAuth.jsx keeps this current.
// While it is set, the login's own role is judged by it; the tables above are the built-in default
// and decide only for a login the server has not described yet.
let current = null
export function setCurrentAccess(user) {
  current = user && Array.isArray(user.permissions) && user.pagePermissions
    ? { role: user.role, audience: user.audience || 'STAFF', permissions: new Set(user.permissions), pages: user.pagePermissions, open: user.openPagesPermission || 'general:view' }
    : null
}

export function canAccessPath(role, pathname) {
  if (!role) return false
  if (current && current.role === role) {
    const area = sectionForPath(pathname)
    if (area) return current.permissions.has(current.pages[area])
    if (current.audience === 'STAFF') return current.permissions.has(current.open)
    return String(pathname || '').replace(/^\/+/, '').split('/')[0] === 'help'
  }
  const allowed = sectionsFor(role)
  const section = sectionForPath(pathname)
  if (section && ROLE_ONLY_SECTIONS[section]) return ROLE_ONLY_SECTIONS[section].includes(role)
  if (allowed.includes('*')) return true
  if (section) return allowed.includes(section)
  // Pages outside any section (dashboards, safety, training, help) are open to
  // staff. Customers and partners only get help.
  if (!isExternalRole(role)) return true
  return String(pathname || '').replace(/^\/+/, '').split('/')[0] === 'help'
}

/** Role names as people say them: SALES_REP -> "Sales rep". */
export function roleLabel(role) {
  const s = String(role || '').replace(/_/g, ' ').toLowerCase()
  return s ? s[0].toUpperCase() + s.slice(1) : ''
}

/** Where to send a user who lands somewhere they can't open. */
export function homeFor(role) {
  const group = groupOf(role)
  if (group === 'customer') return '/shop'
  if (group === 'partner') return '/help/manual'
  return '/'
}

// Where a person starts work after signing in. Each is a screen of real records that the role can
// open; a role with no entry starts at the dashboard. The dashboard stays on the menu for everyone.
const ROLE_START = {
  SALES_DIRECTOR: '/orders', SALES_REP: '/orders', CSR: '/orders', ESTIMATOR: '/orders', CREDIT_MANAGER: '/orders', SUPPORT_AGENT: '/orders',
  PRODUCTION_MANAGER: '/schedule', SCHEDULER: '/schedule',
  WORKCENTER_LEAD: '/shopfloor', OPERATOR_SAW: '/shopfloor', OPERATOR_ROUTER: '/shopfloor', OPERATOR_SHEAR: '/shopfloor', OPERATOR_PLASMA: '/shopfloor', OPERATOR_GENERAL: '/shopfloor', MILL_OPERATOR: '/shopfloor', PACKAGING_LEAD: '/shopfloor', MATERIAL_HANDLER: '/shopfloor',
  INVENTORY_MANAGER: '/units', BUYER: '/units', RECEIVING_CLERK: '/receiving', SHIPPING_COORDINATOR: '/shipping',
  QC_MANAGER: '/qc', QC_INSPECTOR: '/qc',
}

/** The first screen after sign-in for a role. Never a screen the role cannot open. */
export function workspaceFor(role) {
  const start = ROLE_START[role]
  return start && canAccessPath(role, start) ? start : homeFor(role)
}
