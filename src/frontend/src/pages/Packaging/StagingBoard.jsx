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
  TextField,
  InputAdornment,
  IconButton,
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
  Avatar,
  Tooltip,
  LinearProgress,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  LocalShipping,
  Dock,
  Warning,
  CheckCircle,
  Schedule,
  QrCode2,
  DragIndicator,
  ArrowForward,
  Inventory2,
  Person,
  AccessTime,
  LocationOn,
} from '@mui/icons-material';

// Mock Dock Assignments
const docks = [
  {
    id: 'DOCK-01',
    name: 'Dock 1 - Flatbed',
    type: 'FLATBED',
    status: 'LOADING',
    carrier: 'FastFreight Trucking',
    driver: 'John Davis',
    truckId: 'FFT-4521',
    scheduledTime: '2:00 PM',
    assignedOrders: ['ORD-2026-1234', 'ORD-2026-1236'],
    packages: [
      { id: 'PKG-2026-000042', weight: 2450, status: 'LOADED', customer: 'Aerospace Dynamics' },
      { id: 'PKG-2026-000043', weight: 1800, status: 'LOADING', customer: 'Aerospace Dynamics' },
    ],
    totalWeight: 4250,
    maxWeight: 48000,
  },
  {
    id: 'DOCK-02',
    name: 'Dock 2 - Box Truck',
    type: 'BOX_TRUCK',
    status: 'READY',
    carrier: 'Regional Express',
    driver: null,
    truckId: null,
    scheduledTime: '3:30 PM',
    assignedOrders: ['ORD-2026-1238'],
    packages: [],
    totalWeight: 0,
    maxWeight: 26000,
  },
  {
    id: 'DOCK-03',
    name: 'Dock 3 - LTL',
    type: 'LTL',
    status: 'AVAILABLE',
    carrier: null,
    driver: null,
    truckId: null,
    scheduledTime: null,
    assignedOrders: [],
    packages: [],
    totalWeight: 0,
    maxWeight: 10000,
  },
  {
    id: 'DOCK-04',
    name: 'Dock 4 - Customer Pickup',
    type: 'WILL_CALL',
    status: 'WAITING',
    carrier: 'Customer',
    driver: 'Expected: Mike Thompson',
    truckId: null,
    scheduledTime: '4:00 PM',
    assignedOrders: ['ORD-2026-1240'],
    packages: [
      { id: 'PKG-2026-000050', weight: 850, status: 'STAGED', customer: 'Thompson Fab' },
    ],
    totalWeight: 850,
    maxWeight: 10000,
  },
];

// Packages in staging area (not yet assigned to dock)
const stagedPackages = [
  {
    id: 'PKG-2026-000051',
    orderId: 'ORD-2026-1241',
    customer: 'Marine Systems Corp',
    material: '316SS Sheet',
    weight: 3200,
    pieces: 8,
    qcReleasedAt: '2026-02-04 11:30 AM',
    priority: 'RUSH',
    readyForShipment: true,
    shipBy: '2026-02-04',
    carrier: 'FastFreight Trucking',
  },
  {
    id: 'PKG-2026-000052',
    orderId: 'ORD-2026-1242',
    customer: 'Industrial Parts LLC',
    material: '1018 Steel Bar',
    weight: 1500,
    pieces: 24,
    qcReleasedAt: '2026-02-04 11:45 AM',
    priority: 'STANDARD',
    readyForShipment: true,
    shipBy: '2026-02-05',
    carrier: 'Regional Express',
  },
  {
    id: 'PKG-2026-000053',
    orderId: 'ORD-2026-1243',
    customer: 'AutoMax Manufacturing',
    material: 'Aluminum 6061',
    weight: 2800,
    pieces: 15,
    qcReleasedAt: '2026-02-04 12:00 PM',
    priority: 'HOT',
    readyForShipment: true,
    shipBy: '2026-02-04',
    carrier: 'FastFreight Trucking',
  },
];

