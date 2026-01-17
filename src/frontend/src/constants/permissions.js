// User Roles and Permissions Configuration

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  SALES_CSR: 'SALES_CSR',
  SCHEDULER: 'SCHEDULER',
  OPERATOR: 'OPERATOR',
  QC_INSPECTOR: 'QC_INSPECTOR',
  SHIPPING_CLERK: 'SHIPPING_CLERK',
  RECEIVING_CLERK: 'RECEIVING_CLERK',
  BILLING: 'BILLING',
  CUSTOMER_VIEWER: 'CUSTOMER_VIEWER',
}

export const USER_ROLE_CONFIG = {
  [USER_ROLES.ADMIN]: {
    label: 'Administrator',
    description: 'Full system access',
    color: '#D32F2F',
  },
  [USER_ROLES.SALES_CSR]: {
    label: 'Sales / CSR',
    description: 'Order intake and customer service',
    color: '#1976D2',
  },
  [USER_ROLES.SCHEDULER]: {
    label: 'Scheduler / Planner',
    description: 'Production scheduling and planning',
    color: '#7B1FA2',
  },
  [USER_ROLES.OPERATOR]: {
    label: 'Shop Floor Operator',
    description: 'Machine operation and job execution',
    color: '#388E3C',
  },
  [USER_ROLES.QC_INSPECTOR]: {
    label: 'QC Inspector',
    description: 'Quality control and inspection',
    color: '#F57C00',
  },
  [USER_ROLES.SHIPPING_CLERK]: {
    label: 'Shipping Clerk',
    description: 'Shipping and dispatch',
    color: '#0097A7',
  },
  [USER_ROLES.RECEIVING_CLERK]: {
    label: 'Receiving Clerk',
    description: 'Inbound material receiving',
    color: '#5D4037',
  },
  [USER_ROLES.BILLING]: {
    label: 'Billing',
    description: 'Invoicing and billing',
    color: '#455A64',
  },
  [USER_ROLES.CUSTOMER_VIEWER]: {
    label: 'Customer Portal',
    description: 'View-only customer access',
    color: '#78909C',
  },
}

// Platform Modules
export const MODULES = {
  DASHBOARD: 'DASHBOARD',
  ORDER_INTAKE: 'ORDER_INTAKE',
  ORDER_BOARD: 'ORDER_BOARD',
  RECEIVING: 'RECEIVING',
  PROCESSING: 'PROCESSING',
  SCHEDULING: 'SCHEDULING',
  SHOP_FLOOR: 'SHOP_FLOOR',
  QC: 'QC',
  PACKAGING: 'PACKAGING',
  SHIPPING: 'SHIPPING',
  BILLING: 'BILLING',
  INVENTORY: 'INVENTORY',
  REPORTS: 'REPORTS',
  CUSTOMER_PORTAL: 'CUSTOMER_PORTAL',
  SETTINGS: 'SETTINGS',
}

export const MODULE_CONFIG = {
  [MODULES.DASHBOARD]: { label: 'Dashboard', icon: 'Dashboard', path: '/' },
  [MODULES.ORDER_INTAKE]: { label: 'Order Intake', icon: 'AddShoppingCart', path: '/orders/new' },
  [MODULES.ORDER_BOARD]: { label: 'Order Board', icon: 'ViewKanban', path: '/order-board' },
  [MODULES.RECEIVING]: { label: 'Receiving', icon: 'MoveToInbox', path: '/receiving' },
  [MODULES.PROCESSING]: { label: 'Processing', icon: 'PrecisionManufacturing', path: '/work-orders' },
  [MODULES.SCHEDULING]: { label: 'Scheduling', icon: 'CalendarMonth', path: '/schedule' },
  [MODULES.SHOP_FLOOR]: { label: 'Shop Floor', icon: 'Factory', path: '/shop-floor' },
  [MODULES.QC]: { label: 'Quality Control', icon: 'FactCheck', path: '/qaqc' },
  [MODULES.PACKAGING]: { label: 'Packaging', icon: 'Inventory2', path: '/packaging' },
  [MODULES.SHIPPING]: { label: 'Shipping', icon: 'LocalShipping', path: '/logistics/shipments' },
  [MODULES.BILLING]: { label: 'Billing', icon: 'Receipt', path: '/billing' },
  [MODULES.INVENTORY]: { label: 'Inventory', icon: 'Inventory', path: '/units' },
  [MODULES.REPORTS]: { label: 'Reports', icon: 'Assessment', path: '/reports' },
  [MODULES.CUSTOMER_PORTAL]: { label: 'Customer Portal', icon: 'People', path: '/portal' },
  [MODULES.SETTINGS]: { label: 'Settings', icon: 'Settings', path: '/settings' },
}

// Organization Types (for multi-tenant segmentation)
export const ORG_TYPES = {
  SERVICE_CENTER: 'SERVICE_CENTER',
  DISTRIBUTOR: 'DISTRIBUTOR',
  FABRICATOR: 'FABRICATOR',
  OEM: 'OEM',
  CARRIER: 'CARRIER',
  MILL: 'MILL',
}

