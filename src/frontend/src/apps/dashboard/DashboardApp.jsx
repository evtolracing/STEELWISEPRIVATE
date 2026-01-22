// src/apps/dashboard/DashboardApp.js
/**
 * Dashboard Application with Role Switcher
 * React Router integration for role-based dashboards
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { AVAILABLE_ROLES, ROLE_DISPLAY_NAMES } from '../../dashboard/config/dashboardConfig';

// Lazy load the dashboard page
const RoleDashboardPage = lazy(() => import('./RoleDashboardPage.jsx'));

// Role Switcher Component
function RoleSwitcher() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentRole = searchParams.get('role') || 'BRANCH_MANAGER';

  const handleRoleChange = (event) => {
    const newRole = event.target.value;
    setSearchParams({ role: newRole });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        bgcolor: 'grey.50',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Viewing dashboard as:
        </Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="role-select-label">Role</InputLabel>
          <Select
            labelId="role-select-label"
            id="role-select"
            value={currentRole}
            label="Role"
            onChange={handleRoleChange}
          >
            {AVAILABLE_ROLES.map((role) => (
              <MenuItem key={role} value={role}>
                {ROLE_DISPLAY_NAMES[role] || role}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        Switch roles to preview different dashboard configurations
      </Typography>
    </Paper>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
      }}
    >
      <CircularProgress />
    </Box>
  );
}

// Main Dashboard App
export default function DashboardApp() {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Role Switcher (for demo purposes) */}
      <Box sx={{ px: 3, pt: 2, flexShrink: 0 }}>
        <RoleSwitcher />
      </Box>

      {/* Dashboard Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<RoleDashboardPage />} />
            <Route path="*" element={<RoleDashboardPage />} />
          </Routes>
        </Suspense>
      </Box>
    </Box>
  );
}
