/**
 * Address Autocomplete Component
 * Mapbox-powered address search with validation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  Autocomplete,
  CircularProgress,
  Box,
  Typography,
  Chip,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  LocationOn,
  CheckCircle,
  Error as ErrorIcon,
  MyLocation,
  Clear,
} from '@mui/icons-material';
import { searchPlaces, geocodeAddress, reverseGeocode } from '../../services/mapService';
import debounce from 'lodash/debounce';

export default function AddressAutocomplete({
  value,
  onChange,
  onValidated,
  label = 'Address',
  placeholder = 'Enter address...',
  required = false,
  error = false,
  helperText = '',
  fullWidth = true,
  size = 'medium',
  variant = 'outlined',
  proximity = null, // [lng, lat] to bias results
  types = 'address,place', // address, place, poi, etc.
  disabled = false,
  showValidation = true,
  allowCurrentLocation = true,
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [coordinates, setCoordinates] = useState(null);

  // Update input when value prop changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || '');
    }
  }, [value]);

  // Debounced search function
  const searchAddress = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 3) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const results = await searchPlaces(query, {
          types,
          limit: 5,
          proximity,
        });
        setOptions(results || []);
      } catch (err) {
        console.error('Address search error:', err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [types, proximity]
  );

  // Handle input change
  const handleInputChange = (event, newValue, reason) => {
    setInputValue(newValue);
    setValidated(false);
    setValidationError(null);
    
    if (reason === 'input') {
      searchAddress(newValue);
    }
  };

  // Handle selection from dropdown
  const handleChange = async (event, newValue) => {
    if (!newValue) {
      setInputValue('');
      setCoordinates(null);
      setValidated(false);
      onChange?.('', null);
      return;
    }

    const address = typeof newValue === 'string' ? newValue : newValue.place_name;
    setInputValue(address);
    
    // If we have coordinates from the selection, use them
    if (newValue.coordinates) {
      setCoordinates(newValue.coordinates);
      setValidated(true);
      onChange?.(address, newValue.coordinates);
      onValidated?.({
        address,
        coordinates: newValue.coordinates,
        validated: true,
      });
    } else {
      // Otherwise geocode the address
      try {
        const result = await geocodeAddress(address);
        setCoordinates(result.coordinates);
        setValidated(true);
        onChange?.(result.place_name, result.coordinates);
        onValidated?.({
          address: result.place_name,
          coordinates: result.coordinates,
          validated: true,
        });
      } catch (err) {
        setValidationError('Could not validate this address');
        setValidated(false);
        onChange?.(address, null);
      }
    }
  };

  // Get current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setValidationError('Geolocation is not supported');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const coords = [position.coords.longitude, position.coords.latitude];
          const result = await reverseGeocode(coords);
          
          setInputValue(result.place_name);
          setCoordinates(coords);
          setValidated(true);
          onChange?.(result.place_name, coords);
          onValidated?.({
            address: result.place_name,
            coordinates: coords,
            validated: true,
          });
        } catch (err) {
          setValidationError('Could not get address for location');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setValidationError('Could not get your location');
        setLoading(false);
      }
    );
  };

  // Clear input
  const handleClear = () => {
    setInputValue('');
    setCoordinates(null);
    setValidated(false);
    setValidationError(null);
    setOptions([]);
    onChange?.('', null);
  };

  // Determine validation state
  const getValidationIcon = () => {
    if (!showValidation || !inputValue) return null;
    if (loading) return <CircularProgress size={16} />;
    if (validated) return <CheckCircle color="success" fontSize="small" />;
    if (validationError) return <ErrorIcon color="error" fontSize="small" />;
    return null;
  };

  return (
    <Autocomplete
      freeSolo
      options={options}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.place_name || ''
      }
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={handleChange}
      loading={loading}
      disabled={disabled}
      fullWidth={fullWidth}
      filterOptions={(x) => x} // Disable client-side filtering
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          variant={variant}
          size={size}
          required={required}
          error={error || !!validationError}
          helperText={validationError || helperText}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <LocationOn color="action" fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {getValidationIcon()}
                {inputValue && (
                  <Tooltip title="Clear">
                    <IconButton size="small" onClick={handleClear}>
                      <Clear fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {allowCurrentLocation && !inputValue && (
                  <Tooltip title="Use current location">
                    <IconButton size="small" onClick={handleGetCurrentLocation}>
                      <MyLocation fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <LocationOn sx={{ mr: 1, color: 'action.active' }} fontSize="small" />
          <Box>
            <Typography variant="body2">{option.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {option.place_name}
            </Typography>
          </Box>
          {option.type && (
            <Chip 
              label={option.type} 
              size="small" 
              variant="outlined"
              sx={{ ml: 'auto', textTransform: 'capitalize' }}
            />
          )}
        </Box>
      )}
      noOptionsText={
        inputValue.length < 3 
          ? 'Type at least 3 characters...'
          : 'No addresses found'
      }
    />
  );
}
