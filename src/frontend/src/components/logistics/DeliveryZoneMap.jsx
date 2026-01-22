/**
 * Delivery Zone Map Component
 * Shows isochrone (delivery zones) and service areas
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  AccessTime,
  DirectionsCar,
  LocalShipping,
  Schedule,
} from '@mui/icons-material';
import MapComponent from '../MapComponent';
import { getIsochrone, getMapboxToken, MAP_STYLES } from '../../services/mapService';
import mapboxgl from 'mapbox-gl';

// Zone color palette
const ZONE_COLORS = [
  { minutes: 15, color: '#22c55e', label: '15 min', opacity: 0.3 },
  { minutes: 30, color: '#f59e0b', label: '30 min', opacity: 0.25 },
  { minutes: 60, color: '#ef4444', label: '1 hour', opacity: 0.2 },
  { minutes: 90, color: '#8b5cf6', label: '1.5 hours', opacity: 0.15 },
];

export default function DeliveryZoneMap({
  center, // [lng, lat]
  centerName = 'Warehouse',
  onZoneClick,
  showLegend = true,
  height = '500px',
  profile = 'driving', // driving, walking, cycling
  contours = [15, 30, 60], // Minutes
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isochroneData, setIsochroneData] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(profile);
  const [selectedContours, setSelectedContours] = useState(contours);
  const [mapRef, setMapRef] = useState(null);

  // Default center (Chicago warehouse)
  const defaultCenter = center || [-87.6298, 41.8781];

  // Fetch isochrone data
  const fetchIsochrone = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getIsochrone(defaultCenter, {
        profile: selectedProfile,
        contours_minutes: selectedContours,
        polygons: true,
      });
      setIsochroneData(data);
    } catch (err) {
      console.error('Isochrone error:', err);
      setError('Failed to load delivery zones');
    } finally {
      setLoading(false);
    }
  }, [defaultCenter, selectedProfile, selectedContours]);

  useEffect(() => {
    fetchIsochrone();
  }, [fetchIsochrone]);

  // Add isochrone layers to map
  useEffect(() => {
    if (!mapRef || !isochroneData) return;

    // Remove existing layers if any
    ['isochrone-fill', 'isochrone-line'].forEach(layerId => {
      if (mapRef.getLayer(layerId)) {
        mapRef.removeLayer(layerId);
      }
    });
    if (mapRef.getSource('isochrone')) {
      mapRef.removeSource('isochrone');
    }

    // Add isochrone source and layers
    mapRef.addSource('isochrone', {
      type: 'geojson',
      data: isochroneData,
    });

    // Add fill layer for each contour
    mapRef.addLayer({
      id: 'isochrone-fill',
      type: 'fill',
      source: 'isochrone',
      paint: {
        'fill-color': [
          'match',
          ['get', 'contour'],
          15, ZONE_COLORS[0].color,
          30, ZONE_COLORS[1].color,
          60, ZONE_COLORS[2].color,
          90, ZONE_COLORS[3].color,
          '#888'
        ],
        'fill-opacity': [
          'match',
          ['get', 'contour'],
          15, 0.4,
          30, 0.3,
          60, 0.2,
          90, 0.15,
          0.2
        ],
      },
    });

    // Add line layer for zone boundaries
    mapRef.addLayer({
      id: 'isochrone-line',
      type: 'line',
      source: 'isochrone',
      paint: {
        'line-color': [
          'match',
          ['get', 'contour'],
          15, ZONE_COLORS[0].color,
          30, ZONE_COLORS[1].color,
          60, ZONE_COLORS[2].color,
          90, ZONE_COLORS[3].color,
          '#888'
        ],
        'line-width': 2,
        'line-opacity': 0.8,
      },
    });

  }, [mapRef, isochroneData]);

  const handleProfileChange = (event, newProfile) => {
    if (newProfile) {
      setSelectedProfile(newProfile);
    }
  };

  const warehouseLocation = [{
    id: 'warehouse',
    type: 'warehouse',
    coordinates: defaultCenter,
    name: centerName,
    address: 'Distribution Center',
  }];

  return (
    <Box>
      {/* Controls */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              <Schedule sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
              Delivery Zones
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Areas reachable within specified travel times
            </Typography>
          </Box>

          <ToggleButtonGroup
            value={selectedProfile}
            exclusive
            onChange={handleProfileChange}
            size="small"
          >
            <ToggleButton value="driving">
              <LocalShipping sx={{ mr: 0.5 }} fontSize="small" />
              Truck
            </ToggleButton>
            <ToggleButton value="driving-traffic">
              <DirectionsCar sx={{ mr: 0.5 }} fontSize="small" />
              Traffic
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Map */}
      <Box sx={{ position: 'relative' }}>
        {loading && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255,255,255,0.8)',
            zIndex: 10,
          }}>
            <CircularProgress />
          </Box>
        )}

        <MapComponent
          locations={warehouseLocation}
          center={defaultCenter}
          zoom={9}
          height={height}
          showControls={true}
          showStyleSwitcher={true}
          onMapLoad={(map) => setMapRef(map)}
        />

        {/* Legend */}
        {showLegend && (
          <Paper
            sx={{
              position: 'absolute',
              bottom: 40,
              left: 10,
              p: 1.5,
              zIndex: 5,
              minWidth: 140,
            }}
          >
            <Typography variant="caption" fontWeight={600} gutterBottom sx={{ display: 'block' }}>
              Travel Time Zones
            </Typography>
            <List dense disablePadding>
              {ZONE_COLORS.filter(z => selectedContours.includes(z.minutes)).map((zone) => (
                <ListItem key={zone.minutes} sx={{ px: 0, py: 0.25 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: 0.5,
                      bgcolor: zone.color,
                      opacity: zone.opacity + 0.3,
                      mr: 1,
                      border: `2px solid ${zone.color}`,
                    }}
                  />
                  <ListItemText
                    primary={zone.label}
                    primaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      {/* Zone Stats */}
      {isochroneData && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Service Area Coverage</Typography>
          <Stack direction="row" spacing={2}>
            {ZONE_COLORS.filter(z => selectedContours.includes(z.minutes)).map((zone) => (
              <Box key={zone.minutes} sx={{ textAlign: 'center', flex: 1 }}>
                <Chip
                  icon={<AccessTime />}
                  label={zone.label}
                  size="small"
                  sx={{ bgcolor: zone.color, color: 'white', mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Same-day delivery
                </Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
