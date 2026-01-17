import { useState } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Inventory as InventoryIcon,
  LocalShipping as ShippingIcon,
  Assignment as OrderIcon,
  Warning as WarningIcon,
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useApiQuery } from '../../hooks/useApiQuery'
import { getDashboardStats, getRecentOrders } from '../../api'
import { DataTable, StatusChip } from '../../components/common'

function StatCard({ title, value, change, changeLabel, icon: Icon, color = 'primary' }) {
  const isPositive = change >= 0
  
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={600}>
              {value}
            </Typography>
            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                {isPositive ? (
                  <TrendingUpIcon fontSize="small" color="success" />
                ) : (
                  <TrendingDownIcon fontSize="small" color="error" />
                )}
                <Typography 
                  variant="body2" 
                  color={isPositive ? 'success.main' : 'error.main'}
                >
                  {isPositive ? '+' : ''}{change}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {changeLabel || 'vs last month'}
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${color}.light`,
              color: `${color}.main`,
            }}
          >
            <Icon />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

function AlertCard({ alerts = [] }) {
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Alerts & Notifications
      </Typography>
      <Stack spacing={1}>
        {alerts.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            No alerts at this time
          </Typography>
        ) : (
          alerts.map((alert, index) => (
            <Box
              key={index}
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: alert.severity === 'error' ? 'error.light' : 
                         alert.severity === 'warning' ? 'warning.light' : 'info.light',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <WarningIcon 
                fontSize="small" 
                color={alert.severity || 'warning'} 
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={500}>
                  {alert.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {alert.message}
                </Typography>
              </Box>
            </Box>
          ))
        )}
      </Stack>
    </Paper>
  )
}

function RecentOrdersTable({ orders = [] }) {
  const columns = [
    { id: 'orderNumber', label: 'Order #', minWidth: 100 },
    { id: 'customer', label: 'Customer', minWidth: 150 },
    { id: 'type', label: 'Type', minWidth: 80, 
      render: (row) => <StatusChip status={row.type} size="small" /> },
    { id: 'status', label: 'Status', minWidth: 100,
      render: (row) => <StatusChip status={row.status} size="small" /> },
    { id: 'total', label: 'Total', minWidth: 100,
      render: (row) => `$${row.total?.toLocaleString() || 0}` },
    { id: 'date', label: 'Date', minWidth: 100,
      render: (row) => new Date(row.createdAt).toLocaleDateString() },
  ]

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Recent Orders</Typography>
        <IconButton size="small">
          <RefreshIcon />
        </IconButton>
      </Box>
      <DataTable
        columns={columns}
        data={orders}
        pageSize={5}
        showSearch={false}
      />
    </Paper>
  )
}

function InventoryOverview({ inventory = {} }) {
  const categories = [
    { label: 'Hot Rolled', value: inventory.hotRolled || 0, max: 100 },
    { label: 'Cold Rolled', value: inventory.coldRolled || 0, max: 100 },
    { label: 'Galvanized', value: inventory.galvanized || 0, max: 100 },
    { label: 'Stainless', value: inventory.stainless || 0, max: 100 },
  ]

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Inventory Overview
      </Typography>
      <Stack spacing={2}>
        {categories.map((cat) => (
          <Box key={cat.label}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">{cat.label}</Typography>
              <Typography variant="body2" fontWeight={500}>
                {cat.value}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={cat.value}
              sx={{ height: 8, borderRadius: 4 }}
              color={cat.value < 30 ? 'error' : cat.value < 60 ? 'warning' : 'primary'}
            />
          </Box>
        ))}
      </Stack>
    </Paper>
  )
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useApiQuery(
    'dashboardStats',
    getDashboardStats,
    { refetchInterval: 60000 } // Refresh every minute
  )

  const { data: recentOrders, isLoading: ordersLoading } = useApiQuery(
    'recentOrders',
    () => getRecentOrders({ limit: 5 })
  )

  // Mock data for demo
  const mockStats = {
    totalUnits: 1247,
    unitsChange: 12.5,
    activeShipments: 34,
    shipmentsChange: -2.3,
    pendingOrders: 156,
    ordersChange: 8.1,
    lowStockAlerts: 7,
  }

  const mockAlerts = [
    { severity: 'warning', title: 'Low Stock', message: 'Grade A36 below minimum threshold' },
    { severity: 'error', title: 'QC Hold', message: '3 units pending quality review' },
    { severity: 'info', title: 'Shipment Delay', message: 'Carrier reported 2hr delay on route 45' },
  ]

  const mockOrders = [
    { orderNumber: 'SO-2024-001', customer: 'Acme Steel Co', type: 'SALES', status: 'IN_PROGRESS', total: 45600, createdAt: new Date() },
    { orderNumber: 'PO-2024-042', customer: 'Metal Supply Inc', type: 'PURCHASE', status: 'PENDING', total: 128000, createdAt: new Date() },
    { orderNumber: 'SO-2024-002', customer: 'BuildRight LLC', type: 'SALES', status: 'COMPLETED', total: 23400, createdAt: new Date() },
  ]

  const displayStats = stats || mockStats
  const displayOrders = recentOrders?.orders || mockOrders

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Dashboard
        </Typography>
        <Chip label="Last updated: Just now" size="small" />
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Units in Stock"
            value={displayStats.totalUnits?.toLocaleString()}
            change={displayStats.unitsChange}
            icon={InventoryIcon}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Shipments"
            value={displayStats.activeShipments}
            change={displayStats.shipmentsChange}
            icon={ShippingIcon}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Orders"
            value={displayStats.pendingOrders}
            change={displayStats.ordersChange}
            icon={OrderIcon}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Alerts"
            value={displayStats.lowStockAlerts}
            icon={WarningIcon}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <RecentOrdersTable orders={displayOrders} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <AlertCard alerts={mockAlerts} />
            <InventoryOverview inventory={{ hotRolled: 78, coldRolled: 45, galvanized: 92, stainless: 23 }} />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}
