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
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Thermostat as HeatIcon,
  ViewModule as UnitsIcon,
  Build as WorkOrdersIcon,
  Inventory2 as InventoryIcon,
  LocalShipping as LogisticsIcon,
  AttachMoney as PricingIcon,
  VerifiedUser as QualityIcon,
  AccountTree as ProvenanceIcon,
  Category as BOMIcon,
  Settings as SettingsIcon,
  ShoppingCart as OrdersIcon,
  ViewKanban as KanbanIcon,
  Schedule as ScheduleIcon,
  PrecisionManufacturing as ShopFloorIcon,
  MoveToInbox as ReceivingIcon,
  Inventory as PackagingIcon,
  LocalShipping as ShippingIcon,
  TableChart as PlanningIcon,
  Assignment as ProductionIcon,
} from '@mui/icons-material'

const navSections = [
  {
    title: 'Overview',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    ],
  },
  {
    title: 'Production',
    items: [
      { path: '/production', label: 'Workflow Board', icon: ProductionIcon },
      { path: '/shop-floor', label: 'Shop Floor', icon: ShopFloorIcon },
    ],
  },
  {
    title: 'Service Center',
    items: [
      { path: '/order-board', label: 'Order Board', icon: KanbanIcon },
      { path: '/planning', label: 'Planning', icon: PlanningIcon },
      { path: '/schedule', label: 'Schedule', icon: ScheduleIcon },
      { path: '/receiving', label: 'Receiving', icon: ReceivingIcon },
      { path: '/packaging', label: 'Packaging', icon: PackagingIcon },
      { path: '/shipping', label: 'Shipping', icon: ShippingIcon },
    ],
  },
  {
    title: 'Materials',
    items: [
      { path: '/heats', label: 'Heats', icon: HeatIcon },
      { path: '/units', label: 'Units', icon: UnitsIcon },
      { path: '/inventory', label: 'Inventory', icon: InventoryIcon },
    ],
  },
  {
    title: 'Operations',
    items: [
      { path: '/work-orders', label: 'Work Orders', icon: WorkOrdersIcon },
      { path: '/bom', label: 'BOM / Recipes', icon: BOMIcon },
      { path: '/orders', label: 'Orders', icon: OrdersIcon },
    ],
  },
  {
    title: 'Logistics',
    items: [
      { path: '/shipments', label: 'Shipments', icon: LogisticsIcon },
    ],
  },
  {
    title: 'Commercial',
    items: [
      { path: '/pricing', label: 'Pricing', icon: PricingIcon },
    ],
  },
  {
    title: 'Quality & Compliance',
    items: [
      { path: '/qaqc', label: 'QA/QC', icon: QualityIcon },
      { path: '/provenance', label: 'Provenance', icon: ProvenanceIcon },
    ],
  },
]

export default function Sidebar({ drawerWidth, mobileOpen, onMobileClose }) {
  const location = useLocation()

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

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {navSections.map((section) => (
          <Box key={section.title} sx={{ mb: 1 }}>
            <Typography
              variant="overline"
              sx={{ px: 2, color: 'text.secondary', fontSize: '0.7rem' }}
            >
              {section.title}
            </Typography>
            <List dense sx={{ px: 1 }}>
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <ListItem key={item.path} disablePadding sx={{ mb: 0.25 }}>
                    <ListItemButton
                      component={NavLink}
                      to={item.path}
                      onClick={onMobileClose}
                      sx={{
                        borderRadius: 1,
                        bgcolor: isActive ? 'primary.main' : 'transparent',
                        color: isActive ? 'white' : 'text.primary',
                        '&:hover': {
                          bgcolor: isActive ? 'primary.dark' : 'action.hover',
                        },
                        py: 0.75,
                      }}
                    >
                      <ListItemIcon
                        sx={{ color: isActive ? 'white' : 'text.secondary', minWidth: 36 }}
                      >
                        <Icon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.label} 
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                      />
                    </ListItemButton>
                  </ListItem>
                )
              })}
            </List>
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
        ModalProps={{ keepMounted: true }}
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
