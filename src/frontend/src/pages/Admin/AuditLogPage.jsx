/**
 * AuditLogPage.jsx — Manager-facing full-page audit log of all CSR overrides.
 *
 * Route: /admin/audit-log
 * Shows summary stats at top, then the AuditLogViewer table.
 */
import React, { useState, useEffect } from 'react'
import {
  Box, Typography, Paper, Grid, Breadcrumbs, Link, Chip,
  CircularProgress,
} from '@mui/material'
import {
  Gavel         as GavelIcon,
  Schedule      as CutoffIcon,
  Memory        as CapacityIcon,
  TrendingDown  as PricingIcon,
  CheckCircle   as ActiveIcon,
  Assessment    as StatsIcon,
  NavigateNext  as NavIcon,
  Home          as HomeIcon,
} from '@mui/icons-material'
import { Link as RouterLink } from 'react-router-dom'
import AuditLogViewer from '../../components/orders/AuditLogViewer'
import {
  OVERRIDE_TYPE, OVERRIDE_TYPE_LABELS,
  getOverrideStats,
} from '../../services/overrideApi'

const STAT_CARDS = [
  { key: 'totalActive', label: 'Active Overrides',  icon: <ActiveIcon />, color: '#2e7d32' },
  { key: 'totalAllTime', label: 'Total (All Time)',  icon: <StatsIcon />,  color: '#546e7a' },
  { key: 'todayCount',   label: "Today's Overrides", icon: <GavelIcon />,  color: '#e65100' },
]

const TYPE_ICON_MAP = {
  [OVERRIDE_TYPE.CUTOFF_VIOLATION]: <CutoffIcon fontSize="small" />,
  [OVERRIDE_TYPE.CAPACITY_WARNING]: <CapacityIcon fontSize="small" />,
  [OVERRIDE_TYPE.PRICING_OVERRIDE]: <PricingIcon fontSize="small" />,
}

export default function AuditLogPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getOverrideStats()
      .then(r => { if (active) setStats(r.data) })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/" underline="hover" color="inherit"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <HomeIcon fontSize="small" /> Home
        </Link>
        <Link component={RouterLink} to="/admin/users" underline="hover" color="inherit">
          Administration
        </Link>
        <Typography color="text.primary" fontWeight={600}>Override Audit Log</Typography>
      </Breadcrumbs>

      {/* Title bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <GavelIcon sx={{ fontSize: 32, color: '#546e7a' }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>CSR Override Audit Log</Typography>
          <Typography variant="body2" color="text.secondary">
            Review all override events — cutoff violations, capacity warnings, and pricing changes
          </Typography>
        </Box>
      </Box>

      {/* Stats cards */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : stats ? (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Summary numbers */}
          {STAT_CARDS.map(sc => (
            <Grid item xs={12} sm={4} md={2.5} key={sc.key}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  borderLeft: `4px solid ${sc.color}`,
                }}
              >
                <Box sx={{ color: sc.color, display: 'flex' }}>{sc.icon}</Box>
                <Box>
                  <Typography variant="h5" fontWeight={700} lineHeight={1}>
                    {stats[sc.key] ?? 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{sc.label}</Typography>
                </Box>
              </Paper>
            </Grid>
          ))}

          {/* By-type breakdown */}
          {Object.entries(stats.byType || {}).map(([type, count]) => (
            <Grid item xs={6} sm={4} md={2.17} key={type}>
              <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                {TYPE_ICON_MAP[type]}
                <Box>
                  <Typography variant="body2" fontWeight={600}>{count}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {OVERRIDE_TYPE_LABELS[type]?.split(' ')[0]}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : null}

      {/* Top users */}
      {stats?.topUsers?.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.75 }}>
            Top Override Users
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {stats.topUsers.map(u => (
              <Chip
                key={u.user}
                label={`${u.userName} (${u.count})`}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Main audit table */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <AuditLogViewer canRevoke maxHeight={600} />
      </Paper>
    </Box>
  )
}
