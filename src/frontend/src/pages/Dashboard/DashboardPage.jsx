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
  Avatar,
  alpha,
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
  Dashboard as DashboardIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material'
import { useApiQuery } from '../../hooks/useApiQuery'
import { getDashboardStats, getRecentOrders } from '../../api'
import { DataTable, StatusChip } from '../../components/common'

function StatCard({ title, value, change, changeLabel, icon: Icon, color = 'primary' }) {
  const isPositive = change >= 0
  
  const colorMap = {
    primary: '#1976d2',
    info: '#0288d1',
    warning: '#ed6c02',
    error: '#d32f2f',
    success: '#2e7d32',
  }
  
  const bgColor = colorMap[color] || colorMap.primary
  
  return (
    <Card sx={{ 
      height: '100%',
      background: `linear-gradient(135deg, ${alpha(bgColor, 0.05)} 0%, ${alpha(bgColor, 0.02)} 100%)`,
      border: `1px solid ${alpha(bgColor, 0.15)}`,
      borderRadius: 3,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 25px ${alpha(bgColor, 0.2)}`,
        borderColor: alpha(bgColor, 0.3),
      }
    }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
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
                  fontWeight={600}
                >
                  {isPositive ? '+' : ''}{change}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {changeLabel || 'vs last month'}
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar
            sx={{
              width: 52,
              height: 52,
              background: `linear-gradient(135deg, ${bgColor} 0%, ${alpha(bgColor, 0.7)} 100%)`,
              boxShadow: `0 4px 14px ${alpha(bgColor, 0.4)}`,
            }}
          >
            <Icon sx={{ fontSize: 26 }} />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  )
}

function AlertCard({ alerts = [] }) {
  return (
    <Paper sx={{ 
      p: 2.5, 
      height: '100%',
      borderRadius: 3,
      background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)',
      border: '1px solid',
      borderColor: 'divider',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Avatar sx={{ 
          width: 36, 
          height: 36, 
          bgcolor: alpha('#ed6c02', 0.1),
        }}>
          <WarningIcon sx={{ color: 'warning.main', fontSize: 20 }} />
        </Avatar>
        <Typography variant="h6" fontWeight={700}>
          Alerts & Notifications
        </Typography>
      </Box>
      <Stack spacing={1.5}>
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
                borderRadius: 2,
                bgcolor: alert.severity === 'error' ? alpha('#d32f2f', 0.08) : 
                         alert.severity === 'warning' ? alpha('#ed6c02', 0.08) : alpha('#0288d1', 0.08),
                border: '1px solid',
                borderColor: alert.severity === 'error' ? alpha('#d32f2f', 0.2) : 
                             alert.severity === 'warning' ? alpha('#ed6c02', 0.2) : alpha('#0288d1', 0.2),
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  borderColor: alert.severity === 'error' ? alpha('#d32f2f', 0.4) : 
                               alert.severity === 'warning' ? alpha('#ed6c02', 0.4) : alpha('#0288d1', 0.4),
                }
              }}
            >
              <WarningIcon 
                fontSize="small" 
                sx={{ 
                  color: alert.severity === 'error' ? 'error.main' : 
                         alert.severity === 'warning' ? 'warning.main' : 'info.main'
                }} 
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>
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
    <Paper sx={{ 
      p: 2.5, 
      height: '100%',
      borderRadius: 3,
      background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)',
      border: '1px solid',
      borderColor: 'divider',
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ 
            width: 36, 
            height: 36, 
            bgcolor: alpha('#1976d2', 0.1),
          }}>
            <OrderIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          </Avatar>
          <Typography variant="h6" fontWeight={700}>Recent Orders</Typography>
        </Box>
        <IconButton size="small" sx={{ 
          bgcolor: alpha('#1976d2', 0.1),
          '&:hover': { bgcolor: alpha('#1976d2', 0.2) }
        }}>
          <RefreshIcon sx={{ fontSize: 20, color: 'primary.main' }} />
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
    { label: 'Hot Rolled', value: inventory.hotRolled || 0, max: 100, color: '#1976d2' },
    { label: 'Cold Rolled', value: inventory.coldRolled || 0, max: 100, color: '#7b1fa2' },
    { label: 'Galvanized', value: inventory.galvanized || 0, max: 100, color: '#2e7d32' },
    { label: 'Stainless', value: inventory.stainless || 0, max: 100, color: '#ed6c02' },
  ]

  return (
    <Paper sx={{ 
      p: 2.5, 
      height: '100%',
      borderRadius: 3,
      background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)',
      border: '1px solid',
      borderColor: 'divider',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Avatar sx={{ 
          width: 36, 
          height: 36, 
          bgcolor: alpha('#2e7d32', 0.1),
        }}>
          <InventoryIcon sx={{ color: 'success.main', fontSize: 20 }} />
        </Avatar>
        <Typography variant="h6" fontWeight={700}>
          Inventory Overview
        </Typography>
      </Box>
      <Stack spacing={2}>
        {categories.map((cat) => (
          <Box key={cat.label}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" fontWeight={500}>{cat.label}</Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color: cat.color }}>
                {cat.value}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={cat.value}
              sx={{ 
                height: 10, 
                borderRadius: 5,
                bgcolor: alpha(cat.color, 0.15),
                '& .MuiLinearProgress-bar': {
                  bgcolor: cat.color,
                  borderRadius: 5,
                }
              }}
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
    <Box sx={{ 
      minHeight: 'calc(100vh - 64px)',
      background: 'linear-gradient(180deg, #f0f4f8 0%, #e8edf3 100%)',
      mx: -3,
      mt: -3,
      px: 3,
      pt: 0,
      pb: 3,
    }}>
      {/* Modern Header */}
      <Box sx={{ 
        mx: -3,
        px: 3,
        py: 3,
        mb: 3,
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3d7ab5 100%)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(30, 58, 95, 0.3)',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              width: 56, 
              height: 56, 
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
            }}>
              <DashboardIcon sx={{ fontSize: 30 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
                Dashboard
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <AIIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  Real-time insights • AI-powered analytics
                </Typography>
              </Stack>
            </Box>
          </Box>
          <Chip 
            label="Last updated: Just now" 
            size="small" 
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.15)',
              color: 'white',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          />
        </Box>
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