export const ORG_TYPE_CONFIG = {
  [ORG_TYPES.SERVICE_CENTER]: {
    label: 'Service Center / Processor',
    modules: [
      MODULES.DASHBOARD, MODULES.ORDER_INTAKE, MODULES.ORDER_BOARD,
      MODULES.RECEIVING, MODULES.PROCESSING, MODULES.SCHEDULING,
      MODULES.SHOP_FLOOR, MODULES.QC, MODULES.PACKAGING,
      MODULES.SHIPPING, MODULES.BILLING, MODULES.INVENTORY,
      MODULES.REPORTS, MODULES.SETTINGS,
    ],
  },
  [ORG_TYPES.DISTRIBUTOR]: {
    label: 'Distributor / Warehouse',
    modules: [
      MODULES.DASHBOARD, MODULES.ORDER_INTAKE, MODULES.ORDER_BOARD,
      MODULES.RECEIVING, MODULES.SHIPPING, MODULES.BILLING,
      MODULES.INVENTORY, MODULES.REPORTS, MODULES.SETTINGS,
    ],
  },
  [ORG_TYPES.FABRICATOR]: {
    label: 'Fabricator',
    modules: [
      MODULES.DASHBOARD, MODULES.PROCESSING, MODULES.SCHEDULING,
      MODULES.SHOP_FLOOR, MODULES.SHIPPING, MODULES.INVENTORY,
      MODULES.REPORTS, MODULES.SETTINGS,
    ],
  },
  [ORG_TYPES.OEM]: {
    label: 'OEM / End Customer',
    modules: [
      MODULES.DASHBOARD, MODULES.ORDER_INTAKE, MODULES.CUSTOMER_PORTAL,
    ],
  },
  [ORG_TYPES.CARRIER]: {
    label: 'Carrier / Logistics',
    modules: [
      MODULES.DASHBOARD, MODULES.SHIPPING,
    ],
  },
  [ORG_TYPES.MILL]: {
    label: 'Mill (Phase 2)',
    modules: [],
  },
}

// Role-based module access
export const ROLE_MODULE_ACCESS = {
  [USER_ROLES.ADMIN]: Object.values(MODULES),
  [USER_ROLES.SALES_CSR]: [
    MODULES.DASHBOARD, MODULES.ORDER_INTAKE, MODULES.ORDER_BOARD,
    MODULES.CUSTOMER_PORTAL, MODULES.REPORTS,
  ],
  [USER_ROLES.SCHEDULER]: [
    MODULES.DASHBOARD, MODULES.ORDER_BOARD, MODULES.SCHEDULING,
    MODULES.PROCESSING, MODULES.SHOP_FLOOR, MODULES.REPORTS,
  ],
  [USER_ROLES.OPERATOR]: [
    MODULES.SHOP_FLOOR,
  ],
  [USER_ROLES.QC_INSPECTOR]: [
    MODULES.DASHBOARD, MODULES.QC, MODULES.SHOP_FLOOR,
  ],
  [USER_ROLES.SHIPPING_CLERK]: [
    MODULES.DASHBOARD, MODULES.SHIPPING, MODULES.PACKAGING,
  ],
  [USER_ROLES.RECEIVING_CLERK]: [
    MODULES.DASHBOARD, MODULES.RECEIVING, MODULES.INVENTORY,
  ],
  [USER_ROLES.BILLING]: [
    MODULES.DASHBOARD, MODULES.BILLING, MODULES.REPORTS,
  ],
  [USER_ROLES.CUSTOMER_VIEWER]: [
    MODULES.CUSTOMER_PORTAL,
  ],
}

// Permission actions
export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  ASSIGN: 'assign',
  CONFIGURE: 'configure',
}

// Role permissions matrix
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: {
    actions: Object.values(ACTIONS),
  },
  [USER_ROLES.SALES_CSR]: {
    actions: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE],
  },
  [USER_ROLES.SCHEDULER]: {
    actions: [ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.ASSIGN],
  },
  [USER_ROLES.OPERATOR]: {
    actions: [ACTIONS.READ, ACTIONS.UPDATE],
  },
  [USER_ROLES.QC_INSPECTOR]: {
    actions: [ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.APPROVE],
  },
  [USER_ROLES.SHIPPING_CLERK]: {
    actions: [ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.CREATE],
  },
  [USER_ROLES.RECEIVING_CLERK]: {
    actions: [ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.CREATE],
  },
  [USER_ROLES.BILLING]: {
    actions: [ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.CREATE, ACTIONS.APPROVE],
  },
  [USER_ROLES.CUSTOMER_VIEWER]: {
    actions: [ACTIONS.READ],
  },
}

// Helper functions
export function hasModuleAccess(role, module) {
  return ROLE_MODULE_ACCESS[role]?.includes(module) || false
}

export function hasPermission(role, action) {
  return ROLE_PERMISSIONS[role]?.actions?.includes(action) || false
}

export function getAccessibleModules(role, orgType) {
  const roleModules = ROLE_MODULE_ACCESS[role] || []
  const orgModules = ORG_TYPE_CONFIG[orgType]?.modules || []
  return roleModules.filter(m => orgModules.includes(m))
}
