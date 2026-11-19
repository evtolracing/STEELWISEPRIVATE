// src/apps/dashboard/RoleDashboardPage.jsx
/**
 * My dashboard: the layout for the signed-in person's role, with the records of the branch picked in
 * the top bar. Neither is chosen here. There used to be a role, location and division list on this
 * page; it offered made-up branches and let anyone see any role's layout, and the records stayed the
 * same whatever was picked. The role comes from the login (or an administrator's preview) and the
 * branch from the top bar, which the server applies to every record (src/backend/src/lib/viewScope.js).
 */

import React from 'react';
import { Box } from '@mui/material';
import DashboardEngine from '../../dashboard/DashboardEngine.jsx';
import { dashboardFor } from '../../dashboard/config/dashboardConfig';
import { useAuth } from '../../hooks/useAuth';

export default function RoleDashboardPage() {
  const { user, branchId } = useAuth();
  const branch = (user?.branches || []).find((b) => b.id === branchId);
  const branchName = branch ? branch.name || branch.code : (user?.allBranches ? 'All branches' : 'My branches');

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
      <DashboardEngine
        role={dashboardFor(user?.role)}
        locationId={branchId || undefined}
        branchName={branchName}
      />
    </Box>
  );
}
