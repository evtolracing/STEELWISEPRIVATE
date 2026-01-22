/**
 * Dispatch Planning Screen
 * Comprehensive dispatch planning with route optimization, ETAs, and cost calculations
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  LinearProgress,
  Divider,
  Tooltip,
  Badge,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
} from '@mui/material';
import {
  LocalShipping,
  Route as RouteIcon,
  Schedule,
  AttachMoney,
  Speed,
  CheckCircle,
  Warning,
  Refresh,
  Map as MapIcon,
  Print,
  Send,
  Person,
  Phone,
  LocalGasStation,
  AccessTime,
  Timeline,
  Layers,
  NavigateNext,
  PlayArrow,
  Calculate,
} from '@mui/icons-material';
import MapComponent from '../components/MapComponent';
import DeliveryMapDialog from '../components/logistics/DeliveryMapDialog';
import {
  geocodeAddress,
  getTrafficRoute,
  optimizeRoute,
  getDistanceMatrix,
  calculateFuelCost,
  calculateDeliveryCost,
  estimateDeliveryTime,
} from '../services/mapService';

// Mock data
const MOCK_DRIVERS = [
  { id: 'DRV-001', name: 'John Smith', phone: '(555) 123-4567', truck: 'TRK-101', status: 'available' },
  { id: 'DRV-002', name: 'Sarah Johnson', phone: '(555) 234-5678', truck: 'TRK-102', status: 'available' },
  { id: 'DRV-003', name: 'Mike Williams', phone: '(555) 345-6789', truck: 'TRK-103', status: 'on_route' },
];

const MOCK_READY_SHIPMENTS = [
  {
    id: 'SHIP-001',
    orderNumber: 'SO-2024-0156',
    customer: 'ABC Steel Corp',
    destination: '456 Manufacturing Dr, Detroit, MI 48201',
    coordinates: [-83.0458, 42.3314],
    weight: 28500,
    packages: 3,
    priority: 'HOT',
    dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'SHIP-002',
    orderNumber: 'SO-2024-0157',
    customer: 'Metro Manufacturing',
    destination: '789 Factory Ave, Milwaukee, WI 53202',
    coordinates: [-87.9065, 43.0389],
    weight: 30000,
    packages: 6,
    priority: 'NORMAL',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'SHIP-003',
    orderNumber: 'SO-2024-0158',
    customer: 'Industrial Corp',
    destination: '321 Metal Way, Indianapolis, IN 46201',
    coordinates: [-86.1581, 39.7684],
    weight: 15000,
    packages: 2,
    priority: 'NORMAL',
    dueDate: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'SHIP-004',
    orderNumber: 'SO-2024-0159',
    customer: 'Steel Solutions',
    destination: '555 Welding St, Cleveland, OH 44101',
    coordinates: [-81.6944, 41.4993],
    weight: 22000,
    packages: 4,
    priority: 'HOT',
    dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  },
];

const WAREHOUSE_LOCATION = {
  coordinates: [-87.6298, 41.8781],
  name: 'Main Warehouse',
  address: 'Chicago, IL',
};

export default function DispatchPlanningScreen() {
  const [shipments, setShipments] = useState(MOCK_READY_SHIPMENTS);
  const [selectedShipments, setSelectedShipments] = useState([]);
  const [drivers, setDrivers] = useState(MOCK_DRIVERS);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [routePlan, setRoutePlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedForMap, setSelectedForMap] = useState(null);
  const [distanceMatrix, setDistanceMatrix] = useState(null);

  // Toggle shipment selection
  const handleToggleShipment = (shipmentId) => {
    setSelectedShipments(prev => {
      if (prev.includes(shipmentId)) {
        return prev.filter(id => id !== shipmentId);
      }
      return [...prev, shipmentId];
    });
  };

  // Select all shipments
  const handleSelectAll = () => {
    if (selectedShipments.length === shipments.length) {
      setSelectedShipments([]);
    } else {
      setSelectedShipments(shipments.map(s => s.id));
    }
  };

  // Calculate distance matrix for selected shipments
  const calculateDistanceMatrix = async () => {
    if (selectedShipments.length < 2) return;

    setLoading(true);
    try {
      const selectedData = shipments.filter(s => selectedShipments.includes(s.id));
      const coords = selectedData.map(s => s.coordinates);
      
      const matrix = await getDistanceMatrix(
        [WAREHOUSE_LOCATION.coordinates],
        coords
      );
      
      setDistanceMatrix({
        ...matrix,
        shipments: selectedData,
      });
    } catch (err) {
      setError('Failed to calculate distances');
    } finally {
      setLoading(false);
    }
  };

  // Optimize route for selected shipments
  const handleOptimizeRoute = async () => {
    if (selectedShipments.length < 1) {
      setError('Select at least one shipment to plan a route');
      return;
    }

    setOptimizing(true);
    setError(null);

    try {
      const selectedData = shipments.filter(s => selectedShipments.includes(s.id));
      
      // Build coordinates array (warehouse -> stops -> warehouse return)
      const coords = [
        WAREHOUSE_LOCATION.coordinates,
        ...selectedData.map(s => s.coordinates),
      ];

      let route;
      if (coords.length > 2) {
        // Use optimization API for multiple stops
        route = await optimizeRoute(coords);
      } else {
        // Direct route for single stop
        route = await getTrafficRoute(coords);
        route.waypoint_order = [0, 1];
      }

      // Calculate costs
      const totalWeight = selectedData.reduce((sum, s) => sum + s.weight, 0);
      const fuelCost = calculateFuelCost(route.distance, { mpg: 6 });
      const deliveryCost = calculateDeliveryCost(route.distance, totalWeight);
      
      // Estimate times for each stop
      const departureTime = new Date();
      const timeEstimate = estimateDeliveryTime(route.duration, departureTime);
      
      // Build stop-by-stop ETA
      const stopETAs = [];
      let cumulativeTime = 0;
      const legs = route.legs || [{ duration: route.duration * 60 }];
      
      selectedData.forEach((shipment, idx) => {
        const legDuration = (legs[idx]?.duration || route.duration * 60 / selectedData.length) / 60;
        cumulativeTime += legDuration;
        stopETAs.push({
          ...shipment,
          eta: new Date(departureTime.getTime() + cumulativeTime * 60000),
          legDuration: legDuration,
          stopOrder: idx + 1,
        });
      });

      setRoutePlan({
        route,
        stops: stopETAs,
        totalDistance: route.distance,
        totalDuration: route.duration,
        fuelCost,
        deliveryCost,
        totalWeight,
        departureTime,
        arrivalTime: timeEstimate.arrivalTime,
        optimized: coords.length > 2,
      });

    } catch (err) {
      console.error('Route optimization error:', err);
      setError('Failed to optimize route. Please try again.');
    } finally {
      setOptimizing(false);
    }
  };

  // View single shipment on map
  const handleViewOnMap = (shipment) => {
    setSelectedForMap(shipment);
    setMapDialogOpen(true);
  };

  // Format helpers
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const formatWeight = (lbs) => {
    return lbs >= 1000 ? `${(lbs / 1000).toFixed(1)}k lbs` : `${lbs} lbs`;
  };

  // Map locations for route visualization
  const mapLocations = routePlan ? [
    {
      id: 'warehouse',
      type: 'warehouse',
      coordinates: WAREHOUSE_LOCATION.coordinates,
      name: WAREHOUSE_LOCATION.name,
      address: 'Start/End',
    },
    ...routePlan.stops.map((stop, idx) => ({
      id: stop.id,
      type: 'destination',
      coordinates: stop.coordinates,
      name: `${idx + 1}. ${stop.customer}`,
      address: stop.destination,
      eta: formatTime(stop.eta),
    })),
  ] : [];

  const mapRoutes = routePlan ? [{
    geometry: routePlan.route.geometry,
    distance: routePlan.totalDistance,
    duration: routePlan.totalDuration,
    color: '#1976d2',
  }] : [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Dispatch Planning
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Optimize routes, assign drivers, and plan deliveries
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Panel - Shipment Selection */}
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                <LocalShipping sx={{ mr: 1, verticalAlign: 'middle' }} />
                Ready to Ship
              </Typography>
              <Badge badgeContent={selectedShipments.length} color="primary">
                <Chip label={`${shipments.length} total`} size="small" />
              </Badge>
            </Box>

            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedShipments.length === shipments.length}
                        indeterminate={selectedShipments.length > 0 && selectedShipments.length < shipments.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>Order</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Weight</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shipments.map((shipment) => (
                    <TableRow 
                      key={shipment.id}
                      selected={selectedShipments.includes(shipment.id)}
                      hover
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedShipments.includes(shipment.id)}
                          onChange={() => handleToggleShipment(shipment.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {shipment.orderNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{shipment.customer}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {shipment.destination.split(',')[0]}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatWeight(shipment.weight)}</TableCell>
                      <TableCell>
                        <Chip
                          label={shipment.priority}
                          size="small"
                          color={shipment.priority === 'HOT' ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View on Map">
                          <IconButton size="small" onClick={() => handleViewOnMap(shipment)}>
                            <MapIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 2 }} />

            {/* Driver Selection */}
            <Typography variant="subtitle2" gutterBottom>
              <Person sx={{ mr: 1, verticalAlign: 'middle', fontSize: 18 }} />
              Assign Driver
            </Typography>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Select Driver</InputLabel>
              <Select
                value={selectedDriver || ''}
                onChange={(e) => setSelectedDriver(e.target.value)}
                label="Select Driver"
              >
                {drivers.filter(d => d.status === 'available').map((driver) => (
                  <MenuItem key={driver.id} value={driver.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                        {driver.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      {driver.name} - {driver.truck}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Action Buttons */}
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={optimizing ? null : <RouteIcon />}
                onClick={handleOptimizeRoute}
                disabled={selectedShipments.length < 1 || optimizing}
                fullWidth
              >
                {optimizing ? 'Optimizing...' : 'Plan Route'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Calculate />}
                onClick={calculateDistanceMatrix}
                disabled={selectedShipments.length < 2 || loading}
              >
                Matrix
              </Button>
            </Stack>

            {optimizing && <LinearProgress sx={{ mt: 1 }} />}
          </Paper>
        </Grid>

        {/* Right Panel - Route Plan & Map */}
        <Grid item xs={12} lg={7}>
          {routePlan ? (
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  <RouteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Optimized Route Plan
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button size="small" startIcon={<Print />}>
                    Print
                  </Button>
                  <Button size="small" variant="contained" startIcon={<Send />}>
                    Dispatch
                  </Button>
                </Stack>
              </Box>

              {/* Route Summary Cards */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 1, textAlign: 'center' }}>
                      <Speed color="primary" />
                      <Typography variant="h6">{routePlan.totalDistance.toFixed(1)}</Typography>
                      <Typography variant="caption" color="text.secondary">miles</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 1, textAlign: 'center' }}>
                      <AccessTime color="primary" />
                      <Typography variant="h6">{formatDuration(routePlan.totalDuration)}</Typography>
                      <Typography variant="caption" color="text.secondary">drive time</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 1, textAlign: 'center' }}>
                      <LocalGasStation color="primary" />
                      <Typography variant="h6">${routePlan.fuelCost.cost}</Typography>
                      <Typography variant="caption" color="text.secondary">{routePlan.fuelCost.gallons} gal</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 1, textAlign: 'center' }}>
                      <AttachMoney color="primary" />
                      <Typography variant="h6">${routePlan.deliveryCost.toFixed(0)}</Typography>
                      <Typography variant="caption" color="text.secondary">delivery cost</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Map */}
              <Box sx={{ mb: 2 }}>
                <MapComponent
                  locations={mapLocations}
                  routes={mapRoutes}
                  center={WAREHOUSE_LOCATION.coordinates}
                  zoom={7}
                  height="300px"
                  showControls={true}
                  showStyleSwitcher={true}
                  showTraffic={true}
                  fitBounds={true}
                  padding={50}
                />
              </Box>

              {/* Stop List */}
              <Typography variant="subtitle2" gutterBottom>
                <Timeline sx={{ mr: 1, verticalAlign: 'middle', fontSize: 18 }} />
                Delivery Sequence ({routePlan.stops.length} stops)
              </Typography>
              <List dense>
                <ListItem sx={{ bgcolor: 'success.50', borderRadius: 1, mb: 0.5 }}>
                  <ListItemIcon>
                    <Avatar sx={{ width: 28, height: 28, bgcolor: 'success.main', fontSize: 12 }}>
                      <PlayArrow fontSize="small" />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={WAREHOUSE_LOCATION.name}
                    secondary={`Depart: ${formatTime(routePlan.departureTime)}`}
                  />
                </ListItem>
                
                {routePlan.stops.map((stop, idx) => (
                  <ListItem key={stop.id} sx={{ borderLeft: 2, borderColor: 'primary.main', ml: 1.5, mb: 0.5 }}>
                    <ListItemIcon>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 12 }}>
                        {idx + 1}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {stop.customer}
                          </Typography>
                          {stop.priority === 'HOT' && (
                            <Chip label="HOT" size="small" color="error" sx={{ height: 18, fontSize: 10 }} />
                          )}
                        </Box>
                      }
                      secondary={
                        <Stack direction="row" spacing={2}>
                          <Typography variant="caption" color="text.secondary">
                            {stop.destination.split(',').slice(0, 2).join(',')}
                          </Typography>
                          <Typography variant="caption" color="primary" fontWeight={600}>
                            ETA: {formatTime(stop.eta)}
                          </Typography>
                        </Stack>
                      }
                    />
                    <Chip
                      label={formatWeight(stop.weight)}
                      size="small"
                      variant="outlined"
                    />
                  </ListItem>
                ))}
              </List>

              {routePlan.optimized && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <CheckCircle sx={{ mr: 1 }} />
                  Route has been optimized for minimum travel distance
                </Alert>
              )}
            </Paper>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <RouteIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Route Planned
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select shipments from the list and click "Plan Route" to optimize delivery
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Distance Matrix Dialog */}
      {distanceMatrix && (
        <Dialog open={!!distanceMatrix} onClose={() => setDistanceMatrix(null)} maxWidth="md" fullWidth>
          <DialogTitle>Distance Matrix</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Travel times from warehouse to each destination
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Destination</TableCell>
                    <TableCell align="right">Distance</TableCell>
                    <TableCell align="right">Duration</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {distanceMatrix.shipments?.map((shipment, idx) => (
                    <TableRow key={shipment.id}>
                      <TableCell>{shipment.customer}</TableCell>
                      <TableCell align="right">
                        {distanceMatrix.distances?.[0]?.[idx]?.toFixed(1)} mi
                      </TableCell>
                      <TableCell align="right">
                        {formatDuration(distanceMatrix.durations?.[0]?.[idx] || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDistanceMatrix(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Single Shipment Map Dialog */}
      <DeliveryMapDialog
        open={mapDialogOpen}
        onClose={() => setMapDialogOpen(false)}
        destinationAddress={selectedForMap?.destination}
        weight={selectedForMap?.weight}
        title={`Delivery to ${selectedForMap?.customer}`}
        editable={false}
      />
    </Box>
  );
}
