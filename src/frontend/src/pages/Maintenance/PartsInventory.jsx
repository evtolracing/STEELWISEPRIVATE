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
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  LinearProgress,
  Avatar,
  Tooltip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Add,
  Search,
  Inventory,
  ShoppingCart,
  Warning,
  CheckCircle,
  Visibility,
  Edit,
  LocalShipping,
  TrendingDown,
  TrendingUp,
  Build,
  LocationOn,
  QrCode2,
} from '@mui/icons-material';

// Mock Data
const spareParts = [
  {
    id: 'SP-001',
    partNumber: 'BLD-BAND-14',
    name: 'Band Saw Blade 14"',
    category: 'Consumables',
    location: 'MAINT-A1-01',
    currentStock: 8,
    minStock: 5,
    maxStock: 20,
    reorderPoint: 8,
    unitCost: 85.00,
    lastReorder: '2026-01-15',
    status: 'REORDER',
    usedByAssets: ['SAW-01', 'SAW-02'],
    avgMonthlyUsage: 4,
  },
  {
    id: 'SP-002',
    partNumber: 'MTR-5HP-230V',
    name: '5HP Motor 230V 3-Phase',
    category: 'Motors',
    location: 'MAINT-B2-03',
    currentStock: 2,
    minStock: 1,
    maxStock: 4,
    reorderPoint: 2,
    unitCost: 1250.00,
    lastReorder: '2025-11-20',
    status: 'OK',
    usedByAssets: ['SAW-01', 'DRILL-01'],
    avgMonthlyUsage: 0.5,
  },
  {
    id: 'SP-003',
    partNumber: 'FLT-HYD-10M',
    name: 'Hydraulic Filter 10 Micron',
    category: 'Filters',
    location: 'MAINT-A2-05',
    currentStock: 3,
    minStock: 4,
    maxStock: 12,
    reorderPoint: 4,
    unitCost: 45.00,
    lastReorder: '2026-01-08',
    status: 'LOW',
    usedByAssets: ['FORKLIFT-01', 'FORKLIFT-02', 'FORKLIFT-03'],
    avgMonthlyUsage: 3,
  },
  {
    id: 'SP-004',
    partNumber: 'BRG-6205-2RS',
    name: 'Ball Bearing 6205-2RS',
    category: 'Bearings',
    location: 'MAINT-C1-02',
    currentStock: 12,
    minStock: 6,
    maxStock: 24,
    reorderPoint: 8,
    unitCost: 18.50,
    lastReorder: '2025-12-10',
    status: 'OK',
    usedByAssets: ['ROUTER-01', 'ROUTER-02', 'SAW-01'],
    avgMonthlyUsage: 2,
  },
  {
    id: 'SP-005',
    partNumber: 'BLT-V-A68',
    name: 'V-Belt A68',
    category: 'Belts & Chains',
    location: 'MAINT-A3-01',
    currentStock: 0,
    minStock: 4,
    maxStock: 16,
    reorderPoint: 4,
    unitCost: 22.00,
    lastReorder: '2026-02-01',
    orderStatus: 'On Order (ETA: Feb 7)',
    status: 'OUT_OF_STOCK',
    usedByAssets: ['SHEAR-01', 'SAW-03'],
    avgMonthlyUsage: 2,
  },
  {
    id: 'SP-006',
    partNumber: 'OIL-HYD-AW46',
    name: 'Hydraulic Oil AW46 (5 Gal)',
    category: 'Lubricants',
    location: 'MAINT-D1-01',
    currentStock: 6,
    minStock: 4,
    maxStock: 12,
    reorderPoint: 5,
    unitCost: 65.00,
    lastReorder: '2026-01-20',
    status: 'OK',
    usedByAssets: ['All Forklifts', 'Hydraulic Press'],
    avgMonthlyUsage: 2,
  },
  {
    id: 'SP-007',
    partNumber: 'SEN-PROX-NPN',
    name: 'Proximity Sensor NPN NO',
    category: 'Electrical',
    location: 'MAINT-E1-03',
    currentStock: 5,
    minStock: 4,
    maxStock: 10,
    reorderPoint: 5,
    unitCost: 42.00,
    lastReorder: '2025-12-15',
    status: 'REORDER',
    usedByAssets: ['ROUTER-01', 'CNC-01'],
    avgMonthlyUsage: 1.5,
  },
];

const pendingOrders = [
  {
    id: 'PO-2026-0089',
    partNumber: 'BLT-V-A68',
    name: 'V-Belt A68',
    quantity: 10,
    unitCost: 22.00,
    supplier: 'Industrial Supply Co.',
    orderDate: '2026-02-01',
    expectedDate: '2026-02-07',
    status: 'IN_TRANSIT',
  },
  {
    id: 'PO-2026-0088',
    partNumber: 'FLT-HYD-10M',
    name: 'Hydraulic Filter 10 Micron',
    quantity: 8,
    unitCost: 45.00,
    supplier: 'Filter Pro Inc.',
    orderDate: '2026-02-03',
    expectedDate: '2026-02-10',
    status: 'CONFIRMED',
  },
];

