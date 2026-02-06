/**
 * Staging Board
 * Visual board for staging area management - packages ready to load
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  LinearProgress,
  Tooltip,
  Badge,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocalShipping as TruckIcon,
  Warehouse as WarehouseIcon,
  QrCodeScanner as ScannerIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowIcon,
  Timer as TimerIcon,
  Inventory2 as PackageIcon,
} from '@mui/icons-material';

// Mock staging lanes
const mockLanes = [
  {
    id: 'LANE-A',
    name: 'Lane A',
    shipment: 'SHP-2024-0512',
    customer: 'ABC Steel Corp',
    destination: 'Chicago, IL',
    carrier: 'Standard Freight',
    scheduledDeparture: '2024-01-15 16:00',
    packages: [
      { id: 'DT-20240115-0001', product: '1/2" HR Plate', weight: '3,200 lbs', staged: true, loaded: false },
      { id: 'DT-20240115-0002', product: '3/8" CR Sheet', weight: '2,100 lbs', staged: true, loaded: false },
      { id: 'DT-20240115-0003', product: '1" Round Bar', weight: '1,500 lbs', staged: false, loaded: false },
    ],
    status: 'STAGING',
  },
  {
    id: 'LANE-B',
    name: 'Lane B',
    shipment: 'SHP-2024-0508',
    customer: 'XYZ Manufacturing',
    destination: 'Detroit, MI',
    carrier: 'Express Trucking',
    scheduledDeparture: '2024-01-15 14:00',
    packages: [
      { id: 'DT-20240115-0010', product: '2" Angle Iron', weight: '4,100 lbs', staged: true, loaded: true },
      { id: 'DT-20240115-0011', product: '1/4" HR Plate', weight: '2,800 lbs', staged: true, loaded: true },
    ],
    status: 'LOADING',
    truckArrived: true,
  },
  {
    id: 'LANE-C',
    name: 'Lane C',
    shipment: null,
    customer: null,
    destination: null,
    carrier: null,
    scheduledDeparture: null,
    packages: [],
    status: 'EMPTY',
  },
  {
    id: 'LANE-D',
    name: 'Lane D',
    shipment: 'SHP-2024-0515',
    customer: 'Delta Fabrication',
    destination: 'Pittsburgh, PA',
    carrier: 'Premium Transport',
    scheduledDeparture: '2024-01-15 18:00',
    packages: [
      { id: 'DT-20240115-0020', product: '3/4" HR Plate', weight: '5,600 lbs', staged: true, loaded: false },
    ],
    status: 'READY',
    truckArrived: false,
  },
];

const statusColors = {
  EMPTY: 'default',
  STAGING: 'warning',
  READY: 'success',
  LOADING: 'info',
  DEPARTED: 'default',
};

export default function StagingBoard() {
  const [lanes, setLanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLane, setSelectedLane] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadLanes();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadLanes = async () => {
    setLoading(true);
    try {
      setTimeout(() => {
        setLanes(mockLanes);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading lanes:', error);
      setLoading(false);
    }
  };

  const handleOpenDetails = (lane) => {
    setSelectedLane(lane);
    setDetailsOpen(true);
  };

  const getTimeUntilDeparture = (departure) => {
    if (!departure) return null;
    const depTime = new Date(departure);
    const diff = depTime - currentTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (diff < 0) return 'OVERDUE';
    return `${hours}h ${minutes}m`;
  };

  const getProgressPercent = (packages) => {
    if (packages.length === 0) return 0;
    const staged = packages.filter((p) => p.staged).length;
    return (staged / packages.length) * 100;
  };

  const getLoadedPercent = (packages) => {
    if (packages.length === 0) return 0;
    const loaded = packages.filter((p) => p.loaded).length;
    return (loaded / packages.length) * 100;
  };

  // Stats
  const stats = {
    active: lanes.filter((l) => l.status !== 'EMPTY').length,
    staging: lanes.filter((l) => l.status === 'STAGING').length,
    ready: lanes.filter((l) => l.status === 'READY').length,
    loading: lanes.filter((l) => l.status === 'LOADING').length,
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            <WarehouseIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Staging Board
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time staging lane status • {currentTime.toLocaleTimeString()}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ScannerIcon />}
            onClick={() => window.location.href = '/drop-tags/load'}
          >
            Loading Screen
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadLanes}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight="bold">
                {stats.active}/{lanes.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active Lanes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {stats.staging}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Staging
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.ready}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ready to Load
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight="bold" color="info.main">
                {stats.loading}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Loading Now
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          placeholder="Search by shipment, customer, or tag ID..."
          size="small"
          sx={{ minWidth: 400 }}
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
      </Paper>

      {/* Staging Lanes Grid */}
      {loading ? (
        <LinearProgress />
      ) : (
        <Grid container spacing={3}>
          {lanes.map((lane) => (
            <Grid item xs={12} sm={6} md={3} key={lane.id}>
              <Card
                sx={{
                  height: '100%',
                  borderTop: '4px solid',
                  borderTopColor:
                    lane.status === 'LOADING'
                      ? 'info.main'
                      : lane.status === 'READY'
                      ? 'success.main'
                      : lane.status === 'STAGING'
                      ? 'warning.main'
                      : 'grey.300',
                  cursor: lane.status !== 'EMPTY' ? 'pointer' : 'default',
                  '&:hover': lane.status !== 'EMPTY' ? { boxShadow: 4 } : {},
                }}
                onClick={() => lane.status !== 'EMPTY' && handleOpenDetails(lane)}
              >
                <CardContent>
                  {/* Lane Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" fontWeight="bold">
                      {lane.name}
                    </Typography>
                    <Chip
                      label={lane.status}
                      size="small"
                      color={statusColors[lane.status]}
                    />
                  </Box>

                  {lane.status === 'EMPTY' ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <WarehouseIcon sx={{ fontSize: 48, color: 'grey.300' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Lane Available
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      {/* Shipment Info */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Shipment
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {lane.shipment}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {lane.customer}
                        </Typography>
                      </Box>

                      {/* Destination */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Destination
                        </Typography>
                        <Typography variant="body2" noWrap>
                          {lane.destination}
                        </Typography>
                      </Box>

                      {/* Departure Time */}
                      {lane.scheduledDeparture && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Departure
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TimerIcon fontSize="small" />
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              color={
                                getTimeUntilDeparture(lane.scheduledDeparture) === 'OVERDUE'
                                  ? 'error.main'
                                  : 'text.primary'
                              }
                            >
                              {getTimeUntilDeparture(lane.scheduledDeparture)}
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      {/* Truck Status */}
                      {lane.truckArrived !== undefined && (
                        <Box sx={{ mb: 2 }}>
                          <Chip
                            icon={<TruckIcon />}
                            label={lane.truckArrived ? 'Truck Arrived' : 'Awaiting Truck'}
                            size="small"
                            color={lane.truckArrived ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </Box>
                      )}

                      <Divider sx={{ my: 2 }} />

                      {/* Package Progress */}
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption">
                            Staged: {lane.packages.filter((p) => p.staged).length}/{lane.packages.length}
                          </Typography>
                          <Typography variant="caption">
                            {Math.round(getProgressPercent(lane.packages))}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={getProgressPercent(lane.packages)}
                          sx={{ height: 8, borderRadius: 1, mb: 1 }}
                        />
                        {lane.status === 'LOADING' && (
                          <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="caption">
                                Loaded: {lane.packages.filter((p) => p.loaded).length}/{lane.packages.length}
                              </Typography>
                              <Typography variant="caption">
                                {Math.round(getLoadedPercent(lane.packages))}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={getLoadedPercent(lane.packages)}
                              color="info"
                              sx={{ height: 8, borderRadius: 1 }}
                            />
                          </>
                        )}
                      </Box>

                      {/* Quick Stats */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" fontWeight="bold">
                            {lane.packages.length}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Packages
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" fontWeight="bold">
                            {lane.packages.reduce((sum, p) => sum + parseInt(p.weight.replace(/[^0-9]/g, '')), 0).toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            lbs
                          </Typography>
                        </Box>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Lane Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedLane?.name} - {selectedLane?.shipment}
        </DialogTitle>
        <DialogContent>
          {selectedLane && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Shipment Details
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">Customer</Typography>
                    <Typography variant="body1">{selectedLane.customer}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">Destination</Typography>
                    <Typography variant="body1">{selectedLane.destination}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">Carrier</Typography>
                    <Typography variant="body1">{selectedLane.carrier}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">Scheduled Departure</Typography>
                    <Typography variant="body1">{selectedLane.scheduledDeparture}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Packages in Lane
                  </Typography>
                  {selectedLane.packages.map((pkg) => (
                    <Paper key={pkg.id} variant="outlined" sx={{ p: 2, mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                            {pkg.id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {pkg.product} • {pkg.weight}
                          </Typography>
                        </Box>
                        <Box>
                          <Chip
                            label={pkg.loaded ? 'LOADED' : pkg.staged ? 'STAGED' : 'PENDING'}
                            size="small"
                            color={pkg.loaded ? 'info' : pkg.staged ? 'success' : 'default'}
                          />
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {selectedLane?.status === 'READY' && (
            <Button variant="contained" startIcon={<TruckIcon />}>
              Start Loading
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
