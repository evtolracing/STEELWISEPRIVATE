// The menu of the application: every section and the pages in it. The sidebar draws it, the search in
// the top bar finds pages in it, and the page title comes from it. One list, so the three cannot differ.
import {
  Dashboard as DashboardIcon,
  Thermostat as HeatIcon,
  ViewModule as UnitsIcon,
  Inventory2 as InventoryIcon,
  LocalShipping as LogisticsIcon,
  VerifiedUser as QualityIcon,
  AccountTree as ProvenanceIcon,
  ShoppingCart as OrdersIcon,
  ViewKanban as KanbanIcon,
  Schedule as ScheduleIcon,
  MoveToInbox as ReceivingIcon,
  LocalShipping as ShippingIcon,
  TableChart as PlanningIcon,
  Speed as CockpitIcon,
  Factory as WorkCenterIcon,
  Timer as TimeTrackingIcon,
  People as CustomersIcon,
  Shield as PartnerApiIcon,
  HealthAndSafety as SafetyIcon,
  ReportProblem as IncidentIcon,
  Checklist as InspectionIcon,
  Lock as PermitIcon,
  School as SafetyTrainingIcon,
  Visibility as ObservationIcon,
  BuildCircle as CAPAIcon,
  SmartToy as AssistantIcon,
  Block as StopWorkIcon,
  // Supplier Quality
  LocalShipping as InboundIcon,
  Rule as IQCIcon,
  Warning as SNCIcon,
  Gavel as SCARIcon,
  Assessment as ScorecardIcon,
  Business as SupplierIcon,
  // Customer Quality
  Inbox as ClaimsIcon,
  AssignmentReturn as RMAIcon,
  ReceiptLong as InvoicesIcon,
  BugReport as CARIcon,
  CreditCard as CreditsIcon,
  // Contractor Portal
  Badge as VisitorBadgeIcon,
  HowToReg as PreRegIcon,
  Groups as ActiveVisitorsIcon,
  ContactPage as ContractorRegistryIcon,
  // Training
  School as TrainingIcon2,
  MenuBook as CatalogIcon,
  CardMembership as CertificationIcon,
  GridOn as MatrixIcon,
  // Quality
  PlaylistAddCheck as InspectionExecIcon,
  ShowChart as SPCIcon,
  FactCheck as QualityDashIcon,
  ReportProblem as NCRIcon,
  // Maintenance
  Build as MaintenanceIcon,
  Handyman as WorkOrderIcon,
  EventRepeat as PMIcon,
  Warehouse as PartsIcon,
  PrecisionManufacturing as AssetIcon,
  // Material Tracking
  Inventory2 as PackagingQueueIcon,
  QrCode2 as LabelIcon,
  Dock as StagingIcon,
  Timeline as CustodyIcon,
  // Shipping & Logistics
  CompareArrows as FreightCompareIcon,
  ViewKanban as FreightTrackingIcon,
  ErrorOutline as FreightExceptionIcon,
  // Sales
  RequestQuote as RFQIcon,
  TrendingUp as SalesDashIcon,
  TrendingDown as DemandShapingIcon,
  // Order Intake
  PhoneInTalk as CSRIntakeIcon,
  Inbox as OnlineInboxIcon,
  Storefront as RetailPOSIcon,
  // Executive
  Insights as ExecutiveIcon,
  PlayCircle as SimulationIcon,
  StackedLineChart as ForecastIcon,
  HistoryEdu as DecisionLogIcon,
  Hub as DigitalTwinIcon,
  Speed as CompressionIcon,
  // E-Commerce
  Storefront as ShopIcon,
  Search as ShopSearchIcon,
  ShoppingCart as CartIcon,
  ListAlt as MyOrdersIcon,
  Tune as OnlineSettingsIcon,
  Inventory as AdminCatalogIcon,
  Recycling as SteelOutletIcon,
  // Admin
  Group as UsersIcon,
  Gavel as AuditLogIcon,
  Timer as RecipesIcon,
  Engineering as StaffIcon,
  Tune as PreferencesIcon,
  BusinessCenter as AccountIcon,
  HelpOutline as HelpManualIcon,
  LocalOffer as PricingNavIcon,
} from '@mui/icons-material'