const PartsInventory = () => {
  const [tab, setTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPart, setSelectedPart] = useState(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'OK': return 'success';
      case 'REORDER': return 'warning';
      case 'LOW': return 'error';
      case 'OUT_OF_STOCK': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'OK': return 'In Stock';
      case 'REORDER': return 'Reorder';
      case 'LOW': return 'Low Stock';
      case 'OUT_OF_STOCK': return 'Out of Stock';
      default: return status;
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'info';
      case 'IN_TRANSIT': return 'warning';
      case 'DELIVERED': return 'success';
      default: return 'default';
    }
  };

  const filteredParts = spareParts.filter(part => {
    if (tab === 1 && part.status !== 'LOW' && part.status !== 'OUT_OF_STOCK') return false;
    if (tab === 2 && part.status !== 'REORDER') return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return part.name.toLowerCase().includes(query) || 
             part.partNumber.toLowerCase().includes(query) ||
             part.category.toLowerCase().includes(query);
    }
    return true;
  });

  const lowStockCount = spareParts.filter(p => p.status === 'LOW' || p.status === 'OUT_OF_STOCK').length;
  const reorderCount = spareParts.filter(p => p.status === 'REORDER').length;
  const totalValue = spareParts.reduce((acc, p) => acc + (p.currentStock * p.unitCost), 0);
  const uniqueCategories = [...new Set(spareParts.map(p => p.category))].length;

  const getStockLevel = (part) => {
    const percentage = (part.currentStock / part.maxStock) * 100;
    return Math.min(percentage, 100);
  };

  const getStockColor = (part) => {
    if (part.currentStock <= part.minStock) return 'error';
    if (part.currentStock <= part.reorderPoint) return 'warning';
    return 'success';
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Parts Inventory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage maintenance spare parts and reorder inventory
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<LocalShipping />} onClick={() => setShowReceiveDialog(true)}>
            Receive Parts
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setShowOrderDialog(true)}>
            Create Order
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {lowStockCount > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<Warning />}>
          <strong>{lowStockCount} part(s)</strong> are low or out of stock
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.light' }}>
                <Inventory sx={{ color: 'primary.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{spareParts.length}</Typography>
                <Typography variant="body2" color="text.secondary">Total Parts</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'error.light' }}>
                <TrendingDown sx={{ color: 'error.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{lowStockCount}</Typography>
                <Typography variant="body2" color="text.secondary">Low / Out of Stock</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.light' }}>
                <ShoppingCart sx={{ color: 'warning.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{pendingOrders.length}</Typography>
                <Typography variant="body2" color="text.secondary">Pending Orders</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.light' }}>
                <TrendingUp sx={{ color: 'success.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>${totalValue.toLocaleString()}</Typography>
                <Typography variant="body2" color="text.secondary">Inventory Value</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label={`All Parts (${spareParts.length})`} />
          <Tab label={`Low Stock (${lowStockCount})`} />
          <Tab label={`Reorder Needed (${reorderCount})`} />
          <Tab label={`Pending Orders (${pendingOrders.length})`} />
        </Tabs>
      </Paper>

      {/* Search */}
      {tab !== 3 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search parts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select label="Category" defaultValue="">
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Consumables">Consumables</MenuItem>
                  <MenuItem value="Motors">Motors</MenuItem>
                  <MenuItem value="Filters">Filters</MenuItem>
                  <MenuItem value="Bearings">Bearings</MenuItem>
                  <MenuItem value="Belts & Chains">Belts & Chains</MenuItem>
                  <MenuItem value="Lubricants">Lubricants</MenuItem>
                  <MenuItem value="Electrical">Electrical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Location</InputLabel>
                <Select label="Location" defaultValue="">
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="MAINT-A">Aisle A</MenuItem>
                  <MenuItem value="MAINT-B">Aisle B</MenuItem>
                  <MenuItem value="MAINT-C">Aisle C</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Parts Table */}
      {tab !== 3 && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Part Number / Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Stock Level</TableCell>
                  <TableCell>Unit Cost</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredParts.map((part) => (
                  <TableRow 
                    key={part.id} 
                    hover 
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setSelectedPart(part)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{part.partNumber}</Typography>
                      <Typography variant="caption" color="text.secondary">{part.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={part.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2">{part.location}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 80 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={getStockLevel(part)} 
                            color={getStockColor(part)}
                            sx={{ height: 8, borderRadius: 1 }}
                          />
                        </Box>
                        <Typography variant="body2">
                          {part.currentStock} / {part.maxStock}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">${part.unitCost.toFixed(2)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusLabel(part.status)} 
                        size="small" 
                        color={getStatusColor(part.status)} 
                      />
                      {part.orderStatus && (
                        <Typography variant="caption" color="info.main" display="block">
                          {part.orderStatus}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => setSelectedPart(part)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Quick Reorder">
                        <IconButton size="small" color="primary">
                          <ShoppingCart />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Print Label">
                        <IconButton size="small">
                          <QrCode2 />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Pending Orders Tab */}
      {tab === 3 && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>PO Number</TableCell>
                  <TableCell>Part / Description</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Order Date</TableCell>
                  <TableCell>Expected</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingOrders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        {order.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{order.partNumber}</Typography>
                      <Typography variant="caption" color="text.secondary">{order.name}</Typography>
                    </TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>${(order.quantity * order.unitCost).toFixed(2)}</TableCell>
                    <TableCell>{order.supplier}</TableCell>
                    <TableCell>{order.orderDate}</TableCell>
                    <TableCell>{order.expectedDate}</TableCell>
                    <TableCell>
                      <Chip 
                        label={order.status.replace('_', ' ')} 
                        size="small" 
                        color={getOrderStatusColor(order.status)} 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Part Detail Dialog */}
      <Dialog open={!!selectedPart} onClose={() => setSelectedPart(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">{selectedPart?.partNumber}</Typography>
              <Typography variant="body2" color="text.secondary">{selectedPart?.name}</Typography>
            </Box>
            <Chip 
              label={getStatusLabel(selectedPart?.status)} 
              color={getStatusColor(selectedPart?.status)} 
            />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPart && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Stock Information
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Current Stock" secondary={selectedPart.currentStock} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Min / Max" secondary={`${selectedPart.minStock} / ${selectedPart.maxStock}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Reorder Point" secondary={selectedPart.reorderPoint} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Avg Monthly Usage" secondary={`${selectedPart.avgMonthlyUsage} units`} />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Details
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Category" secondary={selectedPart.category} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Location" secondary={selectedPart.location} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Unit Cost" secondary={`$${selectedPart.unitCost.toFixed(2)}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Last Reorder" secondary={selectedPart.lastReorder} />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Used By Assets
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedPart.usedByAssets.map((asset, index) => (
                    <Chip 
                      key={index} 
                      label={asset} 
                      size="small" 
                      icon={<Build />} 
                      variant="outlined" 
                    />
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Stock Level:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={getStockLevel(selectedPart)} 
                      color={getStockColor(selectedPart)}
                      sx={{ height: 12, borderRadius: 1 }}
                    />
                  </Box>
                  <Typography variant="body2">
                    {selectedPart.currentStock} of {selectedPart.maxStock}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPart(null)}>Close</Button>
          <Button variant="outlined" startIcon={<Edit />}>Edit Part</Button>
          <Button variant="contained" startIcon={<ShoppingCart />}>Create Order</Button>
        </DialogActions>
      </Dialog>

      {/* Create Order Dialog */}
      <Dialog open={showOrderDialog} onClose={() => setShowOrderDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Purchase Order</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Part</InputLabel>
                <Select label="Select Part" defaultValue="">
                  {spareParts.map(part => (
                    <MenuItem key={part.id} value={part.id}>
                      {part.partNumber} - {part.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth type="number" label="Quantity" defaultValue={10} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Supplier</InputLabel>
                <Select label="Supplier" defaultValue="">
                  <MenuItem value="supplier1">Industrial Supply Co.</MenuItem>
                  <MenuItem value="supplier2">Filter Pro Inc.</MenuItem>
                  <MenuItem value="supplier3">Parts Direct LLC</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth type="date" label="Expected Delivery" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="PO Reference" placeholder="Auto-generated" disabled />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Notes" placeholder="Special instructions..." />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOrderDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => { setShowOrderDialog(false); alert('Purchase order created!'); }}
          >
            Create Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Receive Parts Dialog */}
      <Dialog open={showReceiveDialog} onClose={() => setShowReceiveDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Receive Parts</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 1, mb: 3 }}>
            Select a pending order to receive or manually enter parts
          </Alert>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Pending Order</InputLabel>
                <Select label="Pending Order" defaultValue="">
                  {pendingOrders.map(order => (
                    <MenuItem key={order.id} value={order.id}>
                      {order.id} - {order.partNumber} ({order.quantity} units)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Divider>OR Manual Entry</Divider>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Part</InputLabel>
                <Select label="Part" defaultValue="">
                  {spareParts.map(part => (
                    <MenuItem key={part.id} value={part.id}>
                      {part.partNumber}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth type="number" label="Quantity Received" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Supplier Invoice #" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Bin Location" placeholder="MAINT-A1-01" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReceiveDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            startIcon={<CheckCircle />}
            onClick={() => { setShowReceiveDialog(false); alert('Parts received and inventory updated!'); }}
          >
            Receive Parts
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PartsInventory;
