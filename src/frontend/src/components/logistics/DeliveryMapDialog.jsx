/**
 * Delivery Map Dialog
 * Full-featured map dialog for address validation, route preview, and delivery estimation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Stack,
  Autocomplete,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  LocationOn,
  Schedule,
  LocalShipping,
  AttachMoney,
  Speed,
  Route as RouteIcon,
  MyLocation,
  Warning,
  CheckCircle,
  Refresh,
  Navigation,
  LocalGasStation,
  Timeline,
} from '@mui/icons-material';
import MapComponent from '../MapComponent';
import {
  geocodeAddress,
  reverseGeocode,
  getRouteDirections,
  getTrafficRoute,
  calculateDistance,
  calculateDeliveryCost,
  calculateFuelCost,
  estimateDeliveryTime,
  searchPlaces,
  getIsochrone,
} from '../../services/mapService';

// Default warehouse location (can be configured)
const WAREHOUSE_LOCATION = {
  coordinates: [-87.6298, 41.8781], // Chicago
  name: 'Main Warehouse',
  address: '123 Industrial Blvd, Chicago, IL 60601',
};

export default function DeliveryMapDialog({
  open,
  onClose,
  onConfirm,
  destinationAddress,
  originAddress,
  weight = 0,
  title = 'Delivery Route Preview',
  showCostEstimate = true,
  showTimeEstimate = true,
  editable = true,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [costEstimate, setCostEstimate] = useState(null);
  const [timeEstimate, setTimeEstimate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addressValidated, setAddressValidated] = useState(false);

  // Initialize origin from warehouse
  useEffect(() => {
    if (originAddress) {
      geocodeAddress(originAddress)
        .then(result => {
          setOrigin({
            coordinates: result.coordinates,
            name: 'Origin',
            address: result.place_name,
          });
        })
        .catch(() => {
          setOrigin(WAREHOUSE_LOCATION);
        });
    } else {
      setOrigin(WAREHOUSE_LOCATION);
    }
  }, [originAddress]);

  // Initialize destination if provided
  useEffect(() => {
    if (destinationAddress && open) {
      setSearchQuery(destinationAddress);
      handleGeocode(destinationAddress);
    }
  }, [destinationAddress, open]);

  // Geocode destination address
  const handleGeocode = async (address) => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    setAddressValidated(false);
    
    try {
      const result = await geocodeAddress(address);
      setDestination({
        coordinates: result.coordinates,
        name: 'Delivery Location',
        address: result.place_name,
      });
      setAddressValidated(true);
    } catch (err) {
      setError('Could not find this address. Please try a different format.');
      setDestination(null);
    } finally {
      setLoading(false);
    }
  };

  // Search for addresses as user types
  const handleSearch = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const results = await searchPlaces(query, {
        types: 'address,place,poi',
        limit: 5,
        proximity: origin?.coordinates,
      });
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  // Calculate route when origin and destination are set
  useEffect(() => {
    if (!origin || !destination) {
      setRouteData(null);
      return;
    }
    
    calculateRoute();
  }, [origin, destination]);

  // Calculate route with traffic data
  const calculateRoute = async () => {
    if (!origin || !destination) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const route = await getTrafficRoute([origin.coordinates, destination.coordinates]);
      setRouteData(route);
      
      // Calculate cost estimate
      if (showCostEstimate) {
        const cost = calculateDeliveryCost(route.distance, weight);
        const fuel = calculateFuelCost(route.distance, { mpg: 6 });
        setCostEstimate({
          delivery: cost,
          fuel,
          perMile: (cost / route.distance).toFixed(2),
        });
      }
      
      // Calculate time estimate
      if (showTimeEstimate) {
        const time = estimateDeliveryTime(route.duration);
        setTimeEstimate(time);
      }
    } catch (err) {
      setError('Failed to calculate route. Please check the addresses.');
    } finally {
      setLoading(false);
    }
  };

  // Handle address selection from search
  const handleSelectAddress = (place) => {
    if (!place) return;
    
    setSearchQuery(place.place_name);
    setDestination({
      coordinates: place.coordinates,
      name: place.name,
      address: place.place_name,
    });
    setAddressValidated(true);
    setSearchResults([]);
  };

  // Handle confirm
  const handleConfirm = () => {
    if (onConfirm && destination) {
      onConfirm({
        address: destination.address,
        coordinates: destination.coordinates,
        distance: routeData?.distance,
        duration: routeData?.duration,
        costEstimate,
        timeEstimate,
        validated: addressValidated,
      });
    }
    onClose();
  };

  // Map locations
  const mapLocations = [];
  if (origin) {
    mapLocations.push({
      id: 'origin',
      type: 'warehouse',
      coordinates: origin.coordinates,
      name: origin.name,
      address: origin.address,
    });
  }
  if (destination) {
    mapLocations.push({
      id: 'destination',
      type: 'destination',
      coordinates: destination.coordinates,
      name: destination.name,
      address: destination.address,
    });
  }

  const mapRoutes = routeData ? [{
    geometry: routeData.geometry,
    distance: routeData.distance,
    duration: routeData.duration,
    color: '#1976d2',
  }] : [];

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { height: '85vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalShipping />
          <Typography variant="h6">{title}</Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ height: '100%' }}>
          {/* Left Panel - Address & Info */}
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              {/* Address Search */}
              {editable && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <LocationOn sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
                    Delivery Address
                  </Typography>
                  
                  <Autocomplete
                    freeSolo
                    options={searchResults}
                    getOptionLabel={(option) => 
                      typeof option === 'string' ? option : option.place_name
                    }
                    loading={searching}
                    inputValue={searchQuery}
                    onInputChange={(e, value) => {
                      setSearchQuery(value);
                      handleSearch(value);
                    }}
                    onChange={(e, value) => handleSelectAddress(value)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Enter delivery address..."
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {searching && <CircularProgress size={16} />}
                              {addressValidated && <CheckCircle color="success" sx={{ ml: 1 }} />}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <ListItem {...props} dense>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <LocationOn fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={option.name}
                          secondary={option.place_name}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    )}
                  />
                  
                  {!editable && destination && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {destination.address}
                    </Typography>
                  )}
                </Paper>
              )}
              
              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              
              {/* Route Summary */}
              {routeData && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <RouteIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
                    Route Summary
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="h5" color="primary">
                          {routeData.distance.toFixed(1)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          miles
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="h5" color="primary">
                          {formatDuration(routeData.duration)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          drive time
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {routeData.duration_typical && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Typical: {formatDuration(routeData.duration_typical)} (traffic-adjusted)
                    </Typography>
                  )}
                </Paper>
              )}
              
              {/* Time Estimate */}
              {timeEstimate && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <Schedule sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
                    Delivery Window
                  </Typography>
                  
                  <Box sx={{ bgcolor: 'info.50', p: 1.5, borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>ETA:</strong> {timeEstimate.arrivalTime.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Window: {timeEstimate.window.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {timeEstimate.window.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                  
                  {timeEstimate.trafficMultiplier > 1 && (
                    <Chip 
                      icon={<Warning />}
                      label={`${Math.round((timeEstimate.trafficMultiplier - 1) * 100)}% traffic delay`}
                      size="small"
                      color="warning"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Paper>
              )}
              
              {/* Cost Estimate */}
              {costEstimate && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <AttachMoney sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
                    Cost Estimate
                  </Typography>
                  
                  <List dense disablePadding>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText 
                        primary="Delivery Charge"
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                      <Typography variant="body2" fontWeight={600}>
                        ${costEstimate.delivery.toFixed(2)}
                      </Typography>
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <LocalGasStation fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`Fuel (${costEstimate.fuel.gallons} gal)`}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                      <Typography variant="body2">
                        ${costEstimate.fuel.cost.toFixed(2)}
                      </Typography>
                    </ListItem>
                    <Divider sx={{ my: 1 }} />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText 
                        primary="Per Mile Rate"
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        ${costEstimate.perMile}/mi
                      </Typography>
                    </ListItem>
                  </List>
                  
                  {weight > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Based on {weight.toLocaleString()} lbs cargo weight
                    </Typography>
                  )}
                </Paper>
              )}
              
              {/* Origin Info */}
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  <MyLocation sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
                  Origin
                </Typography>
                <Typography variant="body2">{origin?.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {origin?.address}
                </Typography>
              </Paper>
            </Stack>
          </Grid>
          
          {/* Right Panel - Map */}
          <Grid item xs={12} md={8}>
            <Box sx={{ height: '100%', minHeight: 400 }}>
              {loading && !routeData ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <MapComponent
                  locations={mapLocations}
                  routes={mapRoutes}
                  center={destination?.coordinates || origin?.coordinates}
                  zoom={destination ? 10 : 8}
                  height="100%"
                  showControls={true}
                  showStyleSwitcher={true}
                  showTraffic={true}
                  fitBounds={destination && origin}
                  padding={60}
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={calculateRoute}
          startIcon={<Refresh />}
          disabled={loading || !destination}
        >
          Recalculate
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!destination || !addressValidated}
          startIcon={<CheckCircle />}
        >
          Confirm Delivery Route
        </Button>
      </DialogActions>
    </Dialog>
  );
}
