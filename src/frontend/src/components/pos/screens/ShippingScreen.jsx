/**
 * Shipping Screen
 * 
 * Configure shipping method and delivery details with Mapbox integration.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  Divider,
  Chip,
  Alert,
  Autocomplete,
  CircularProgress,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  LocalShipping as ShipIcon,
  Store as WillCallIcon,
  DirectionsCar as DeliveryIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Today as TodayIcon,
  Map as MapIcon,
  CheckCircle,
  Speed,
  AttachMoney,
} from '@mui/icons-material';
import { usePOS } from '../POSContext';
import { 
  searchPlaces, 
  geocodeAddress, 
  getTrafficRoute, 
  calculateDeliveryCost,
  estimateDeliveryTime,
} from '../../../services/mapService';

// Shipping methods
const SHIPPING_METHODS = [
  { 
    id: 'DELIVERY', 
    label: 'Delivery', 
    description: 'Ship to customer address',
    icon: DeliveryIcon,
    hasAddress: true,
    hasDate: true
  },
  { 
    id: 'WILL_CALL', 
    label: 'Will Call', 
    description: 'Customer picks up at warehouse',
    icon: WillCallIcon,
    hasAddress: false,
    hasDate: true
  },
  { 
    id: 'TAKE_WITH', 
    label: 'Take With', 
    description: 'Customer takes now',
    icon: ShipIcon,
    hasAddress: false,
    hasDate: false
  }
];

// ============================================
// SHIPPING METHOD CARD
// ============================================

function ShippingMethodCard({ method, selected, onSelect }) {
  const Icon = method.icon;
  
  return (
    <Card 
      variant="outlined"
      sx={{ 
        height: '100%',
        borderColor: selected ? 'primary.main' : 'divider',
        borderWidth: selected ? 2 : 1,
        transition: 'all 0.2s ease'
      }}
    >
      <CardActionArea 
        onClick={() => onSelect(method.id)}
        sx={{ height: '100%', p: 2 }}
      >
        <CardContent sx={{ p: 0, textAlign: 'center' }}>
          <Icon 
            sx={{ 
              fontSize: 48, 
              color: selected ? 'primary.main' : 'grey.400',
              mb: 1
            }} 
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {method.label}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {method.description}
          </Typography>
          
          {selected && (
            <Chip 
              label="Selected" 
              color="primary" 
              size="small" 
              sx={{ mt: 1 }}
            />
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

// ============================================
// ADDRESS SELECTION
// ============================================

function AddressSelection({ addresses, selected, onChange }) {
  if (!addresses || addresses.length === 0) {
    return (
      <Alert severity="info">
        No shipping addresses on file. Please enter a new address.
      </Alert>
    );
  }
  
  return (
    <FormControl component="fieldset" fullWidth>
      <FormLabel component="legend">Ship To Address</FormLabel>
      <RadioGroup 
        value={selected?.id || ''} 
        onChange={(e) => {
          const addr = addresses.find(a => a.id === e.target.value);
          onChange(addr);
        }}
      >
        {addresses.map(address => (
          <FormControlLabel
            key={address.id}
            value={address.id}
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body2">
                  {address.street1}
                  {address.street2 && `, ${address.street2}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {address.city}, {address.state} {address.zipCode}
                </Typography>
                {address.isPrimary && (
                  <Chip label="Primary" size="small" sx={{ ml: 1 }} />
                )}
              </Box>
            }
            sx={{ 
              mb: 1, 
              p: 1, 
              borderRadius: 1,
              border: 1, 
              borderColor: selected?.id === address.id ? 'primary.main' : 'divider'
            }}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
}

// ============================================
// DATE SELECTION
// ============================================

function DateSelection({ availableDates, selected, onChange }) {
  // Default to next few days if no dates provided
  const dates = availableDates || generateDefaultDates();
  
  function generateDefaultDates() {
    const result = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      result.push({
        date: date.toISOString().split('T')[0],
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        available: true,
        slots: ['Morning', 'Afternoon']
      });
    }
    return result;
  }
  
  return (
    <Box>
      <FormLabel component="legend" sx={{ mb: 2 }}>Requested Date</FormLabel>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {dates.slice(0, 7).map(dateOption => (
          <Chip
            key={dateOption.date}
            label={dateOption.label}
            variant={selected === dateOption.date ? 'filled' : 'outlined'}
            color={selected === dateOption.date ? 'primary' : 'default'}
            onClick={() => onChange(dateOption.date)}
            disabled={!dateOption.available}
            icon={dateOption.label === 'Today' ? <TodayIcon /> : undefined}
          />
        ))}
      </Box>
    </Box>
  );
}

// ============================================
// SHIPPING SCREEN
// ============================================

export function ShippingScreen({ screen, onNext, onBack }) {
  const {
    customer,
    division,
    shipping,
    transition,
    isLoading
  } = usePOS();
  
  const [method, setMethod] = useState(shipping.method || 'DELIVERY');
  const [address, setAddress] = useState(shipping.address || null);
  const [requestedDate, setRequestedDate] = useState(shipping.requestedDate || null);
  const [instructions, setInstructions] = useState(shipping.instructions || '');
  const [error, setError] = useState(null);
  
  // Map integration state
  const [addressSearch, setAddressSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [deliveryEstimate, setDeliveryEstimate] = useState(null);
  const [estimatingDelivery, setEstimatingDelivery] = useState(false);
  const [addressValidated, setAddressValidated] = useState(false);
  
  // Get addresses from customer/division
  const addresses = division?.addresses || customer?.addresses || [];
  
  // Select primary address by default
  useEffect(() => {
    if (!address && addresses.length > 0) {
      const primary = addresses.find(a => a.isPrimary) || addresses[0];
      setAddress(primary);
    }
  }, [addresses, address]);
  
  // Get method config
  const methodConfig = SHIPPING_METHODS.find(m => m.id === method);
  
  // Search for addresses using Mapbox
  const handleAddressSearch = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const results = await searchPlaces(query, {
        types: 'address,place',
        limit: 5,
      });
      setSearchResults(results);
    } catch (err) {
      console.error('Address search error:', err);
    } finally {
      setSearching(false);
    }
  };
  
  // Select address from search results
  const handleSelectSearchResult = async (result) => {
    if (!result) return;
    
    const newAddress = {
      id: `new-${Date.now()}`,
      street1: result.name,
      city: result.place_name?.split(',')[1]?.trim() || '',
      state: result.place_name?.split(',')[2]?.trim()?.split(' ')[0] || '',
      zipCode: result.place_name?.split(',')[2]?.trim()?.split(' ')[1] || '',
      coordinates: result.coordinates,
      isPrimary: false,
    };
    
    setAddress(newAddress);
    setAddressValidated(true);
    setAddressSearch('');
    setSearchResults([]);
    
    // Calculate delivery estimate
    await calculateDeliveryEstimate(result.coordinates);
  };
  
  // Calculate delivery estimate based on address
  const calculateDeliveryEstimate = async (destCoords) => {
    if (!destCoords) return;
    
    setEstimatingDelivery(true);
    try {
      const warehouseCoords = [-87.6298, 41.8781]; // Chicago warehouse
      const route = await getTrafficRoute([warehouseCoords, destCoords]);
      
      const cost = calculateDeliveryCost(route.distance, 10000); // Assume 10k lbs
      const time = estimateDeliveryTime(route.duration);
      
      setDeliveryEstimate({
        distance: route.distance,
        duration: route.duration,
        cost,
        eta: time,
      });
    } catch (err) {
      console.error('Delivery estimate error:', err);
    } finally {
      setEstimatingDelivery(false);
    }
  };
  
  // Validate and continue
  const handleContinue = useCallback(async () => {
    // Validate
    if (methodConfig?.hasAddress && !address) {
      setError('Please select a shipping address');
      return;
    }
    
    if (methodConfig?.hasDate && !requestedDate) {
      setError('Please select a requested date');
      return;
    }
    
    try {
      // Set shipping configuration
      const shippingConfig = {
        method,
        address: methodConfig?.hasAddress ? address : null,
        requestedDate: methodConfig?.hasDate ? requestedDate : null,
        instructions
      };
      
      // Different transitions based on method
      if (method === 'WILL_CALL') {
        await transition('SELECT_WILL_CALL', { shipping: shippingConfig });
      } else if (method === 'TAKE_WITH') {
        await transition('SELECT_TAKE_WITH', { shipping: shippingConfig });
      } else {
        await transition('CONFIRM_DELIVERY', { shipping: shippingConfig });
      }
      
      onNext?.();
    } catch (err) {
      setError(err.message);
    }
  }, [method, address, requestedDate, instructions, methodConfig, transition, onNext]);
  
  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {screen?.title || 'Shipping'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {screen?.description || 'Select shipping method and delivery preferences.'}
        </Typography>
      </Box>
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Shipping Method Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShipIcon />
          Shipping Method
        </Typography>
        
        <Grid container spacing={2}>
          {SHIPPING_METHODS.map(shippingMethod => (
            <Grid item xs={12} md={4} key={shippingMethod.id}>
              <ShippingMethodCard
                method={shippingMethod}
                selected={method === shippingMethod.id}
                onSelect={setMethod}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>
      
      {/* Address Selection (for Delivery) */}
      {methodConfig?.hasAddress && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon />
            Delivery Address
          </Typography>
          
          {/* Address Search with Mapbox */}
          <Autocomplete
            freeSolo
            options={searchResults}
            getOptionLabel={(option) => 
              typeof option === 'string' ? option : option.place_name || ''
            }
            inputValue={addressSearch}
            onInputChange={(e, value) => {
              setAddressSearch(value);
              handleAddressSearch(value);
            }}
            onChange={(e, value) => handleSelectSearchResult(value)}
            loading={searching}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search for a new address..."
                size="small"
                sx={{ mb: 2 }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <MapIcon sx={{ mr: 1, color: 'action.active' }} />,
                  endAdornment: (
                    <>
                      {searching && <CircularProgress size={16} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <LocationIcon sx={{ mr: 1, color: 'action.active' }} fontSize="small" />
                <Box>
                  <Typography variant="body2">{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.place_name}
                  </Typography>
                </Box>
              </Box>
            )}
          />
          
          {/* Saved Addresses */}
          <AddressSelection
            addresses={addresses}
            selected={address}
            onChange={(addr) => {
              setAddress(addr);
              setAddressValidated(false);
              // Try to get coordinates and calculate estimate
              if (addr?.street1) {
                const fullAddr = `${addr.street1}, ${addr.city}, ${addr.state} ${addr.zipCode}`;
                geocodeAddress(fullAddr).then(result => {
                  setAddressValidated(true);
                  calculateDeliveryEstimate(result.coordinates);
                }).catch(() => {});
              }
            }}
          />
          
          {/* Delivery Estimate */}
          {deliveryEstimate && (
            <Paper sx={{ mt: 2, p: 2, bgcolor: 'success.50', border: 1, borderColor: 'success.200' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle color="success" fontSize="small" />
                Delivery Estimate
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Speed color="primary" fontSize="small" />
                    <Typography variant="h6">{deliveryEstimate.distance.toFixed(1)}</Typography>
                    <Typography variant="caption" color="text.secondary">miles</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <ScheduleIcon color="primary" fontSize="small" />
                    <Typography variant="h6">{Math.round(deliveryEstimate.duration)}</Typography>
                    <Typography variant="caption" color="text.secondary">min drive</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <AttachMoney color="primary" fontSize="small" />
                    <Typography variant="h6">${deliveryEstimate.cost.toFixed(0)}</Typography>
                    <Typography variant="caption" color="text.secondary">est. cost</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}
          
          {estimatingDelivery && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <CircularProgress size={20} />
              <Typography variant="caption" sx={{ ml: 1 }}>Calculating delivery estimate...</Typography>
            </Box>
          )}
        </Paper>
      )}
      
      {/* Date Selection */}
      {methodConfig?.hasDate && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon />
            {method === 'WILL_CALL' ? 'Pickup Date' : 'Requested Delivery Date'}
          </Typography>
          
          <DateSelection
            selected={requestedDate}
            onChange={setRequestedDate}
          />
        </Paper>
      )}
      
      {/* Special Instructions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Special Instructions
        </Typography>
        
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Enter any special delivery or handling instructions..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </Paper>
      
      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={onBack}
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          variant="contained"
          endIcon={<NextIcon />}
          onClick={handleContinue}
          disabled={isLoading}
          size="large"
        >
          Continue to Payment
        </Button>
      </Box>
    </Box>
  );
}

export default ShippingScreen;
