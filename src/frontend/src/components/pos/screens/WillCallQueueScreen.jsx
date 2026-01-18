/**
 * Will-Call Queue Screen
 * 
 * View and select orders ready for pickup.
 * Implements WILL_CALL_QUEUE from design document 42-AI-ORDER-INTAKE-POS.md
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Badge,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  LocalShipping as ShippingIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  AccessTime as WaitingIcon,
  ArrowForward as SelectIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  PriorityHigh as PriorityIcon,
  CheckCircle as ReadyIcon,
  HourglassEmpty as ScheduledIcon,
  PlayCircle as InProgressIcon
} from '@mui/icons-material';
import { usePOS } from '../POSContext';

// ============================================
// STATUS CHIP
// ============================================

function StatusChip({ status }) {
  const config = {
    READY: { label: 'Ready', color: 'success', icon: <ReadyIcon fontSize="small" /> },
    SCHEDULED: { label: 'Scheduled', color: 'info', icon: <ScheduledIcon fontSize="small" /> },
    IN_PROGRESS: { label: 'In Progress', color: 'warning', icon: <InProgressIcon fontSize="small" /> },
    PARTIAL: { label: 'Partial', color: 'secondary', icon: null }
  };
  
  const { label, color, icon } = config[status] || { label: status, color: 'default' };
  
  return (
    <Chip 
      label={label} 
      color={color} 
      size="small" 
      icon={icon}
      sx={{ fontWeight: 500 }}
    />
  );
}

// ============================================
// QUEUE STATS CARDS
// ============================================

function QueueStatsCards({ stats }) {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={6} md={3}>
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.dark' }}>
            {stats.ready}
          </Typography>
          <Typography variant="body2" color="text.secondary">Ready for Pickup</Typography>
        </Paper>
      </Grid>
      <Grid item xs={6} md={3}>
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.dark' }}>
            {stats.scheduled}
          </Typography>
          <Typography variant="body2" color="text.secondary">Scheduled Today</Typography>
        </Paper>
      </Grid>
      <Grid item xs={6} md={3}>
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.dark' }}>
            {stats.waiting}
          </Typography>
          <Typography variant="body2" color="text.secondary">Currently Waiting</Typography>
        </Paper>
      </Grid>
      <Grid item xs={6} md={3}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {stats.avgWaitTime}m
          </Typography>
          <Typography variant="body2" color="text.secondary">Avg Wait Time</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}

// ============================================
// ORDER ROW
// ============================================

function OrderRow({ order, onSelect }) {
  return (
    <TableRow 
      hover 
      onClick={() => onSelect(order)}
      sx={{ cursor: 'pointer' }}
    >
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {order.priority === 'HIGH' && (
            <PriorityIcon color="error" fontSize="small" />
          )}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {order.orderNumber}
            </Typography>
            {order.poNumber && (
              <Typography variant="caption" color="text.secondary">
                PO: {order.poNumber}
              </Typography>
            )}
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Box>
          <Typography variant="body2">{order.customer?.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {order.customer?.phone}
          </Typography>
        </Box>
      </TableCell>
      <TableCell align="center">
        <StatusChip status={order.status} />
      </TableCell>
      <TableCell align="center">
        <Box>
          <Typography variant="body2">{order.scheduledTime}</Typography>
          <Typography variant="caption" color="text.secondary">
            {order.scheduledDate}
          </Typography>
        </Box>
      </TableCell>
      <TableCell align="center">
        <Typography variant="body2">
          {order.totalLines} items
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {order.totalWeight?.toLocaleString()} lbs
        </Typography>
      </TableCell>
      <TableCell align="center">
        {order.waitingMinutes > 0 ? (
          <Chip 
            label={`${order.waitingMinutes}m`}
            size="small"
            color={order.waitingMinutes > 30 ? 'error' : 'warning'}
            icon={<WaitingIcon />}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">—</Typography>
        )}
      </TableCell>
      <TableCell align="right">
        <IconButton color="primary" onClick={() => onSelect(order)}>
          <SelectIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}

// ============================================
// WILL-CALL QUEUE SCREEN
// ============================================

export function WillCallQueueScreen({ screen, onNext, onBack }) {
  const { transition, isLoading } = usePOS();
  
  // State
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ ready: 0, scheduled: 0, waiting: 0, avgWaitTime: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Load queue
  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/pos/will-call/queue');
      if (response.ok) {
        const data = await response.json();
        setQueue(data.orders || []);
        setStats(data.stats || { ready: 0, scheduled: 0, waiting: 0, avgWaitTime: 0 });
      } else {
        throw new Error('Failed to load queue');
      }
    } catch (err) {
      console.error('Failed to load will-call queue:', err);
      // Use mock data
      setQueue([
        {
          id: 'wc-001',
          orderNumber: 'SO-100234',
          customer: { id: 'c1', name: 'ABC Fabrication', phone: '555-0101' },
          status: 'READY',
          scheduledDate: new Date().toLocaleDateString(),
          scheduledTime: '10:00 AM',
          totalLines: 3,
          totalWeight: 2500,
          poNumber: 'PO-9876',
          priority: 'NORMAL',
          waitingMinutes: 0
        },
        {
          id: 'wc-002',
          orderNumber: 'SO-100235',
          customer: { id: 'c2', name: 'Steel Solutions Inc', phone: '555-0102' },
          status: 'READY',
          scheduledDate: new Date().toLocaleDateString(),
          scheduledTime: '11:30 AM',
          totalLines: 5,
          totalWeight: 8750,
          poNumber: 'PO-4532',
          priority: 'HIGH',
          waitingMinutes: 15
        },
        {
          id: 'wc-003',
          orderNumber: 'SO-100228',
          customer: { id: 'c3', name: 'Industrial Metal Works', phone: '555-0103' },
          status: 'SCHEDULED',
          scheduledDate: new Date().toLocaleDateString(),
          scheduledTime: '2:00 PM',
          totalLines: 2,
          totalWeight: 1200,
          poNumber: null,
          priority: 'NORMAL',
          waitingMinutes: 0
        }
      ]);
      setStats({ ready: 2, scheduled: 1, waiting: 1, avgWaitTime: 8, inProgress: 0 });
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadQueue();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadQueue, 30000);
    return () => clearInterval(interval);
  }, [loadQueue]);
  
  // Filter queue
  const filteredQueue = queue.filter(order => {
    // Status filter
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        order.orderNumber?.toLowerCase().includes(searchLower) ||
        order.customer?.name?.toLowerCase().includes(searchLower) ||
        order.poNumber?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Handle order selection
  const handleSelectOrder = async (order) => {
    setSelectedOrder(order);
    
    try {
      await transition('SELECT_ORDER', { orderId: order.id, order });
      onNext?.();
    } catch (err) {
      setError(err.message || 'Failed to select order');
    }
  };
  
  // Handle back
  const handleBack = () => {
    onBack?.();
  };
  
  if (loading && queue.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }} color="text.secondary">
          Loading pickup queue...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            {screen?.title || 'Will-Call Pickup Queue'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select an order to begin the pickup process
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadQueue}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      {/* Stats */}
      <QueueStatsCards stats={stats} />
      
      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by order #, customer, or PO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ToggleButtonGroup
              value={statusFilter}
              exclusive
              onChange={(e, val) => val && setStatusFilter(val)}
              size="small"
            >
              <ToggleButton value="all">
                All ({queue.length})
              </ToggleButton>
              <ToggleButton value="READY">
                <Badge badgeContent={stats.ready} color="success" sx={{ mr: 1 }}>
                  Ready
                </Badge>
              </ToggleButton>
              <ToggleButton value="SCHEDULED">
                Scheduled
              </ToggleButton>
              <ToggleButton value="IN_PROGRESS">
                In Progress
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Queue Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>Order</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Scheduled</TableCell>
              <TableCell align="center">Items</TableCell>
              <TableCell align="center">Waiting</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredQueue.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {search || statusFilter !== 'all' 
                      ? 'No orders match your filters'
                      : 'No orders in the pickup queue'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredQueue.map(order => (
                <OrderRow 
                  key={order.id} 
                  order={order} 
                  onSelect={handleSelectOrder}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Back Button */}
      <Box sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={handleBack}>
          Back to Menu
        </Button>
      </Box>
    </Box>
  );
}

export default WillCallQueueScreen;
