// src/dashboard/config/dashboardConfig.js
/**
 * Role-Based Dashboard Configuration
 * Maps roles to their dashboard layout and widgets
 */

export const DASHBOARD_CONFIG = {
  // ============================================
  // EXECUTIVE ROLES
  // ============================================
  CEO: {
    layout: '3-column',
    title: 'Executive Overview',
    widgets: [
      { widgetType: 'RFQ_FUNNEL', title: 'Sales Pipeline', size: 'medium' },
      { widgetType: 'MARGIN_INSIGHTS', title: 'Margin Performance', size: 'medium' },
      { widgetType: 'FLOW_BOARD', title: 'Enterprise Flow', size: 'large' },
      { widgetType: 'FORECAST', title: 'Capacity Forecast', size: 'medium' },
      { widgetType: 'SLA_RISK', title: 'SLA Risk Overview', size: 'medium' },
      { widgetType: 'BOTTLENECK_STRIP', title: 'Bottlenecks', size: 'small' },
    ],
    showAiPanel: true,
  },

  CFO: {
    layout: '2-column',
    title: 'Financial Dashboard',
    widgets: [
      { widgetType: 'MARGIN_INSIGHTS', title: 'Margin Analysis', size: 'large' },
      { widgetType: 'RFQ_FUNNEL', title: 'Revenue Pipeline', size: 'medium' },
      { widgetType: 'INVENTORY_HEATMAP', title: 'Inventory Value at Risk', size: 'medium' },
      { widgetType: 'SLA_RISK', title: 'SLA Exposure', size: 'medium' },
    ],
    showAiPanel: true,
  },

  VP_OPERATIONS: {
    layout: '3-column',
    title: 'Operations Command Center',
    widgets: [
      { widgetType: 'FLOW_BOARD', title: 'Operations Flow', size: 'large' },
      { widgetType: 'WORKCENTER_UTIL', title: 'Work Center Utilization', size: 'medium' },
      { widgetType: 'BOTTLENECK_STRIP', title: 'Bottlenecks', size: 'small' },
      { widgetType: 'SLA_RISK', title: 'SLA Risk', size: 'medium' },
      { widgetType: 'EXCEPTIONS_FEED', title: 'Exceptions', size: 'medium' },
      { widgetType: 'FORECAST', title: 'Load Forecast', size: 'medium' },
      { widgetType: 'SHIPPING_PANEL', title: 'Shipping Status', size: 'medium' },
      { widgetType: 'BOM_QUALITY', title: 'BOM Health', size: 'small' },
    ],
    showAiPanel: true,
  },

  // ============================================
  // BRANCH / SITE ROLES
  // ============================================
  BRANCH_MANAGER: {
    layout: '2-column',
    title: 'Branch Operations',
    widgets: [
      { widgetType: 'FLOW_BOARD', title: 'Branch Flow', size: 'large' },
      { widgetType: 'BOTTLENECK_STRIP', title: 'Bottlenecks', size: 'small' },
      { widgetType: 'SLA_RISK', title: 'At-Risk Orders', size: 'medium' },
      { widgetType: 'WORKCENTER_UTIL', title: 'Machine Utilization', size: 'medium' },
      { widgetType: 'INVENTORY_HEATMAP', title: 'Inventory Status', size: 'medium' },
      { widgetType: 'SHIPPING_PANEL', title: 'Shipping Today', size: 'medium' },
      { widgetType: 'EXCEPTIONS_FEED', title: 'Exceptions', size: 'medium' },
    ],
    showAiPanel: true,
  },

  // ============================================
  // PLANNING & SCHEDULING ROLES
  // ============================================
  SCHEDULER: {
    layout: '2-column',
    title: 'Scheduling Dashboard',
    widgets: [
      { widgetType: 'FLOW_BOARD', title: 'Schedule View', size: 'large' },
      { widgetType: 'WORKCENTER_UTIL', title: 'Work Center Utilization', size: 'medium' },
      { widgetType: 'BOTTLENECK_STRIP', title: 'Bottlenecks', size: 'small' },
      { widgetType: 'SLA_RISK', title: 'SLA Risk', size: 'medium' },
      { widgetType: 'FORECAST', title: 'Today vs Tomorrow', size: 'medium' },
      { widgetType: 'EXCEPTIONS_FEED', title: 'Exceptions', size: 'small' },
    ],
    showAiPanel: true,
  },

  // ============================================
  // CUSTOMER SERVICE ROLES
  // ============================================
  CSR: {
    layout: '2-column',
    title: 'Customer Service View',
    widgets: [
      { widgetType: 'FLOW_BOARD', title: 'Order Status', size: 'large' },
      { widgetType: 'SLA_RISK', title: 'At-Risk Orders', size: 'medium' },
      { widgetType: 'SHIPPING_PANEL', title: 'Shipping Today', size: 'medium' },
      { widgetType: 'RFQ_FUNNEL', title: 'Quote Pipeline', size: 'medium' },
    ],
    showAiPanel: true,
  },

  // ============================================
  // SHOP FLOOR ROLES
  // ============================================
  SUPERVISOR: {
    layout: '2-column',
    title: 'Shop Floor Supervisor',
    widgets: [
      { widgetType: 'FLOW_BOARD', title: 'Active Jobs', size: 'large' },
      { widgetType: 'WORKCENTER_UTIL', title: 'Machine Status', size: 'medium' },
      { widgetType: 'BOTTLENECK_STRIP', title: 'Bottlenecks', size: 'small' },
      { widgetType: 'EXCEPTIONS_FEED', title: 'Exceptions & Issues', size: 'medium' },
      { widgetType: 'SLA_RISK', title: 'Priority Jobs', size: 'medium' },
    ],
    showAiPanel: true,
  },

  OPERATOR: {
    layout: 'simple',
    title: 'Operator View',
    widgets: [
      { widgetType: 'FLOW_BOARD', title: 'My Jobs', size: 'large' },
      { widgetType: 'EXCEPTIONS_FEED', title: 'My Exceptions', size: 'small' },
    ],
    showAiPanel: false,
  },

  // ============================================
  // SHIPPING & LOGISTICS ROLES
  // ============================================
  PACKAGING: {
    layout: 'simple',
    title: 'Packaging Station',
    widgets: [
      { widgetType: 'FLOW_BOARD', title: 'Jobs to Package', size: 'large' },
      { widgetType: 'SHIPPING_PANEL', title: 'Staging Queue', size: 'medium' },
      { widgetType: 'EXCEPTIONS_FEED', title: 'Packaging Issues', size: 'small' },
    ],
    showAiPanel: false,
  },

  SHIPPING: {
    layout: '2-column',
    title: 'Shipping Dashboard',
    widgets: [
      { widgetType: 'SHIPPING_PANEL', title: 'Shipping Queue', size: 'large' },
      { widgetType: 'FLOW_BOARD', title: 'Ready to Ship', size: 'medium' },
      { widgetType: 'TRANSFERS', title: 'Outbound Transfers', size: 'medium' },
      { widgetType: 'EXCEPTIONS_FEED', title: 'Shipping Issues', size: 'small' },
    ],
    showAiPanel: false,
  },

  // ============================================
  // QUALITY ROLES
  // ============================================
  QUALITY: {
    layout: '2-column',
    title: 'Quality Dashboard',
    widgets: [
      { widgetType: 'EXCEPTIONS_FEED', title: 'QC Holds & Issues', size: 'large' },
      { widgetType: 'BOM_QUALITY', title: 'BOM / Recipe Health', size: 'medium' },
      { widgetType: 'FLOW_BOARD', title: 'Jobs Pending QC', size: 'medium' },
      { widgetType: 'SLA_RISK', title: 'At-Risk Due to QC', size: 'small' },
    ],
    showAiPanel: true,
  },

  // ============================================
  // PROCUREMENT / INVENTORY ROLES
  // ============================================
  PROCUREMENT: {
    layout: '2-column',
    title: 'Procurement Dashboard',
    widgets: [
      { widgetType: 'INVENTORY_HEATMAP', title: 'Inventory Status', size: 'large' },
      { widgetType: 'TRANSFERS', title: 'Inbound Transfers', size: 'medium' },
      { widgetType: 'SLA_RISK', title: 'Material-Related SLA Risk', size: 'medium' },
      { widgetType: 'EXCEPTIONS_FEED', title: 'Material Exceptions', size: 'small' },
    ],
    showAiPanel: true,
  },

  // ============================================
  // IT / ADMIN ROLES
  // ============================================
  IT_ADMIN: {
    layout: '2-column',
    title: 'System Administration',
    widgets: [
      { widgetType: 'WORKCENTER_UTIL', title: 'System Utilization', size: 'medium' },
      { widgetType: 'BOM_QUALITY', title: 'Data Quality', size: 'medium' },
      { widgetType: 'EXCEPTIONS_FEED', title: 'System Exceptions', size: 'medium' },
      { widgetType: 'BOTTLENECK_STRIP', title: 'Performance Bottlenecks', size: 'small' },
    ],
    showAiPanel: true,
  },

  // ============================================
  // SALES ROLES
  // ============================================
  SALES_MANAGER: {
    layout: '2-column',
    title: 'Sales Management',
    widgets: [
      { widgetType: 'RFQ_FUNNEL', title: 'Sales Pipeline', size: 'large' },
      { widgetType: 'MARGIN_INSIGHTS', title: 'Margin Performance', size: 'medium' },
      { widgetType: 'FLOW_BOARD', title: 'Active Orders', size: 'medium' },
      { widgetType: 'SLA_RISK', title: 'At-Risk Customers', size: 'medium' },
      { widgetType: 'INVENTORY_HEATMAP', title: 'Available Inventory', size: 'medium' },
    ],
    showAiPanel: true,
  },

  SALES_REP: {
    layout: '2-column',
    title: 'Sales Representative',
    widgets: [
      { widgetType: 'RFQ_FUNNEL', title: 'My Pipeline', size: 'large' },
      { widgetType: 'FLOW_BOARD', title: 'My Orders', size: 'medium' },
      { widgetType: 'MARGIN_INSIGHTS', title: 'Quote Margins', size: 'medium' },
      { widgetType: 'INVENTORY_HEATMAP', title: 'Available Inventory', size: 'medium' },
      { widgetType: 'SHIPPING_PANEL', title: 'Customer Shipments', size: 'medium' },
    ],
    showAiPanel: true,
  },

  ACCOUNT_MANAGER: {
    layout: '2-column',
    title: 'Account Management',
    widgets: [
      { widgetType: 'FLOW_BOARD', title: 'Account Orders', size: 'large' },
      { widgetType: 'RFQ_FUNNEL', title: 'Active Opportunities', size: 'medium' },
      { widgetType: 'SLA_RISK', title: 'Delivery Risk', size: 'medium' },
      { widgetType: 'MARGIN_INSIGHTS', title: 'Account Profitability', size: 'medium' },
      { widgetType: 'SHIPPING_PANEL', title: 'Shipments', size: 'medium' },
      { widgetType: 'EXCEPTIONS_FEED', title: 'Account Issues', size: 'small' },
    ],
    showAiPanel: true,
  },

  INSIDE_SALES: {
    layout: '2-column',
    title: 'Inside Sales',
    widgets: [
      { widgetType: 'RFQ_FUNNEL', title: 'Quote Pipeline', size: 'large' },
      { widgetType: 'INVENTORY_HEATMAP', title: 'Stock Availability', size: 'medium' },
      { widgetType: 'FLOW_BOARD', title: 'Orders', size: 'medium' },
      { widgetType: 'MARGIN_INSIGHTS', title: 'Pricing Insights', size: 'medium' },
    ],
    showAiPanel: true,
  },

  // ============================================
  // CUSTOMER PORTAL
  // ============================================
  CUSTOMER_PORTAL: {
    layout: 'simple',
    title: 'My Orders',
    widgets: [
      { widgetType: 'FLOW_BOARD', title: 'Order Status', size: 'large' },
      { widgetType: 'SHIPPING_PANEL', title: 'Shipments', size: 'medium' },
    ],
    showAiPanel: false,
  },
};

// Available roles for dropdown selection
export const AVAILABLE_ROLES = Object.keys(DASHBOARD_CONFIG);

// Role display names
export const ROLE_DISPLAY_NAMES = {
  CEO: 'CEO',
  CFO: 'CFO',
  VP_OPERATIONS: 'VP Operations',
  BRANCH_MANAGER: 'Branch Manager',
  SCHEDULER: 'Scheduler',
  CSR: 'Customer Service Rep',
  SUPERVISOR: 'Shop Floor Supervisor',
  OPERATOR: 'Operator',
  PACKAGING: 'Packaging',
  SHIPPING: 'Shipping',
  QUALITY: 'Quality / QA',
  PROCUREMENT: 'Procurement',
  IT_ADMIN: 'IT Admin',
  SALES_MANAGER: 'Sales Manager',
  SALES_REP: 'Sales Representative',
  ACCOUNT_MANAGER: 'Account Manager',
  INSIDE_SALES: 'Inside Sales',
  CUSTOMER_PORTAL: 'Customer Portal',
};

export default DASHBOARD_CONFIG;
