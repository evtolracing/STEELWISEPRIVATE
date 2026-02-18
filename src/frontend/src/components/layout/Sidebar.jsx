import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  IconButton,
  Collapse,
  Button,
} from '@mui/material'
import {
  ExpandLess,
  ExpandMore,
  PlayCircle as DemoPlayIcon,
  Dashboard as DashboardIcon,
  Thermostat as HeatIcon,
  ViewModule as UnitsIcon,
  Inventory2 as InventoryIcon,
  LocalShipping as LogisticsIcon,
  VerifiedUser as QualityIcon,
  AccountTree as ProvenanceIcon,
  Settings as SettingsIcon,
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
  Recycling as RemnantOutletIcon,
  // Admin
  Group as UsersIcon,
  Gavel as AuditLogIcon,
  Timer as RecipesIcon,
  Engineering as StaffIcon,
  Tune as PreferencesIcon,
  BusinessCenter as AccountIcon,
  HelpOutline as HelpManualIcon,
} from '@mui/icons-material'

import { useDemo } from '../../contexts/DemoContext'

const navSections = [
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
      { path: '/sales/rfq-inbox', label: 'RFQ Inbox', icon: RFQIcon },
      { path: '/sales/dashboard', label: 'Sales Dashboard', icon: SalesDashIcon },
      { path: '/commercial/demand-shaping', label: 'Demand Shaping', icon: DemandShapingIcon },
    ],
  },
  {
    title: 'Orders',
    items: [
      { path: '/order-board', label: 'Order Board', icon: KanbanIcon },
      { path: '/orders', label: 'All Orders', icon: OrdersIcon },
      { path: '/orders/intake', label: 'CSR Intake', icon: CSRIntakeIcon, highlight: true },
      { path: '/orders/online-inbox', label: 'Online Inbox', icon: OnlineInboxIcon },
      { path: '/pos/retail', label: 'Retail POS', icon: RetailPOSIcon },
    ],
  },

  // ─── PRODUCTION WORKFLOW ──────────────────────────────
  {
    title: 'Production',
    items: [
      { path: '/planning', label: 'Planning', icon: PlanningIcon },
      { path: '/schedule', label: 'Schedule', icon: ScheduleIcon },
      { path: '/shopfloor', label: 'Shop Floor', icon: WorkCenterIcon },
      { path: '/time-tracking', label: 'Time Tracking', icon: TimeTrackingIcon },
    ],
  },
  {
    title: 'Inventory & Materials',
    items: [
      { path: '/inventory', label: 'Inventory', icon: InventoryIcon },
      { path: '/heats', label: 'Heats', icon: HeatIcon },
      { path: '/units', label: 'Units', icon: UnitsIcon },
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
      { path: '/material-tracking/tags', label: 'Tag Management', icon: LabelIcon },
      { path: '/material-tracking/staging', label: 'Staging & Loading', icon: StagingIcon },
      { path: '/material-tracking/traceability', label: 'Traceability', icon: CustodyIcon },
    ],
  },
  {
    title: 'Shipping & Logistics',
    items: [
      { path: '/receiving', label: 'Receiving', icon: ReceivingIcon },
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
      { path: '/shop/remnants', label: 'Remnant Outlet', icon: RemnantOutletIcon },
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
    title: 'Administration',
    items: [
      { path: '/admin/users', label: 'User Management', icon: UsersIcon },
      { path: '/admin/staff', label: 'Staff & Operators', icon: StaffIcon },
      { path: '/admin/partners', label: 'Partner API', icon: PartnerApiIcon },
      { path: '/admin/audit-log', label: 'Audit Log', icon: AuditLogIcon },
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

export default function Sidebar({ drawerWidth, mobileOpen, onMobileClose }) {
  const location = useLocation()
  const { isActive, startDemo, stopDemo } = useDemo()
  
  // Initialize all sections as expanded
  const [openSections, setOpenSections] = useState(() => {
    const initial = {}
    navSections.forEach((section) => {
      initial[section.title] = true
    })
    return initial
  })

  const handleToggleSection = (title) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
            SW
          </Typography>
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            SteelWise
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Steel ERP Platform
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Demo Launcher */}
      <Box sx={{ px: 2, py: 1.5 }}>
        {!isActive ? (
          <Button
            fullWidth
            variant="contained"
            startIcon={<DemoPlayIcon />}
            onClick={startDemo}
            sx={{
              background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 50%, #01579b 100%)',
              color: 'white',
              fontWeight: 700,
              py: 1.2,
              borderRadius: 2,
              fontSize: '0.85rem',
              textTransform: 'none',
              letterSpacing: 0.5,
              boxShadow: '0 4px 12px rgba(13, 71, 161, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0d47a1 0%, #01579b 50%, #006064 100%)',
                boxShadow: '0 6px 16px rgba(13, 71, 161, 0.6)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            ▶ Start Alro Demo
          </Button>
        ) : (
          <Button
            fullWidth
            variant="outlined"
            color="error"
            onClick={stopDemo}
            size="small"
            sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
          >
            ■ End Demo Mode
          </Button>
        )}
      </Box>

      <Divider />

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {navSections.map((section) => (
          <Box key={section.title} sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleToggleSection(section.title)}
              sx={{
                py: 0.5,
                px: 2,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <ListItemText
                primary={section.title}
                primaryTypographyProps={{
                  variant: 'overline',
                  sx: { color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600 },
                }}
              />
              {openSections[section.title] ? (
                <ExpandLess sx={{ fontSize: 18, color: 'text.secondary' }} />
              ) : (
                <ExpandMore sx={{ fontSize: 18, color: 'text.secondary' }} />
              )}
            </ListItemButton>
            <Collapse in={openSections[section.title]} timeout="auto" unmountOnExit>
              <List dense sx={{ px: 1 }}>
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname.startsWith(item.path)
                  const isHighlight = item.highlight
                  return (
                    <ListItem key={item.path} disablePadding sx={{ mb: 0.25 }}>
                      <ListItemButton
                        component={NavLink}
                        to={item.path}
                        onClick={onMobileClose}
                        sx={{
                          borderRadius: 1,
                          bgcolor: isActive 
                            ? 'primary.main' 
                            : isHighlight 
                              ? 'warning.light' 
                              : 'transparent',
                          color: isActive ? 'white' : 'text.primary',
                          border: isHighlight && !isActive ? '2px solid' : 'none',
                          borderColor: isHighlight && !isActive ? 'warning.main' : 'transparent',
                          '&:hover': {
                            bgcolor: isActive ? 'primary.dark' : 'action.hover',
                          },
                          py: 0.75,
                        }}
                      >
                        <ListItemIcon
                          sx={{ color: isActive ? 'white' : isHighlight ? 'warning.dark' : 'text.secondary', minWidth: 36 }}
                        >
                          <Icon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.label} 
                          primaryTypographyProps={{ 
                            fontSize: '0.875rem',
                            fontWeight: isHighlight ? 600 : 400,
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  )
                })}
              </List>
            </Collapse>
          </Box>
        ))}
      </Box>

      <Divider />

      {/* User */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>JD</Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              John Doe
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Administrator
            </Typography>
          </Box>
          <IconButton size="small">
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ 
          keepMounted: true,
          disableRestoreFocus: true,
          disableEnforceFocus: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  )
}