const StagingBoard = () => {
  const [selectedDock, setSelectedDock] = useState(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const getDockStatusColor = (status) => {
    const colors = {
      'LOADING': 'warning',
      'READY': 'success',
      'AVAILABLE': 'default',
      'WAITING': 'info',
      'CLOSED': 'error',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'HOT': 'error',
      'RUSH': 'warning',
      'STANDARD': 'default',
    };
    return colors[priority] || 'default';
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Staging & Dock Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage package staging, dock assignments, and loading operations
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip 
            icon={<Schedule />}
            label={`Today: ${new Date().toLocaleDateString()}`}
            variant="outlined"
          />
          <Button variant="outlined" startIcon={<LocalShipping />}>
            Carrier Schedule
          </Button>
        </Box>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'warning.light' }}>
                <Inventory2 />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {stagedPackages.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Packages in Staging
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'success.light' }}>
                <Dock />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {docks.filter(d => d.status !== 'AVAILABLE').length} / {docks.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active Docks
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'info.light' }}>
                <LocalShipping />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  3
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Shipments Today
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'error.light' }}>
                <Warning />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  2
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Rush Shipments
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Staging Area */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Staging Area
              </Typography>
              <Chip 
                label={`${stagedPackages.length} packages`}
                size="small"
                color="warning"
              />
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Drag packages to assign to a dock
            </Typography>

            <List sx={{ maxHeight: 500, overflow: 'auto' }}>
              {stagedPackages.map((pkg) => (
                <Card 
                  key={pkg.id} 
                  variant="outlined" 
                  sx={{ 
                    mb: 1, 
                    cursor: 'grab',
                    '&:hover': { boxShadow: 2 },
                    borderLeft: '4px solid',
                    borderLeftColor: getPriorityColor(pkg.priority) + '.main',
                  }}
                  onClick={() => {
                    setSelectedPackage(pkg);
                    setShowAssignDialog(true);
                  }}
                >
                  <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <DragIndicator fontSize="small" color="disabled" />
                      <Typography variant="body2" fontWeight={600}>
                        {pkg.id}
                      </Typography>
                      <Box sx={{ flexGrow: 1 }} />
                      <Chip 
                        label={pkg.priority}
                        size="small"
                        color={getPriorityColor(pkg.priority)}
                      />
                    </Box>
                    <Typography variant="caption" display="block">
                      {pkg.customer}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {pkg.material} • {pkg.pieces} pcs • {pkg.weight.toLocaleString()} lbs
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <AccessTime fontSize="inherit" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        Ship by: {pkg.shipBy}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Dock Board */}
        <Grid item xs={12} md={8}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Dock Assignments
          </Typography>
          <Grid container spacing={2}>
            {docks.map((dock) => (
              <Grid item xs={12} md={6} key={dock.id}>
                <Paper 
                  sx={{ 
                    p: 2,
                    border: '2px solid',
                    borderColor: getDockStatusColor(dock.status) + '.main',
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 3 }
                  }}
                  onClick={() => {
                    setSelectedDock(dock);
                    if (!dock.driver && dock.status === 'READY') {
                      setShowCheckInDialog(true);
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {dock.name}
                      </Typography>
                      <Chip 
                        label={dock.type.replace('_', ' ')}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Chip 
                      label={dock.status}
                      size="small"
                      color={getDockStatusColor(dock.status)}
                    />
                  </Box>

                  {dock.carrier && (
                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocalShipping fontSize="small" color="action" />
                        <Typography variant="body2">
                          {dock.carrier}
                        </Typography>
                      </Box>
                      {dock.driver && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person fontSize="small" color="action" />
                          <Typography variant="body2">
                            {dock.driver} {dock.truckId && `(${dock.truckId})`}
                          </Typography>
                        </Box>
                      )}
                      {dock.scheduledTime && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Schedule fontSize="small" color="action" />
                          <Typography variant="body2">
                            Scheduled: {dock.scheduledTime}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {dock.packages.length > 0 && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Packages ({dock.packages.length}):
                      </Typography>
                      {dock.packages.map((pkg) => (
                        <Box 
                          key={pkg.id}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            bgcolor: 'grey.100',
                            borderRadius: 1,
                            px: 1,
                            py: 0.5,
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="caption" fontWeight={500}>
                            {pkg.id}
                          </Typography>
                          <Chip 
                            label={pkg.status}
                            size="small"
                            color={pkg.status === 'LOADED' ? 'success' : 'warning'}
                          />
                        </Box>
                      ))}
                    </>
                  )}

                  {dock.maxWeight > 0 && (
                    <>
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">
                            Weight Capacity
                          </Typography>
                          <Typography variant="caption">
                            {dock.totalWeight.toLocaleString()} / {dock.maxWeight.toLocaleString()} lbs
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate"
                          value={(dock.totalWeight / dock.maxWeight) * 100}
                          color={dock.totalWeight / dock.maxWeight > 0.9 ? 'error' : 'primary'}
                          sx={{ height: 6, borderRadius: 1 }}
                        />
                      </Box>
                    </>
                  )}

                  {dock.status === 'AVAILABLE' && (
                    <Button 
                      fullWidth 
                      variant="outlined"
                      sx={{ mt: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDock(dock);
                        setShowCheckInDialog(true);
                      }}
                    >
                      Assign Carrier
                    </Button>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Assign Package to Dock Dialog */}
      <Dialog open={showAssignDialog} onClose={() => setShowAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Package to Dock</DialogTitle>
        <DialogContent>
          {selectedPackage && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={500}>
                  {selectedPackage.id}
                </Typography>
                <Typography variant="caption">
                  {selectedPackage.customer} • {selectedPackage.weight.toLocaleString()} lbs
                </Typography>
              </Alert>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Assign to Dock</InputLabel>
                <Select label="Assign to Dock" defaultValue="">
                  {docks.filter(d => d.status !== 'CLOSED').map(dock => (
                    <MenuItem key={dock.id} value={dock.id}>
                      {dock.name} - {dock.status}
                      {dock.carrier && ` (${dock.carrier})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                placeholder="Special handling instructions..."
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAssignDialog(false)}>Cancel</Button>
          <Button 
            variant="contained"
            startIcon={<ArrowForward />}
            onClick={() => {
              setShowAssignDialog(false);
              alert('Package assigned to dock!');
            }}
          >
            Assign to Dock
          </Button>
        </DialogActions>
      </Dialog>

      {/* Carrier Check-In Dialog */}
      <Dialog open={showCheckInDialog} onClose={() => setShowCheckInDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Carrier Check-In</DialogTitle>
        <DialogContent>
          {selectedDock && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Checking in carrier for <strong>{selectedDock.name}</strong>
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Carrier</InputLabel>
                    <Select label="Carrier" defaultValue="">
                      <MenuItem value="fastfreight">FastFreight Trucking</MenuItem>
                      <MenuItem value="regional">Regional Express</MenuItem>
                      <MenuItem value="ltl">LTL Consolidated</MenuItem>
                      <MenuItem value="customer">Customer Pickup</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Driver Name" />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Driver License #" />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Truck ID / Plate" />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Trailer #" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="BOL Reference" />
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCheckInDialog(false)}>Cancel</Button>
          <Button 
            variant="contained"
            startIcon={<CheckCircle />}
            onClick={() => {
              setShowCheckInDialog(false);
              alert('Carrier checked in!');
            }}
          >
            Complete Check-In
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StagingBoard;
