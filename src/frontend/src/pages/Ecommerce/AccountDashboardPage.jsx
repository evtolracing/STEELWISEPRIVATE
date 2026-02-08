/**
 * AccountDashboardPage.jsx — Enterprise Customer Account Dashboard.
 *
 * Multi-branch overview: KPIs, branch breakdown, quick links.
 * Route: /account/dashboard
 */
import React, { useState } from 'react'
import {
  Box, Typography, Container, Paper, Grid, Chip, Button,
  Select, MenuItem, FormControl, InputLabel, CircularProgress,
  Divider, Avatar, Alert, Breadcrumbs, Link as MuiLink,
  LinearProgress, Tooltip, alpha,
} from '@mui/material'
import {
  Dashboard as DashIcon,
  Business as BranchIcon,
  ShoppingCart as OrderIcon,
  LocalShipping as ShipIcon,
  Description as DocIcon,
  TrendingUp as TrendIcon,
  AccessTime as ETAIcon,
  CheckCircle as OnTimeIcon,
  Warning as PartialIcon,
  Person as RepIcon,
  Download as ExportIcon,
  OpenInNew as OpenIcon,
  CreditCard as CreditIcon,
  Speed as KPIIcon,
} from '@mui/icons-material'
import { useNavigate, Link } from 'react-router-dom'
import useEnterpriseAccount from '../../hooks/useEnterpriseAccount'

function fmtCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtPercent(n) {
  return `${n.toFixed(1)}%`
}

export default function AccountDashboardPage() {
  const navigate = useNavigate()
  const {
    account, kpis, loading, error, branches,
    selectedBranch, setSelectedBranch,
    canExport, canViewAll, role,
  } = useEnterpriseAccount()

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4, borderRadius: 2 }}>{error}</Alert>
      </Container>
    )
  }

  const KPI_CARDS = [
    { label: 'Open Orders', value: kpis?.openOrders || 0, icon: OrderIcon, color: 'primary.main', path: '/account/orders' },
    { label: 'Open Value', value: fmtCurrency(kpis?.openValue || 0), icon: TrendIcon, color: 'success.main' },
    { label: 'Shipped This Week', value: kpis?.shippedThisWeek || 0, icon: ShipIcon, color: 'info.main', path: '/account/shipments' },
    { label: 'Pending Shipments', value: kpis?.pendingShipments || 0, icon: ETAIcon, color: 'warning.main', path: '/account/shipments' },
    { label: 'Partial Shipments', value: kpis?.partialShipments || 0, icon: PartialIcon, color: 'secondary.main' },
    { label: 'On-Time Rate', value: fmtPercent(kpis?.onTimeRate || 0), icon: OnTimeIcon, color: 'success.main' },
    { label: 'Documents', value: kpis?.documentsAvailable || 0, icon: DocIcon, color: 'info.main', path: '/account/documents' },
    { label: 'Total Orders', value: kpis?.totalOrders || 0, icon: KPIIcon, color: 'text.secondary' },
  ]

  return (
    <Container maxWidth="lg">
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} to="/" underline="hover" color="inherit">Home</MuiLink>
        <MuiLink component={Link} to="/shop" underline="hover" color="inherit">Shop</MuiLink>
        <Typography color="text.primary">Enterprise Account</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
          <BranchIcon />
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={700}>{account?.companyName}</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip label={account?.accountNumber} size="small" variant="outlined" />
            <Chip label={account?.priceLevel} size="small" color="primary" />
            <Chip label={role} size="small" color="secondary" variant="outlined" />
            <Chip label={`${branches.length} branches`} size="small" icon={<BranchIcon sx={{ fontSize: 14 }} />} />
          </Box>
        </Box>

        {/* Branch filter */}
        {canViewAll && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Branch</InputLabel>
            <Select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} label="Branch">
              <MenuItem value="">All Branches</MenuItem>
              {branches.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* KPI cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {KPI_CARDS.map(kpi => (
          <Grid item xs={6} sm={3} key={kpi.label}>
            <Paper
              elevation={0}
              onClick={() => kpi.path && navigate(kpi.path)}
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                cursor: kpi.path ? 'pointer' : 'default',
                transition: 'all 0.15s',
                '&:hover': kpi.path ? { borderColor: 'primary.main', bgcolor: (t) => alpha(t.palette.primary.main, 0.03) } : {},
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <kpi.icon sx={{ fontSize: 20, color: kpi.color }} />
                <Typography variant="caption" color="text.secondary" fontWeight={500}>{kpi.label}</Typography>
              </Box>
              <Typography variant="h5" fontWeight={700}>{kpi.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Branch breakdown */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              <BranchIcon sx={{ fontSize: 20, verticalAlign: 'bottom', mr: 0.5 }} />
              Branch Overview
            </Typography>
            {kpis?.branchBreakdown?.map(br => (
              <Box key={br.branchId} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={600}>{br.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label={`${br.openOrders} open`} size="small" color="primary" variant="outlined" sx={{ fontSize: 11 }} />
                    <Typography variant="body2" fontWeight={600} color="success.main">{fmtCurrency(br.totalSpend)}</Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, (br.totalSpend / (kpis?.openValue || 1)) * 100)}
                  sx={{ height: 6, borderRadius: 3, bgcolor: 'grey.100' }}
                />
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          {/* Account rep + credit */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              <RepIcon sx={{ fontSize: 20, verticalAlign: 'bottom', mr: 0.5 }} />
              Account Representative
            </Typography>
            <Typography variant="body1" fontWeight={600}>{account?.accountRep?.name}</Typography>
            <Typography variant="body2" color="text.secondary">{account?.accountRep?.email}</Typography>
            <Typography variant="body2" color="text.secondary">{account?.accountRep?.phone}</Typography>
          </Paper>

          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              <CreditIcon sx={{ fontSize: 20, verticalAlign: 'bottom', mr: 0.5 }} />
              Credit & Terms
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Credit Limit</Typography>
              <Typography variant="body2" fontWeight={600}>{fmtCurrency(account?.creditLimit || 0)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Used</Typography>
              <Typography variant="body2" fontWeight={600}>{fmtCurrency(account?.creditUsed || 0)}</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, ((account?.creditUsed || 0) / (account?.creditLimit || 1)) * 100)}
              color={((account?.creditUsed || 0) / (account?.creditLimit || 1)) > 0.8 ? 'warning' : 'primary'}
              sx={{ height: 8, borderRadius: 4, mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              {fmtCurrency((account?.creditLimit || 0) - (account?.creditUsed || 0))} available · {account?.paymentTerms}
            </Typography>
          </Paper>

          {/* Quick links */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Quick Links</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button fullWidth variant="outlined" startIcon={<OrderIcon />} onClick={() => navigate('/account/orders')} sx={{ justifyContent: 'flex-start' }}>
                All Orders
              </Button>
              <Button fullWidth variant="outlined" startIcon={<ShipIcon />} onClick={() => navigate('/account/shipments')} sx={{ justifyContent: 'flex-start' }}>
                Shipment Tracking
              </Button>
              <Button fullWidth variant="outlined" startIcon={<DocIcon />} onClick={() => navigate('/account/documents')} sx={{ justifyContent: 'flex-start' }}>
                Document Center
              </Button>
              {canExport && (
                <Button fullWidth variant="outlined" startIcon={<ExportIcon />} color="secondary" sx={{ justifyContent: 'flex-start' }}>
                  Export All Data
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
