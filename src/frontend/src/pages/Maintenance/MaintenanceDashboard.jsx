import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  LinearProgress,
  Divider,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
} from '@mui/material';
import {
  Build,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  TrendingUp,
  TrendingDown,
  AccessTime,
  Settings,
  Schedule,
  Refresh,
  Add,
  Visibility,
  LocalShipping,
  Inventory,
  PriorityHigh,
  Engineering,
  Construction,
} from '@mui/icons-material';

// Stat Card Component
const MetricCard = ({ title, value, subtitle, trend, trendValue, color, icon: Icon, onClick }) => (
  <Card sx={{ height: '100%', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Avatar sx={{ bgcolor: `${color}.light`, width: 40, height: 40 }}>
          <Icon sx={{ color: `${color}.main` }} />
        </Avatar>
      </Box>
      <Typography variant="h4" sx={{ color: `${color}.main`, fontWeight: 700, mb: 0.5 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {subtitle}
        </Typography>
      )}
      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {trend === 'up' ? (
            <TrendingUp fontSize="small" color="success" />
          ) : (
            <TrendingDown fontSize="small" color="error" />
          )}
          <Typography variant="caption" color="text.secondary">
            {trendValue}
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

// Mock Data
const todaysWorkOrders = [
  { 
    id: 'WO-2026-0892', 
    asset: 'SAW-02', 
    assetName: 'Kalamazoo K10 Cold Saw',
    title: 'Motor overheating - emergency shutdown', 
    type: 'BREAKDOWN', 
    status: 'IN_PROGRESS', 
    priority: 'EMERGENCY',
    technician: 'Mike Johnson',
    startedAt: '8:45 AM',
  },
  { 
    id: 'WO-2026-0891', 
    asset: 'FORKLIFT-03', 
    assetName: 'Yale GP050',
    title: 'Weekly PM - General inspection', 
    type: 'PM', 
    status: 'SCHEDULED', 
    priority: 'NORMAL',
    technician: 'Tom Davis',
    startedAt: null,
  },
  { 
    id: 'WO-2026-0890', 
    asset: 'ROUTER-01', 
    assetName: 'Thermwood Model 43',
    title: 'Spindle vibration - abnormal noise', 
    type: 'CORRECTIVE', 
    status: 'WAITING_PARTS', 
    priority: 'HIGH',
    technician: 'Sarah Williams',
    startedAt: null,
  },
  { 
    id: 'WO-2026-0889', 
    asset: 'CRANE-01', 
    assetName: 'Overhead Bridge Crane 10T',
    title: 'Annual load test certification', 
    type: 'PM', 
    status: 'SCHEDULED', 
    priority: 'NORMAL',
    technician: 'External Contractor',
    startedAt: null,
  },
];

const overduePMs = [
  { asset: 'SHEAR-01', name: 'LVD PPEB-8 Press Brake', pmName: 'Monthly Hydraulic Inspection', dueDate: 'Feb 1', daysOverdue: 3 },
  { asset: 'CRANE-02', name: 'Jib Crane 2T', pmName: 'Quarterly Safety Certification', dueDate: 'Jan 31', daysOverdue: 4 },
];

const assetsDown = [
  { asset: 'SAW-02', name: 'Kalamazoo K10', reason: 'Motor overheating', downSince: '8:30 AM', estimatedRepair: '2 hours' },
  { asset: 'FORKLIFT-05', name: 'Toyota 8FGU25', reason: 'Transmission issue', downSince: 'Yesterday', estimatedRepair: 'Awaiting parts' },
];

const partsLowStock = [
  { partNumber: 'BL-14BM', name: 'Saw Blade 14in Bi-Metal', stock: 2, reorderPoint: 5, onOrder: 10 },
  { partNumber: 'HF-4500', name: 'Hydraulic Filter HF-4500', stock: 0, reorderPoint: 2, onOrder: 0 },
  { partNumber: 'BRG-6205', name: 'Bearing 6205-2RS', stock: 3, reorderPoint: 5, onOrder: 0 },
];

const downtimeByAsset = [
  { asset: 'SAW-02', hours: 4.5, percentage: 45 },
  { asset: 'FORKLIFT-05', hours: 8.0, percentage: 80 },
  { asset: 'ROUTER-01', hours: 1.5, percentage: 15 },
  { asset: 'LATHE-01', hours: 0.5, percentage: 5 },
];

const MaintenanceDashboard = () => {
  const [lastRefresh] = useState(new Date().toLocaleTimeString());

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'EMERGENCY': return 'error';
      case 'HIGH': return 'warning';
      case 'NORMAL': return 'primary';
      case 'LOW': return 'default';
      default: return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'BREAKDOWN': return 'error';
      case 'CORRECTIVE': return 'warning';
      case 'PM': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'IN_PROGRESS': return 'info';
      case 'SCHEDULED': return 'default';
      case 'WAITING_PARTS': return 'warning';
      case 'COMPLETED': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'IN_PROGRESS': return 'In Progress';
      case 'SCHEDULED': return 'Scheduled';
      case 'WAITING_PARTS': return 'Waiting Parts';
      case 'COMPLETED': return 'Completed';
      default: return status;
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Maintenance Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Equipment reliability and work order management
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastRefresh}
          </Typography>
          <IconButton size="small">
            <Refresh />
          </IconButton>
          <Button variant="contained" startIcon={<Add />}>
            New Work Order
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {assetsDown.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }} icon={<ErrorIcon />}>
          <strong>BREAKDOWN:</strong> {assetsDown[0].asset} ({assetsDown[0].name}) reported down - {assetsDown[0].reason}. 
          Technician en route. Est. repair: {assetsDown[0].estimatedRepair}
        </Alert>
      )}
      {overduePMs.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<Schedule />}>
          <strong>{overduePMs.length} PM work orders are overdue</strong> - Immediate attention required
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Work Orders"
            value="12"
            subtitle="4 high priority"
            color="primary"
            icon={Build}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="PM Compliance (MTD)"
            value="94%"
            subtitle="Target: 95%"
            trend="up"
            trendValue="+2% vs last month"
            color="success"
            icon={CheckCircle}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Assets Down"
            value={assetsDown.length}
            subtitle={assetsDown.map(a => a.asset).join(', ')}
            color="error"
            icon={Warning}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg MTTR"
            value="2.4h"
            subtitle="Mean Time to Repair"
            trend="down"
            trendValue="↓ 15% vs last month"
            color="info"
            icon={AccessTime}
          />
        </Grid>
      </Grid>

      {/* Secondary Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg MTBF"
            value="168h"
            subtitle="Mean Time Between Failures"
            color="success"
            icon={TrendingUp}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Breakdown WOs (MTD)"
            value="8"
            subtitle="Target: < 10"
            color="warning"
            icon={Construction}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Pending Parts"
            value="3"
            subtitle="WOs waiting for parts"
            color="warning"
            icon={LocalShipping}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Technicians Available"
            value="4 / 5"
            subtitle="1 on external job"
            color="info"
            icon={Engineering}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Today's Work Orders */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Today's Work Orders
              </Typography>
              <Button size="small">View All</Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>WO Number</TableCell>
                    <TableCell>Asset / Description</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Technician</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todaysWorkOrders.map((wo) => (
                    <TableRow key={wo.id} hover sx={{ cursor: 'pointer' }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="primary.main">
                          {wo.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{wo.asset}</Typography>
                        <Typography variant="caption" color="text.secondary">{wo.title}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={wo.type} size="small" color={getTypeColor(wo.type)} />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={wo.priority} 
                          size="small" 
                          color={getPriorityColor(wo.priority)}
                          icon={wo.priority === 'EMERGENCY' ? <PriorityHigh /> : undefined}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={getStatusLabel(wo.status)} size="small" color={getStatusColor(wo.status)} variant="outlined" />
                      </TableCell>
                      <TableCell>{wo.technician}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Overdue PMs */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Warning color="warning" />
              <Typography variant="h6" fontWeight={600} color="warning.main">
                Overdue PMs
              </Typography>
              <Chip label={overduePMs.length} size="small" color="warning" />
            </Box>
            {overduePMs.length === 0 ? (
              <Alert severity="success">All PMs are on schedule!</Alert>
            ) : (
              <List disablePadding>
                {overduePMs.map((pm, index) => (
                  <ListItem 
                    key={pm.asset}
                    sx={{ 
                      bgcolor: 'warning.lighter', 
                      borderRadius: 1, 
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'warning.light',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        <Settings />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={600}>
                          {pm.asset} - {pm.pmName}
                        </Typography>
                      }
                      secondary={`Due: ${pm.dueDate} (${pm.daysOverdue} days overdue)`}
                    />
                    <ListItemSecondaryAction>
                      <Button size="small" variant="contained" color="warning">
                        Create WO
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Assets Currently Down */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ErrorIcon color="error" />
              <Typography variant="h6" fontWeight={600}>
                Assets Currently Down
              </Typography>
            </Box>
            {assetsDown.length === 0 ? (
              <Alert severity="success">All assets are operational!</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Asset</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Down Since</TableCell>
                      <TableCell>Est. Repair</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assetsDown.map((asset) => (
                      <TableRow key={asset.asset}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="error.main">
                            {asset.asset}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">{asset.name}</Typography>
                        </TableCell>
                        <TableCell>{asset.reason}</TableCell>
                        <TableCell>{asset.downSince}</TableCell>
                        <TableCell>{asset.estimatedRepair}</TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="outlined">
                            View WO
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Downtime This Week */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Downtime This Week (Hours)
            </Typography>
            {downtimeByAsset.map((item) => (
              <Box key={item.asset} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={500}>{item.asset}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.hours} hrs</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={item.percentage} 
                  color={item.percentage > 50 ? 'error' : item.percentage > 25 ? 'warning' : 'primary'} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            ))}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" fontWeight={600}>Total Downtime</Typography>
              <Typography variant="body2" fontWeight={600}>14.5 hours</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Parts Low Stock */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Inventory color="warning" />
                <Typography variant="h6" fontWeight={600}>
                  Parts Below Reorder Point
                </Typography>
              </Box>
              <Button size="small">View Inventory</Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Part Number</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="center">Current Stock</TableCell>
                    <TableCell align="center">Reorder Point</TableCell>
                    <TableCell align="center">On Order</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {partsLowStock.map((part) => (
                    <TableRow key={part.partNumber}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{part.partNumber}</Typography>
                      </TableCell>
                      <TableCell>{part.name}</TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="body2" 
                          fontWeight={600}
                          color={part.stock === 0 ? 'error.main' : 'warning.main'}
                        >
                          {part.stock}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{part.reorderPoint}</TableCell>
                      <TableCell align="center">{part.onOrder || '—'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={part.stock === 0 ? 'Out of Stock' : 'Low Stock'} 
                          size="small" 
                          color={part.stock === 0 ? 'error' : 'warning'} 
                        />
                      </TableCell>
                      <TableCell align="right">
                        {part.onOrder === 0 && (
                          <Button size="small" variant="outlined" color="primary">
                            Order
                          </Button>
                        )}
                        {part.onOrder > 0 && (
                          <Typography variant="caption" color="success.main">On Order ({part.onOrder})</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MaintenanceDashboard;
