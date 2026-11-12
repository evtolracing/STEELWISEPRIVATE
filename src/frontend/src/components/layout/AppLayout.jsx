import { useState } from 'react'
import { Outlet, useLocation, Navigate, Link as RouterLink } from 'react-router-dom'
import { Box, Button, Paper, Typography, useMediaQuery, useTheme } from '@mui/material'
import { useAuth } from '../../hooks/useAuth'
import { canAccessPath, homeFor } from '../../config/roleAccess'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import PrintQueueDrawer from './PrintQueueDrawer'
import { DemoProvider } from '../../contexts/DemoContext'
import DemoOverlay from '../demo/DemoOverlay'

const DRAWER_WIDTH = 260

// Shows the page only if the user's role can open it.
function RoleGate() {
  const location = useLocation()
  const { user } = useAuth()
  const role = user?.role
  if (canAccessPath(role, location.pathname)) return <Outlet />
  const home = homeFor(role)
  if (location.pathname === '/' && home !== '/') return <Navigate to={home} replace />
  return (
    <Paper sx={{ p: 4, maxWidth: 520, mx: 'auto', mt: 6, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>No access</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Your role doesn't include this page. Ask an administrator if you need it.
      </Typography>
      <Button variant="contained" component={RouterLink} to={home}>Go to my home page</Button>
    </Paper>
  )
}

export default function AppLayout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  return (
    <DemoProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <TopBar 
          drawerWidth={DRAWER_WIDTH} 
          onMenuClick={handleDrawerToggle} 
        />
        
        <Sidebar 
          drawerWidth={DRAWER_WIDTH}
          mobileOpen={mobileOpen}
          onMobileClose={handleDrawerToggle}
        />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
            mt: 8,
            bgcolor: 'background.default',
            height: 'calc(100vh - 64px)',
            overflow: 'auto',
          }}
        >
          <RoleGate />
        </Box>

        <DemoOverlay />
        <PrintQueueDrawer />
      </Box>
    </DemoProvider>
  )
}
