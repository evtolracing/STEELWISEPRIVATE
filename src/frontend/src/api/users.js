import client from './client';

// ==================== USERS API ====================

// List users with optional filters
export const getUsers = (params = {}) => 
  client.get('/users', { params }).then(r => r.data);

// Get single user
export const getUser = (id) => 
  client.get(`/users/${id}`).then(r => r.data);

// Create new user
export const createUser = (data) => 
  client.post('/users', data).then(r => r.data);

// Update user
export const updateUser = (id, data) => 
  client.put(`/users/${id}`, data).then(r => r.data);

// Delete (deactivate) user
export const deleteUser = (id) => 
  client.delete(`/users/${id}`).then(r => r.data);

// Reset user password
export const resetUserPassword = (id, newPassword) => 
  client.post(`/users/${id}/reset-password`, { newPassword }).then(r => r.data);

// ==================== ROLES API ====================

// List all roles
export const getRoles = () => 
  client.get('/users/roles/list').then(r => r.data);

// Get single role with users
export const getRole = (id) => 
  client.get(`/users/roles/${id}`).then(r => r.data);

// Create new role
export const createRole = (data) => 
  client.post('/users/roles', data).then(r => r.data);

// Update role
export const updateRole = (id, data) => 
  client.put(`/users/roles/${id}`, data).then(r => r.data);

// ==================== ENUMS & OPTIONS ====================

// Get available role enum values
export const getRoleEnums = () => 
  client.get('/users/enums/roles').then(r => r.data);

// Get locations for user assignment
export const getUserLocations = () => 
  client.get('/users/locations').then(r => r.data);

// Get divisions for user assignment
export const getUserDivisions = () => 
  client.get('/users/divisions').then(r => r.data);

// ==================== PERMISSION HELPERS ====================

// Permission check helper
export const checkPermission = (userPermissions, required) => {
  if (!userPermissions || !required) return false;
  
  // Super admin check
  if (userPermissions.includes('*')) return true;
  
  // Exact match
  if (userPermissions.includes(required)) return true;
  
  // Wildcard matching (e.g., "quote.*" matches "quote.create")
  const [module, resource, action] = required.split('.');
  if (userPermissions.includes(`${module}.*`)) return true;
  if (userPermissions.includes(`${module}.${resource}.*`)) return true;
  
  return false;
};

// Role category helper
export const getRoleCategory = (role) => {
  const categoryMap = {
    SUPER_ADMIN: 'System',
    TENANT_OWNER: 'System',
    EXECUTIVE: 'Executive',
    CFO: 'Executive',
    COO: 'Executive',
    CIO: 'Executive',
    DIVISION_DIRECTOR: 'Management',
    BRANCH_MANAGER: 'Management',
    SALES_DIRECTOR: 'Sales',
    SALES_REP: 'Sales',
    CSR: 'Sales',
    ESTIMATOR: 'Sales',
    CREDIT_MANAGER: 'Sales',
    OPS_MANAGER: 'Operations',
    PRODUCTION_MANAGER: 'Operations',
    SCHEDULER: 'Operations',
    INVENTORY_MANAGER: 'Operations',
    BUYER: 'Operations',
    WORKCENTER_LEAD: 'Operations',
    OPERATOR_SAW: 'Shop Floor',
    OPERATOR_ROUTER: 'Shop Floor',
    OPERATOR_SHEAR: 'Shop Floor',
    OPERATOR_PLASMA: 'Shop Floor',
    OPERATOR_GENERAL: 'Shop Floor',
    MATERIAL_HANDLER: 'Shop Floor',
    RECEIVING_CLERK: 'Shop Floor',
    SHIPPING_COORDINATOR: 'Shop Floor',
    PACKAGING_LEAD: 'Shop Floor',
    QC_MANAGER: 'Quality',
    QC_INSPECTOR: 'Quality',
    MAINTENANCE_MANAGER: 'Support',
    INTEGRATION_ADMIN: 'IT',
    DATA_ANALYST: 'IT',
    SUPPORT_AGENT: 'Support',
    AUDITOR: 'Support',
    CUSTOMER_ADMIN: 'External',
    CUSTOMER_BUYER: 'External',
    CUSTOMER_VIEWER: 'External',
    SUPPLIER_USER: 'External',
    CARRIER_USER: 'External',
    ADMIN: 'Legacy',
    VIEWER: 'Legacy',
  };
  return categoryMap[role] || 'Other';
};

// Role display name helper
export const getRoleDisplayName = (role) => {
  const displayNames = {
    SUPER_ADMIN: 'Super Admin',
    TENANT_OWNER: 'Tenant Owner',
    EXECUTIVE: 'Executive',
    CFO: 'CFO',
    COO: 'COO',
    CIO: 'CIO',
    DIVISION_DIRECTOR: 'Division Director',
    BRANCH_MANAGER: 'Branch Manager',
    SALES_DIRECTOR: 'Sales Director',
    SALES_REP: 'Sales Representative',
    CSR: 'Customer Service Rep',
    ESTIMATOR: 'Estimator',
    CREDIT_MANAGER: 'Credit Manager',
    OPS_MANAGER: 'Operations Manager',
    PRODUCTION_MANAGER: 'Production Manager',
    SCHEDULER: 'Scheduler',
    INVENTORY_MANAGER: 'Inventory Manager',
    BUYER: 'Buyer',
    WORKCENTER_LEAD: 'Work Center Lead',
    OPERATOR_SAW: 'Saw Operator',
    OPERATOR_ROUTER: 'Router Operator',
    OPERATOR_SHEAR: 'Shear Operator',
    OPERATOR_PLASMA: 'Plasma Operator',
    OPERATOR_GENERAL: 'General Operator',
    MATERIAL_HANDLER: 'Material Handler',
    RECEIVING_CLERK: 'Receiving Clerk',
    SHIPPING_COORDINATOR: 'Shipping Coordinator',
    PACKAGING_LEAD: 'Packaging Lead',
    QC_MANAGER: 'QC Manager',
    QC_INSPECTOR: 'QC Inspector',
    MAINTENANCE_MANAGER: 'Maintenance Manager',
    INTEGRATION_ADMIN: 'Integration Admin',
    DATA_ANALYST: 'Data Analyst',
    SUPPORT_AGENT: 'Support Agent',
    AUDITOR: 'Auditor',
    CUSTOMER_ADMIN: 'Customer Admin',
    CUSTOMER_BUYER: 'Customer Buyer',
    CUSTOMER_VIEWER: 'Customer Viewer',
    SUPPLIER_USER: 'Supplier User',
    CARRIER_USER: 'Carrier User',
    ADMIN: 'Admin',
    VIEWER: 'Viewer',
    MILL_OPERATOR: 'Mill Operator',
    SERVICE_CENTER: 'Service Center',
    SALES: 'Sales',
    QUALITY: 'Quality',
    LOGISTICS: 'Logistics',
    FINANCE: 'Finance',
  };
  return displayNames[role] || role;
};
