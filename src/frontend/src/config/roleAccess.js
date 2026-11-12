/**
 * Which parts of the app each role can open. The sidebar hides sections a
 * role can't use, and the layout shows a "no access" page for their URLs.
 * The backend applies the same rules to the sensitive APIs (see
 * src/backend/src/lib/roleAccess.js), so keep the two in step.
 *
 * To change what a role sees, edit ROLE_GROUPS / GROUP_SECTIONS below.
 */

// App areas, by the first part of the page URL (two parts where noted).
export const SECTION_PATHS = {
  sales: ['customers', 'sales', 'commercial', 'pricing', 'mobile-rep'],
  orders: ['orders', 'order-board', 'orderhub', 'pos', 'portal'],
  production: ['planning', 'schedule', 'shopfloor', 'shop-floor', 'time-tracking', 'production', 'jobs', 'work-orders', 'optimization', 'boms', 'bom'],
  inventory: ['inventory', 'heats', 'units', 'provenance'],
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
  admin: ['admin'],
}


const ROLE_GROUPS = {
  admin: ['SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN', 'BRANCH_MANAGER', 'OPS_MANAGER'],
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

const ALL_SECTIONS = Object.keys(SECTION_PATHS)

const GROUP_SECTIONS = {
  admin: ['*'],
  leadership: [...ALL_SECTIONS.filter((s) => s !== 'admin')],
  sales: ['sales', 'orders', 'inventory', 'logistics', 'customerQuality', 'ecommerce'],
  production: ['production', 'orders', 'inventory', 'materialTracking', 'quality', 'maintenance'],
  warehouse: ['inventory', 'materialTracking', 'logistics', 'supplierQuality', 'orders'],
  quality: ['quality', 'supplierQuality', 'customerQuality', 'materialTracking', 'inventory', 'orders', 'production'],
  maintenance: ['maintenance', 'production', 'inventory', 'contractors'],
  analyst: ['executive', 'sales', 'orders', 'inventory', 'production', 'quality', 'logistics'],
  integration: ['admin'],
  customer: ['ecommerce'],
  partner: [],
}

// A few roles get one extra area on top of their group.
const ROLE_EXTRAS = {
  SALES_DIRECTOR: ['executive'],
  PRODUCTION_MANAGER: ['logistics', 'contractors'],
  INVENTORY_MANAGER: ['ecommerceAdmin'],
}

const EXTERNAL_GROUPS = new Set(['customer', 'partner'])

function groupOf(role) {
  return Object.keys(ROLE_GROUPS).find((g) => ROLE_GROUPS[g].includes(role)) || null
}

/** Sections a role can open; ['*'] means everything. Unknown roles get the staff basics. */
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

export function canAccessPath(role, pathname) {
  const allowed = sectionsFor(role)
  if (allowed.includes('*')) return true
  const section = sectionForPath(pathname)
  if (section) return allowed.includes(section)
  // Pages outside any section (dashboards, safety, training, help) are open to
  // staff. Customers and partners only get help.
  if (!isExternalRole(role)) return true
  return String(pathname || '').replace(/^\/+/, '').split('/')[0] === 'help'
}

/** Where to send a user who lands somewhere they can't open. */
export function homeFor(role) {
  const group = groupOf(role)
  if (group === 'customer') return '/shop'
  if (group === 'partner') return '/help/manual'
  return '/'
}
