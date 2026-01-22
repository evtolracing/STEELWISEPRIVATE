// src/apps/dashboard/RoleDashboardPage.jsx
/**
 * Role-Based Dashboard Page
 * Reads role and location from URL query params and renders appropriate dashboard
 */

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, FormControl, InputLabel, Select, MenuItem, Stack, Paper } from '@mui/material';
import DashboardEngine from '../../dashboard/DashboardEngine.jsx';
import { DASHBOARD_CONFIG, ROLE_DISPLAY_NAMES } from '../../dashboard/config/dashboardConfig';

// Demo locations (would come from API in production)
const LOCATIONS = [
  { id: 'FWA', name: 'Fort Wayne' },
  { id: 'CHI', name: 'Chicago' },
  { id: 'DET', name: 'Detroit' },
  { id: 'CLE', name: 'Cleveland' },
  { id: 'IND', name: 'Indianapolis' },
];

const DIVISIONS = ['METALS', 'PLASTICS', 'INDUSTRIAL'];

export default function RoleDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get params from query string, with defaults
  const role = searchParams.get('role') || 'BRANCH_MANAGER';
  const locationId = searchParams.get('location') || 'FWA';
  const division = searchParams.get('division') || 'METALS';

  const handleRoleChange = (e) => {
    setSearchParams({ role: e.target.value, location: locationId, division });
  };

  const handleLocationChange = (e) => {
    setSearchParams({ role, location: e.target.value, division });
  };

  const handleDivisionChange = (e) => {
    setSearchParams({ role, location: locationId, division: e.target.value });
  };

  // Get available roles from config
  const availableRoles = Object.keys(DASHBOARD_CONFIG);

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
      {/* Context Selector Bar */}
      <Paper sx={{ p: 1.5, mb: 2 }} elevation={0}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Role</InputLabel>
            <Select value={role} onChange={handleRoleChange} label="Role">
              {availableRoles.map((r) => (
                <MenuItem key={r} value={r}>
                  {ROLE_DISPLAY_NAMES[r] || r}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Location</InputLabel>
            <Select value={locationId} onChange={handleLocationChange} label="Location">
              {LOCATIONS.map((loc) => (
                <MenuItem key={loc.id} value={loc.id}>
                  {loc.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Division</InputLabel>
            <Select value={division} onChange={handleDivisionChange} label="Division">
              {DIVISIONS.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Dashboard Engine */}
      <DashboardEngine 
        role={role} 
        locationId={locationId} 
        division={division}
      />
    </Box>
  );
}