export const navSections = [
  // ─── OVERVIEW ─────────────────────────────────────────
  {
    title: 'Dashboard',
    items: [
      { path: '/ops-cockpit', label: 'Ops Cockpit', icon: CockpitIcon },
      { path: '/role-dashboard', label: 'My Dashboard', icon: DashboardIcon },
    ],
  },

  // ─── SALES WORKFLOW ───────────────────────────────────
  {
    title: 'Sales & Customers',
    items: [
      { path: '/customers', label: 'Customers', icon: CustomersIcon },
      { path: '/customers/preferences', label: 'Preferences', icon: PreferencesIcon },
      { path: '/sales/rfq-inbox', label: 'RFQs & Quotes', icon: RFQIcon },
      { path: '/sales/dashboard', label: 'Sales Dashboard', icon: SalesDashIcon },
      { path: '/pricing', label: 'Pricing', icon: PricingNavIcon },
      { path: '/commercial/demand-shaping', label: 'Demand Shaping', icon: DemandShapingIcon },
    ],
  },
  {
    title: 'Orders',
    items: [
      { path: '/order-board', label: 'Order Board', icon: KanbanIcon },
      { path: '/orders', label: 'All Orders', icon: OrdersIcon },
      { path: '/orders/credit-holds', label: 'Credit Holds', icon: PricingNavIcon },
      { path: '/orders/intake', label: 'CSR Intake', icon: CSRIntakeIcon, highlight: true },
      { path: '/orders/online-inbox', label: 'Online Inbox', icon: OnlineInboxIcon },
      { path: '/pos/retail', label: 'Retail POS', icon: RetailPOSIcon },
      { path: '/orders/invoices', label: 'Invoices', icon: InvoicesIcon },
      { path: '/orders/returns', label: 'Returns', icon: RMAIcon },
      { path: '/orders/closeout', label: 'Orders Not Closed', icon: OrdersIcon },
    ],
  },

  // ─── PRODUCTION WORKFLOW ──────────────────────────────
  {
    title: 'Production',
    items: [
      { path: '/planning', label: 'Planning', icon: PlanningIcon },
      { path: '/schedule', label: 'Schedule', icon: ScheduleIcon },
      { path: '/work-orders', label: 'Work Orders', icon: WorkOrderIcon },
      { path: '/shopfloor', label: 'Shop Floor', icon: WorkCenterIcon },
      { path: '/time-tracking', label: 'Time Tracking', icon: TimeTrackingIcon },
    ],
  },
  {
    title: 'Inventory & Materials',
    items: [
      { path: '/units', label: 'Inventory', icon: InventoryIcon },
      { path: '/heats', label: 'Heats', icon: HeatIcon },
    ],
  },

  // ─── QUALITY & FULFILLMENT ────────────────────────────
  {
    title: 'Quality',
    items: [
      { path: '/qc', label: 'QC Inspections', icon: QualityIcon },
      { path: '/production-quality/dashboard', label: 'Quality Dashboard', icon: QualityDashIcon },
      { path: '/production-quality/inspections', label: 'Inspections', icon: InspectionExecIcon },
      { path: '/production-quality/ncr', label: 'NCR Management', icon: NCRIcon },
      { path: '/production-quality/spc', label: 'SPC Charts', icon: SPCIcon },
      { path: '/provenance', label: 'Provenance', icon: ProvenanceIcon },
    ],
  },
  {
    title: 'Material Tracking',
    items: [
      { path: '/material-tracking', label: 'Dashboard', icon: QualityDashIcon },
      { path: '/material-tracking/packaging', label: 'Packaging Queue', icon: PackagingQueueIcon },
      { path: '/material-tracking/packages', label: 'Packing', icon: PackagingQueueIcon },
      { path: '/material-tracking/tags', label: 'Tag Management', icon: LabelIcon },
      { path: '/material-tracking/staging', label: 'Staging & Loading', icon: StagingIcon },
      { path: '/material-tracking/traceability', label: 'Traceability', icon: CustodyIcon },
    ],
  },
  {
    title: 'Shipping & Logistics',
    items: [
      { path: '/purchase-orders', label: 'Purchase Orders', icon: ReceivingIcon },
      { path: '/receiving', label: 'Receiving', icon: ReceivingIcon },
      { path: '/transfers', label: 'Transfers', icon: ShippingIcon },
      { path: '/shipping', label: 'Shipping', icon: ShippingIcon },
      { path: '/freight/planner', label: 'Shipment Planner', icon: LogisticsIcon },
      { path: '/freight/comparison', label: 'Freight Comparison', icon: FreightCompareIcon },
      { path: '/freight/tracking', label: 'Tracking Board', icon: FreightTrackingIcon },
      { path: '/freight/exceptions', label: 'Exception Inbox', icon: FreightExceptionIcon },
    ],
  },

  // ─── QUALITY MANAGEMENT ───────────────────────────────
  {
    title: 'Supplier Quality',
    items: [
      { path: '/sqm/receiving', label: 'Inbound Receiving', icon: InboundIcon },
      { path: '/sqm/inspections', label: 'IQC Inspections', icon: IQCIcon },
      { path: '/sqm/snc', label: 'Nonconformances', icon: SNCIcon },
      { path: '/sqm/scar', label: 'SCAR Management', icon: SCARIcon },
      { path: '/sqm/scorecards', label: 'Scorecards', icon: ScorecardIcon },
      { path: '/sqm/suppliers', label: 'Suppliers', icon: SupplierIcon },
    ],
  },
  {
    title: 'Customer Quality',
    items: [
      { path: '/customer-quality/claims', label: 'Claims Inbox', icon: ClaimsIcon },
      { path: '/customer-quality/rma', label: 'RMA Management', icon: RMAIcon },
      { path: '/customer-quality/car', label: 'CAR Management', icon: CARIcon },
      { path: '/customer-quality/credits', label: 'Credits & Approvals', icon: CreditsIcon },
    ],
  },

  // ─── E-COMMERCE ───────────────────────────────────────
  {
    title: 'E-Commerce',
    items: [
      { path: '/shop', label: 'Online Store', icon: ShopIcon, highlight: true },
      { path: '/shop/remnants', label: 'Steel Outlet', icon: SteelOutletIcon },
      { path: '/shop/search', label: 'Product Search', icon: ShopSearchIcon },
      { path: '/shop/cart', label: 'Shopping Cart', icon: CartIcon },
      { path: '/shop/orders', label: 'My Orders', icon: MyOrdersIcon },
      { path: '/account/dashboard', label: 'Enterprise Account', icon: AccountIcon, highlight: true },
      { path: '/admin/catalog', label: 'Catalog Admin', icon: AdminCatalogIcon },
      { path: '/admin/online-settings', label: 'Online Settings', icon: OnlineSettingsIcon },
    ],
  },

  // ─── FACILITY & COMPLIANCE ────────────────────────────
  {
    title: 'Maintenance',
    items: [
      { path: '/maintenance/dashboard', label: 'Dashboard', icon: MaintenanceIcon },
      { path: '/maintenance/work-orders', label: 'Work Orders', icon: WorkOrderIcon },
      { path: '/maintenance/assets', label: 'Asset Registry', icon: AssetIcon },
      { path: '/maintenance/pm-schedules', label: 'PM Schedules', icon: PMIcon },
      { path: '/maintenance/parts', label: 'Parts Inventory', icon: PartsIcon },
    ],
  },
  {
    title: 'Safety & EHS',
    items: [
      { path: '/safety', label: 'Safety Dashboard', icon: SafetyIcon },
      { path: '/safety/stop-work', label: 'Stop-Work Authority', icon: StopWorkIcon },
      { path: '/safety/assistant', label: 'Safety Assistant', icon: AssistantIcon },
      { path: '/safety/incidents', label: 'Incidents', icon: IncidentIcon },
      { path: '/safety/inspections', label: 'Inspections', icon: InspectionIcon },
      { path: '/safety/permits', label: 'Permits', icon: PermitIcon },
      { path: '/safety/training', label: 'Training', icon: SafetyTrainingIcon },
      { path: '/safety/observations', label: 'Observations', icon: ObservationIcon },
      { path: '/safety/capa', label: 'CAPA', icon: CAPAIcon },
    ],
  },
  {
    title: 'Training',
    items: [
      { path: '/training/dashboard', label: 'Training Dashboard', icon: TrainingIcon2 },
      { path: '/training/courses', label: 'Course Catalog', icon: CatalogIcon },
      { path: '/training/my-certs', label: 'My Certifications', icon: CertificationIcon },
      { path: '/training/matrix', label: 'Competency Matrix', icon: MatrixIcon },
    ],
  },
  {
    title: 'Contractor Portal',
    items: [
      { path: '/contractors/active', label: 'Active Visitors', icon: ActiveVisitorsIcon },
      { path: '/contractors/registry', label: 'Contractor Registry', icon: ContractorRegistryIcon },
      { path: '/contractors/invitations', label: 'Pre-Registration', icon: PreRegIcon },
      { path: '/contractors/kiosk', label: 'Check-In Kiosk', icon: VisitorBadgeIcon },
    ],
  },

  // ─── EXECUTIVE & ADMIN ────────────────────────────────
  {
    title: 'Executive',
    items: [
      { path: '/executive/cockpit', label: 'Executive Cockpit', icon: ExecutiveIcon },
      { path: '/executive/simulation', label: 'Simulation', icon: SimulationIcon },
      { path: '/executive/forecast', label: 'Forecasts', icon: ForecastIcon },
      { path: '/executive/decisions', label: 'Decision Log', icon: DecisionLogIcon },
      { path: '/executive/digital-twin', label: 'Digital Twin', icon: DigitalTwinIcon },
      { path: '/executive/compression-metrics', label: 'Speed Metrics', icon: CompressionIcon },
    ],
  },
  {
    title: 'Finance',
    items: [
      { path: '/finance', label: 'Ledger', icon: InvoicesIcon },
    ],
  },
  {
    title: 'Administration',
    items: [
      { path: '/admin/users', label: 'User Management', icon: UsersIcon },
      { path: '/admin/roles', label: 'Roles & Permissions', icon: PermitIcon },
      { path: '/admin/staff', label: 'Staff & Operators', icon: StaffIcon },
      { path: '/admin/partners', label: 'Partner API', icon: PartnerApiIcon },
      { path: '/admin/integrations', label: 'Integrations', icon: PartnerApiIcon },
      { path: '/admin/audit-log', label: 'Audit Log', icon: AuditLogIcon },
      { path: '/admin/tax-rates', label: 'Sales Tax Rates', icon: InvoicesIcon },
      { path: '/admin/processing-recipes', label: 'Processing Recipes', icon: RecipesIcon },
    ],
  },
  {
    title: 'Help',
    items: [
      { path: '/help/manual', label: 'Instruction Manual', icon: HelpManualIcon },
    ],
  },
]

const allItems = navSections.flatMap((section) => section.items.map((item) => ({ ...item, section: section.title })))

/** The menu entry a page URL belongs to: the entry with the longest path the URL starts with. */
export function navItemFor(pathname) {
  const path = String(pathname || '')
  let best = null
  for (const item of allItems) {
    if (path === item.path || path.startsWith(`${item.path}/`)) { if (!best || item.path.length > best.path.length) best = item }
  }
  return best
}

/** Pages whose name or section matches what was typed, best first. */
export function searchPages(text, canOpen) {
  const q = String(text || '').trim().toLowerCase()
  if (q.length < 2) return []
  const words = q.split(/\s+/)
  const seen = new Set()
  return allItems
    .filter((item) => !seen.has(item.path) && seen.add(item.path))
    .filter((item) => canOpen(item.path))
    .map((item) => {
      const label = item.label.toLowerCase(); const hay = `${label} ${item.section.toLowerCase()}`
      if (!words.every((w) => hay.includes(w))) return null
      return { item, rank: label === q ? 0 : label.startsWith(q) ? 1 : label.includes(q) ? 2 : 3 }
    })
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank || a.item.label.localeCompare(b.item.label))
    .map((r) => r.item)
}
