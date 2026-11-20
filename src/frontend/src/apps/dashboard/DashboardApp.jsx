// src/apps/dashboard/DashboardApp.js
/**
 * My dashboard: the layout for the signed-in person's role (see RoleDashboardPage.jsx).
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// Lazy load the dashboard page
const RoleDashboardPage = lazy(() => import('./RoleDashboardPage.jsx'));

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
