/**
 * Packaging Queue - Jobs/Items Ready for Packaging
 * Lists items that have completed production and need to be packaged
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Grid,
  Badge,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  QrCode as QrCodeIcon,
  Inventory2 as PackageIcon,
  Inventory as InventoryIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  PlayArrow as PlayArrowIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

// Mock data for ready-to-package items
const mockPackagingItems = [
  {
    id: '1',
    jobNumber: 'JOB-2024-0512',
    orderNumber: 'ORD-2024-0834',
    customer: 'ABC Steel Corp',
    product: '1/2" HR Plate 48x96',
    quantity: 25,
    unit: 'pcs',
    weight: '5,250 lbs',
    heatNumber: 'H-23456',
    completedAt: '2024-01-15 14:30',
    priority: 'HIGH',
    shipDate: '2024-01-17',
    packagingType: 'BUNDLE',
    status: 'READY',
    location: 'Production Bay A',
  },
  {
    id: '2',
    jobNumber: 'JOB-2024-0508',
    orderNumber: 'ORD-2024-0829',
    customer: 'XYZ Manufacturing',
    product: '3/8" CR Sheet 36x72',
    quantity: 50,
    unit: 'pcs',
    weight: '3,800 lbs',
    heatNumber: 'H-23451',
    completedAt: '2024-01-15 13:15',
    priority: 'NORMAL',
    shipDate: '2024-01-18',
    packagingType: 'SKID',
    status: 'READY',
    location: 'Production Bay B',
  },
  {
    id: '3',
    jobNumber: 'JOB-2024-0515',
    orderNumber: 'ORD-2024-0841',
    customer: 'Delta Fabrication',
    product: '1" HR Round Bar',
    quantity: 100,
    unit: 'pcs',
    weight: '1,200 lbs',
    heatNumber: 'H-23462',
    completedAt: '2024-01-15 15:45',
    priority: 'RUSH',
    shipDate: '2024-01-16',
    packagingType: 'BUNDLE',
    status: 'READY',
    location: 'Production Bay C',
  },
  {
    id: '4',
    jobNumber: 'JOB-2024-0499',
    orderNumber: 'ORD-2024-0812',
    customer: 'Metro Builders',
    product: '2" Angle Iron 6"x6"',
    quantity: 200,
    unit: 'ft',
    weight: '4,100 lbs',
    heatNumber: 'H-23445',
    completedAt: '2024-01-15 11:00',
    priority: 'LOW',
    shipDate: '2024-01-20',
    packagingType: 'BUNDLE',
    status: 'IN_PROGRESS',
    location: 'Staging Area',
  },
];

const priorityColors = {
  RUSH: 'error',
  HIGH: 'warning',
  NORMAL: 'primary',
  LOW: 'default',
};

const statusColors = {
  READY: 'success',
  IN_PROGRESS: 'warning',
  BLOCKED: 'error',
  COMPLETED: 'default',
};

export default function PackagingQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [createPackageOpen, setCreatePackageOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadPackagingQueue();
  }, []);

  const loadPackagingQueue = async () => {
    setLoading(true);
    try {
      // In real implementation, fetch from API
      // const response = await fetch('/api/drop-tags/packages/ready');
      // const data = await response.json();
      setTimeout(() => {
        setItems(mockPackagingItems);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading packaging queue:', error);
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'ALL' || item.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const handleStartPackaging = (item) => {
    setSelectedItem(item);
    setCreatePackageOpen(true);
  };

  const handleCreatePackage = async () => {
    // Create package and generate drop tag
    console.log('Creating package for:', selectedItem);
    setCreatePackageOpen(false);
    setSelectedItem(null);
  };

  // Stats
  const stats = {
    ready: items.filter((i) => i.status === 'READY').length,
    inProgress: items.filter((i) => i.status === 'IN_PROGRESS').length,
    rush: items.filter((i) => i.priority === 'RUSH').length,
    totalWeight: items.reduce((sum, i) => sum + parseInt(i.weight.replace(/[^0-9]/g, '')), 0),
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            <InventoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Packaging Queue
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Jobs ready for packaging and drop tag generation
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadPackagingQueue}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<QrCodeIcon />}
            onClick={() => window.location.href = '/drop-tags/print-center'}
          >
            Print Center
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" fontWeight="bold" color="success.main">
                    {stats.ready}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ready to Package
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 48, color: 'success.light' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" fontWeight="bold" color="warning.main">
                    {stats.inProgress}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Progress
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 48, color: 'warning.light' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" fontWeight="bold" color="error.main">
                    {stats.rush}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rush Orders
                  </Typography>
                </Box>
                <Badge badgeContent="!" color="error">
                  <WarningIcon sx={{ fontSize: 48, color: 'error.light' }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" fontWeight="bold">
                    {stats.totalWeight.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Weight (lbs)
                  </Typography>
                </Box>
                <PackageIcon sx={{ fontSize: 48, color: 'grey.400' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search jobs, orders, customers..."
            size="small"
            sx={{ minWidth: 300 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={filterPriority}
              label="Priority"
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <MenuItem value="ALL">All Priorities</MenuItem>
              <MenuItem value="RUSH">Rush</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="NORMAL">Normal</MenuItem>
              <MenuItem value="LOW">Low</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Queue Table */}
      {loading ? (
        <LinearProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell>Job / Order</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Product</TableCell>
                <TableCell align="right">Qty / Weight</TableCell>
                <TableCell>Heat #</TableCell>
                <TableCell>Ship Date</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No items in packaging queue
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{
                      backgroundColor:
                        item.priority === 'RUSH'
                          ? 'error.50'
                          : item.priority === 'HIGH'
                          ? 'warning.50'
                          : 'inherit',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {item.jobNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.customer}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.product}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.packagingType}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {item.quantity} {item.unit}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.weight}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.heatNumber} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={
                          new Date(item.shipDate) <= new Date()
                            ? 'error.main'
                            : 'text.primary'
                        }
                      >
                        {item.shipDate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.priority}
                        size="small"
                        color={priorityColors[item.priority]}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.status.replace('_', ' ')}
                        size="small"
                        color={statusColors[item.status]}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Start Packaging">
                        <IconButton
                          color="primary"
                          onClick={() => handleStartPackaging(item)}
                          disabled={item.status !== 'READY'}
                        >
                          <PlayArrowIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <SearchIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Package Dialog */}
      <Dialog open={createPackageOpen} onClose={() => setCreatePackageOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Package & Generate Drop Tag</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                This will create a package and generate a drop tag for printing.
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Job Number</Typography>
                  <Typography variant="body1" fontWeight="bold">{selectedItem.jobNumber}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Order Number</Typography>
                  <Typography variant="body1">{selectedItem.orderNumber}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Product</Typography>
                  <Typography variant="body1">{selectedItem.product}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Quantity</Typography>
                  <Typography variant="body1">{selectedItem.quantity} {selectedItem.unit}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Weight</Typography>
                  <Typography variant="body1">{selectedItem.weight}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Package Type</InputLabel>
                    <Select defaultValue={selectedItem.packagingType} label="Package Type">
                      <MenuItem value="BUNDLE">Bundle</MenuItem>
                      <MenuItem value="SKID">Skid</MenuItem>
                      <MenuItem value="CRATE">Crate</MenuItem>
                      <MenuItem value="PALLET">Pallet</MenuItem>
                      <MenuItem value="SINGLE">Single Piece</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreatePackageOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<QrCodeIcon />}
            onClick={handleCreatePackage}
          >
            Create & Generate Tag
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
