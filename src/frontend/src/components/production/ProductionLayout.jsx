/**
 * Production Layout
 * Main layout wrapper for production screens
 */

import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Container
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Build as BuildIcon,
  LocalShipping as ShippingIcon
} from '@mui/icons-material';

export default function ProductionLayout() {
  const location = useLocation();
  
  const currentTab = location.pathname;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Alro Steel - Production System
          </Typography>
        </Toolbar>
        <Tabs 
          value={currentTab} 
          sx={{ bgcolor: 'primary.dark' }}
          TabIndicatorProps={{ style: { backgroundColor: 'white' } }}
        >
          <Tab
            label="Workflow Board"
            value="/production"
            component={Link}
            to="/production"
            icon={<DashboardIcon />}
            iconPosition="start"
            sx={{ color: 'white' }}
          />
          <Tab
            label="Shop Floor"
            value="/production/shop-floor"
            component={Link}
            to="/production/shop-floor"
            icon={<BuildIcon />}
            iconPosition="start"
            sx={{ color: 'white' }}
          />
          <Tab
            label="Shipping"
            value="/production/shipping"
            component={Link}
            to="/production/shipping"
            icon={<ShippingIcon />}
            iconPosition="start"
            sx={{ color: 'white' }}
          />
        </Tabs>
      </AppBar>
      
      <Container maxWidth={false} sx={{ flexGrow: 1, py: 0 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
