import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon,
  Divider,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  Tooltip,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Route as RouteIcon,
  Speed as SpeedIcon,
  LocalGasStation,
  AccessTime,
  AttachMoney,
  DragIndicator,
  ExpandMore,
  ExpandLess,
  SwapVert,
  Download,
  Share,
  Print,
  Traffic,
  DirectionsCar,
  LocalShipping,
  TwoWheeler,
} from '@mui/icons-material';
import MapComponent from '../components/MapComponent';
import { 
  geocodeAddress, 
  optimizeRoute, 
  calculateDistance,
  getTrafficRoute,
  getDistanceMatrix,
  searchPlaces,
  calculateFuelCost,
  estimateDeliveryTime,
  getStaticMapUrl,
} from '../services/mapService';

const RouteOptimizationScreen = () => {
  const [stops, setStops] = useState([]);
  const [newAddress, setNewAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [routeStats, setRouteStats] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [vehicleType, setVehicleType] = useState('truck');
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [distanceMatrix, setDistanceMatrix] = useState(null);
  const [departureTime, setDepartureTime] = useState(new Date());

  // Vehicle configurations
  const vehicleConfigs = {
    truck: { name: 'Heavy Truck', mpg: 6, icon: <LocalShipping /> },
    van: { name: 'Delivery Van', mpg: 12, icon: <DirectionsCar /> },
    car: { name: 'Car', mpg: 25, icon: <DirectionsCar /> },
    motorcycle: { name: 'Motorcycle', mpg: 50, icon: <TwoWheeler /> },
  };

  // Search for addresses
  const handleAddressSearch = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await searchPlaces(query, { limit: 5 });
      setSuggestions(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Add stop
  const handleAddStop = async (address) => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const result = await geocodeAddress(typeof address === 'string' ? address : address.place_name);
      const newStop = {
        id: Date.now(),
        address: result.place_name,
        coordinates: result.coordinates,
        type: stops.length === 0 ? 'origin' : 'stop',
        stopNumber: stops.length + 1,
      };
      setStops([...stops, newStop]);
      setNewAddress('');
      setSuggestions([]);
      setOptimizedRoute(null);
      setRouteStats(null);
    } catch (err) {
      setError('Failed to find address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStop = (id) => {
    const newStops = stops.filter(stop => stop.id !== id).map((stop, index) => ({
      ...stop,
      stopNumber: index + 1,
      type: index === 0 ? 'origin' : 'stop',
    }));
    setStops(newStops);
    setOptimizedRoute(null);
    setRouteStats(null);
    setDistanceMatrix(null);
  };

  const moveStop = (index, direction) => {
    const newStops = [...stops];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= stops.length) return;
    
    [newStops[index], newStops[newIndex]] = [newStops[newIndex], newStops[index]];
    newStops.forEach((stop, i) => {
      stop.stopNumber = i + 1;
      stop.type = i === 0 ? 'origin' : 'stop';
    });
    setStops(newStops);
  };

  const handleOptimizeRoute = async () => {
    if (stops.length < 2) {
      setError('Need at least 2 stops to optimize route');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const coordinates = stops.map(stop => stop.coordinates);
      const result = await optimizeRoute(coordinates);
      
      // Get traffic-aware route
      const trafficRoute = await getTrafficRoute(coordinates);
      
      // Calculate distance matrix
      if (coordinates.length <= 10) {
        const matrix = await getDistanceMatrix(coordinates, coordinates);
        setDistanceMatrix(matrix);
      }
      
      setOptimizedRoute({
        ...result,
        color: '#1976d2',
        showArrows: true,
      });
      
      // Calculate comprehensive stats
      const totalDistance = result.distance;
      const totalDuration = result.duration;
      const fuelCost = calculateFuelCost(totalDistance, { mpg: vehicleConfigs[vehicleType].mpg });
      const deliveryEstimate = estimateDeliveryTime(totalDuration, departureTime);
      
      // Calculate savings vs direct sequence
      let directDistance = 0;
      for (let i = 0; i < coordinates.length - 1; i++) {
        directDistance += calculateDistance(coordinates[i], coordinates[i + 1]);
      }
      const savings = Math.max(0, directDistance - totalDistance);
      
      setRouteStats({
        distance: totalDistance,
        duration: totalDuration,
        trafficDuration: trafficRoute.duration,
        fuelGallons: fuelCost.gallons,
        fuelCost: fuelCost.cost,
        deliveryCost: 50 + (totalDistance * 2.5),
        savings: savings,
        savingsPercent: ((savings / directDistance) * 100).toFixed(1),
        eta: deliveryEstimate.arrivalTime,
        etaWindow: deliveryEstimate.window,
        congestion: trafficRoute.congestion,
        waypointOrder: result.waypoint_order,
      });

      // Reorder stops based on optimization
      if (result.waypoint_order) {
        const reorderedStops = result.waypoint_order.map((originalIndex, newIndex) => ({
          ...stops[originalIndex],
          stopNumber: newIndex + 1,
          type: newIndex === 0 ? 'origin' : newIndex === stops.length - 1 ? 'destination' : 'stop',
        }));
        setStops(reorderedStops);
      }
    } catch (err) {
      setError('Failed to optimize route. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportRoute = () => {
    if (!routeStats) return;
    
    const data = {
      stops: stops.map(s => ({ address: s.address, coordinates: s.coordinates })),
      stats: routeStats,
      generatedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `route-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const mapLocations = stops.map((stop, index) => ({
    ...stop,
    name: `Stop ${stop.stopNumber}`,
    info: stop.address,
  }));

  const mapRoutes = optimizedRoute ? [optimizedRoute] : [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Route Optimization
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AI-powered route planning with real-time traffic and cost analysis
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Export Route">
            <IconButton onClick={handleExportRoute} disabled={!routeStats}>
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton onClick={() => window.print()} disabled={!routeStats}>
              <Print />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left panel - Route planning */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Add Stops
            </Typography>

            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Vehicle Type</InputLabel>
                <Select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  label="Vehicle Type"
                >
                  {Object.entries(vehicleConfigs).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {config.icon}
                        {config.name} ({config.mpg} MPG)
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Autocomplete
              freeSolo
              options={suggestions}
              getOptionLabel={(option) => typeof option === 'string' ? option : option.place_name}
              inputValue={newAddress}
              onInputChange={(e, value) => {
                setNewAddress(value);
                handleAddressSearch(value);
              }}
              onChange={(e, value) => value && handleAddStop(value)}
              loading={searchLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="Search address or place"
                  placeholder="123 Main St, City, State"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddStop(newAddress)}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body2">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.place_name}
                    </Typography>
                  </Box>
                </li>
              )}
            />

            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleAddStop(newAddress)}
              disabled={loading || !newAddress.trim()}
              startIcon={loading ? <CircularProgress size={16} /> : <AddIcon />}
              sx={{ mt: 1 }}
            >
              Add Stop
            </Button>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">
                Stops ({stops.length})
              </Typography>
              {stops.length > 1 && (
                <Button
                  size="small"
                  startIcon={<SwapVert />}
                  onClick={() => setStops([...stops].reverse())}
                >
                  Reverse
                </Button>
              )}
            </Box>

            <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
              {stops.map((stop, index) => (
                <ListItem key={stop.id} divider sx={{ bgcolor: index === 0 ? 'primary.50' : 'transparent' }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Chip
                      label={stop.stopNumber}
                      size="small"
                      color={index === 0 ? 'primary' : index === stops.length - 1 ? 'error' : 'default'}
                      sx={{ width: 28, height: 28 }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                        {stop.address.split(',')[0]}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {stop.address.split(',').slice(1).join(',')}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton size="small" onClick={() => moveStop(index, -1)} disabled={index === 0}>
                      <ExpandLess fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => moveStop(index, 1)} disabled={index === stops.length - 1}>
                      <ExpandMore fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleRemoveStop(stop.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            {stops.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Add addresses to start planning your route
              </Typography>
            )}

            <Button
              fullWidth
              variant="contained"
              color="success"
              onClick={handleOptimizeRoute}
              disabled={loading || stops.length < 2}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RouteIcon />}
              sx={{ mt: 2 }}
            >
              Optimize Route
            </Button>
          </Paper>

          {/* Route stats */}
          {routeStats && (
            <Paper sx={{ mt: 2, p: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SpeedIcon fontSize="small" color="primary" />
                Route Statistics
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                      <Typography variant="caption" color="text.secondary">Distance</Typography>
                      <Typography variant="h6">{routeStats.distance.toFixed(1)} mi</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                      <Typography variant="caption" color="text.secondary">Duration</Typography>
                      <Typography variant="h6">{Math.round(routeStats.duration)} min</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                      <Typography variant="caption" color="text.secondary">Fuel Cost</Typography>
                      <Typography variant="h6">${routeStats.fuelCost.toFixed(2)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {routeStats.fuelGallons} gal
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined" sx={{ bgcolor: 'success.50' }}>
                    <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                      <Typography variant="caption" color="text.secondary">Savings</Typography>
                      <Typography variant="h6" color="success.main">
                        {routeStats.savings.toFixed(1)} mi
                      </Typography>
                      <Typography variant="caption" color="success.main">
                        {routeStats.savingsPercent}% less
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AccessTime fontSize="small" color="action" />
                <Typography variant="body2">
                  ETA: {routeStats.eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Traffic fontSize="small" color="action" />
                <Typography variant="body2">
                  With traffic: {Math.round(routeStats.trafficDuration)} min
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney fontSize="small" color="action" />
                <Typography variant="body2">
                  Est. delivery cost: ${routeStats.deliveryCost.toFixed(2)}
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Right panel - Map */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2, height: 'calc(100vh - 200px)', minHeight: 500 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Route Map</Typography>
              <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} size="small">
                <Tab label="Map" />
                <Tab label="Satellite" />
                <Tab label="Traffic" />
              </Tabs>
            </Box>
            <MapComponent
              locations={mapLocations}
              routes={mapRoutes}
              center={stops.length > 0 ? stops[0].coordinates : undefined}
              zoom={stops.length > 0 ? 12 : 3.5}
              height="calc(100% - 50px)"
              style={activeTab === 0 ? 'streets' : activeTab === 1 ? 'satellite' : 'traffic'}
              showControls={true}
              showStyleSwitcher={false}
              show3D={activeTab === 1}
              showTraffic={activeTab === 2}
              fitBounds={true}
              padding={80}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RouteOptimizationScreen;
