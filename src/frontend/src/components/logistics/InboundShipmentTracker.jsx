/**
 * Inbound Shipment Tracker
 * Map component for tracking incoming shipments
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Stack,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  LocalShipping,
  Schedule,
  CheckCircle,
  Warning,
  Phone,
  Room,
  Refresh,
  Navigation,
  AccessTime,
  Speed,
} from '@mui/icons-material';
import MapComponent from '../MapComponent';
import { 
  getTrafficRoute, 
  estimateDeliveryTime,
  reverseGeocode,
} from '../../services/mapService';

export default function InboundShipmentTracker({
  shipments = [],
  warehouseLocation = [-87.6298, 41.8781],
  warehouseName = 'Main Warehouse',
  onShipmentClick,
  height = '400px',
}) {
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get all active shipment locations for map
  const activeShipments = shipments.filter(s => 
    s.status === 'IN_TRANSIT' || s.status === 'ARRIVING'
  );

  // Build map locations
  const mapLocations = [
    {
      id: 'warehouse',
      type: 'warehouse',
      coordinates: warehouseLocation,
      name: warehouseName,
      address: 'Receiving Dock',
    },
    ...activeShipments.map(s => ({
      id: s.id,
      type: 'truck',
      coordinates: s.currentLocation?.coordinates || s.origin?.coordinates,
      name: s.bolNumber || s.id,
      address: s.carrier,
      info: s.eta ? `ETA: ${new Date(s.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : null,
    })),
  ];

  // Handle shipment selection
  const handleSelectShipment = async (shipment) => {
    setSelectedShipment(shipment);
    
    if (!shipment.currentLocation?.coordinates) return;
    
    setLoading(true);
    try {
      const route = await getTrafficRoute([
        shipment.currentLocation.coordinates,
        warehouseLocation,
      ]);
      setRouteData(route);
    } catch (err) {
      console.error('Route error:', err);
    } finally {
      setLoading(false);
    }
  };

  const mapRoutes = routeData && selectedShipment ? [{
    geometry: routeData.geometry,
    distance: routeData.distance,
    duration: routeData.duration,
    color: '#1976d2',
  }] : [];

  const getStatusConfig = (status) => {
    const configs = {
      SCHEDULED: { color: 'default', icon: <Schedule />, label: 'Scheduled' },
      IN_TRANSIT: { color: 'info', icon: <LocalShipping />, label: 'In Transit' },
      ARRIVING: { color: 'warning', icon: <Navigation />, label: 'Arriving Soon' },
      ARRIVED: { color: 'success', icon: <CheckCircle />, label: 'Arrived' },
      DELAYED: { color: 'error', icon: <Warning />, label: 'Delayed' },
    };
    return configs[status] || configs.SCHEDULED;
  };

  const formatTime = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '—';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {/* Left Panel - Shipment List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: height, overflow: 'auto' }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              <LocalShipping sx={{ mr: 1, verticalAlign: 'middle' }} />
              Incoming Shipments
            </Typography>
            
            {activeShipments.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                No active inbound shipments
              </Alert>
            ) : (
              <List dense>
                {activeShipments.map((shipment) => {
                  const statusConfig = getStatusConfig(shipment.status);
                  const isSelected = selectedShipment?.id === shipment.id;
                  
                  return (
                    <React.Fragment key={shipment.id}>
                      <ListItem
                        button
                        selected={isSelected}
                        onClick={() => handleSelectShipment(shipment)}
                        sx={{
                          borderRadius: 1,
                          mb: 0.5,
                          border: isSelected ? 2 : 1,
                          borderColor: isSelected ? 'primary.main' : 'divider',
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {statusConfig.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight={600}>
                                {shipment.bolNumber}
                              </Typography>
                              <Chip
                                label={statusConfig.label}
                                size="small"
                                color={statusConfig.color}
                                sx={{ height: 20, fontSize: 10 }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                {shipment.carrier}
                              </Typography>
                              {shipment.eta && (
                                <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                                  ETA: {formatTime(shipment.eta)}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  );
                })}
              </List>
            )}
            
            {/* Selected Shipment Details */}
            {selectedShipment && (
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Shipment Details
                </Typography>
                
                {loading && <LinearProgress sx={{ mb: 1 }} />}
                
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Carrier</Typography>
                    <Typography variant="body2">{selectedShipment.carrier}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Supplier</Typography>
                    <Typography variant="body2">{selectedShipment.supplier}</Typography>
                  </Box>
                  
                  {routeData && (
                    <>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Distance</Typography>
                        <Typography variant="body2">{routeData.distance.toFixed(1)} mi</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Time to Arrival</Typography>
                        <Typography variant="body2" color="primary" fontWeight={600}>
                          {formatDuration(routeData.duration)}
                        </Typography>
                      </Box>
                    </>
                  )}
                  
                  {selectedShipment.driverPhone && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Phone />}
                      href={`tel:${selectedShipment.driverPhone}`}
                      sx={{ mt: 1 }}
                    >
                      Contact Driver
                    </Button>
                  )}
                </Stack>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Right Panel - Map */}
        <Grid item xs={12} md={8}>
          <MapComponent
            locations={mapLocations}
            routes={mapRoutes}
            center={warehouseLocation}
            zoom={8}
            height={height}
            showControls={true}
            showStyleSwitcher={true}
            showTraffic={true}
            fitBounds={activeShipments.length > 0}
            onMarkerClick={(loc) => {
              if (loc.id !== 'warehouse') {
                const shipment = shipments.find(s => s.id === loc.id);
                if (shipment) handleSelectShipment(shipment);
              }
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
