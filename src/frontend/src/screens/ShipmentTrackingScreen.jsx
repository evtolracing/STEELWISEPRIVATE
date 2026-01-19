import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  LinearProgress,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  LocalShipping,
  Room,
  Schedule,
  CheckCircle,
  Warning,
  Map as MapIcon,
  Refresh,
  Timeline,
  Phone,
  Speed,
  AccessTime,
  Navigation,
  ViewList,
  ViewModule,
  FilterList,
  Search,
  Download,
  MoreVert,
  LocationOn,
  DirectionsCar,
} from '@mui/icons-material';
import MapComponent from '../components/MapComponent';
import { 
  geocodeAddress, 
  getRouteDirections, 
  getTrafficRoute,
  calculateDistance,
  estimateDeliveryTime,
} from '../services/mapService';

const ShipmentTrackingScreen = () => {
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [liveTracking, setLiveTracking] = useState(false);

  // Mock shipment data with coordinates
  useEffect(() => {
    const mockShipments = [
      {
        id: 'SH-001',
        orderNumber: 'ORD-12345',
        status: 'in_transit',
        priority: 'high',
        origin: {
          name: 'Main Warehouse',
          address: '123 Industrial Blvd, Chicago, IL 60601',
          coordinates: [-87.6298, 41.8781],
        },
        destination: {
          name: 'ABC Steel Corp',
          address: '456 Manufacturing Dr, Detroit, MI 48201',
          coordinates: [-83.0458, 42.3314],
        },
        currentLocation: {
          coordinates: [-85.5872, 42.0172],
          address: 'Kalamazoo, MI',
          lastUpdate: new Date(Date.now() - 1800000).toISOString(),
          speed: 62,
          heading: 'East',
        },
        driver: {
          name: 'John Smith',
          phone: '+1 (555) 123-4567',
          avatar: 'JS',
        },
        vehicle: {
          number: 'TRK-101',
          type: 'Flatbed',
          capacity: '40,000 lbs',
        },
        cargo: {
          items: 15,
          weight: 25000,
          description: 'Hot-rolled steel coils (5x A36)',
        },
        timeline: [
          { time: '06:00 AM', event: 'Departed warehouse', location: 'Chicago, IL' },
          { time: '08:15 AM', event: 'Fuel stop', location: 'Gary, IN' },
          { time: '10:30 AM', event: 'Current location', location: 'Kalamazoo, MI' },
        ],
        estimatedArrival: new Date(Date.now() + 7200000).toISOString(),
        progress: 65,
      },
      {
        id: 'SH-002',
        orderNumber: 'ORD-12346',
        status: 'delivered',
        priority: 'normal',
        origin: {
          name: 'Main Warehouse',
          address: '123 Industrial Blvd, Chicago, IL 60601',
          coordinates: [-87.6298, 41.8781],
        },
        destination: {
          name: 'XYZ Manufacturing',
          address: '789 Factory Ave, Milwaukee, WI 53202',
          coordinates: [-87.9065, 43.0389],
        },
        currentLocation: {
          coordinates: [-87.9065, 43.0389],
          lastUpdate: new Date(Date.now() - 86400000).toISOString(),
        },
        driver: {
          name: 'Sarah Johnson',
          phone: '+1 (555) 234-5678',
          avatar: 'SJ',
        },
        vehicle: {
          number: 'TRK-102',
          type: 'Box Truck',
        },
        cargo: {
          items: 8,
          weight: 12000,
          description: 'Cold-rolled sheet steel',
        },
        timeline: [
          { time: '07:00 AM', event: 'Departed warehouse', location: 'Chicago, IL' },
          { time: '09:45 AM', event: 'Arrived at destination', location: 'Milwaukee, WI' },
          { time: '10:15 AM', event: 'Delivery confirmed', location: 'Milwaukee, WI' },
        ],
        deliveredAt: new Date(Date.now() - 86400000).toISOString(),
        progress: 100,
      },
      {
        id: 'SH-003',
        orderNumber: 'ORD-12347',
        status: 'pending',
        priority: 'urgent',
        origin: {
          name: 'Main Warehouse',
          address: '123 Industrial Blvd, Chicago, IL 60601',
          coordinates: [-87.6298, 41.8781],
        },
        destination: {
          name: 'Steel Corp Industries',
          address: '321 Metal Way, Indianapolis, IN 46201',
          coordinates: [-86.1581, 39.7684],
        },
        driver: {
          name: 'Mike Williams',
          phone: '+1 (555) 345-6789',
          avatar: 'MW',
        },
        vehicle: {
          number: 'TRK-103',
          type: 'Flatbed',
        },
        cargo: {
          items: 22,
          weight: 35000,
          description: 'Structural steel beams (I-beams)',
        },
        timeline: [
          { time: '02:00 PM', event: 'Scheduled departure', location: 'Chicago, IL' },
        ],
        estimatedDeparture: new Date(Date.now() + 14400000).toISOString(),
        progress: 0,
      },
      {
        id: 'SH-004',
        orderNumber: 'ORD-12348',
        status: 'delayed',
        priority: 'high',
        origin: {
          name: 'Main Warehouse',
          address: '123 Industrial Blvd, Chicago, IL 60601',
          coordinates: [-87.6298, 41.8781],
        },
        destination: {
          name: 'Metro Fabricators',
          address: '555 Welding St, Cleveland, OH 44101',
          coordinates: [-81.6944, 41.4993],
        },
        currentLocation: {
          coordinates: [-84.5120, 39.1031],
          address: 'Cincinnati, OH (Traffic delay)',
          lastUpdate: new Date(Date.now() - 3600000).toISOString(),
          speed: 15,
          heading: 'North',
        },
        driver: {
          name: 'David Brown',
          phone: '+1 (555) 456-7890',
          avatar: 'DB',
        },
        vehicle: {
          number: 'TRK-104',
          type: 'Heavy Haul',
        },
        cargo: {
          items: 4,
          weight: 45000,
          description: 'Steel plate (4x 12000 lb plates)',
        },
        timeline: [
          { time: '05:00 AM', event: 'Departed warehouse', location: 'Chicago, IL' },
          { time: '09:00 AM', event: 'Traffic delay', location: 'Cincinnati, OH' },
        ],
        estimatedArrival: new Date(Date.now() + 14400000).toISOString(),
        delayReason: 'Heavy traffic on I-71',
        progress: 45,
      },
    ];

    setShipments(mockShipments);
  }, []);

  const getStatusConfig = (status) => {
    const configs = {
      delivered: { color: 'success', icon: <CheckCircle />, label: 'Delivered' },
      in_transit: { color: 'primary', icon: <LocalShipping />, label: 'In Transit' },
      pending: { color: 'warning', icon: <Schedule />, label: 'Pending' },
      delayed: { color: 'error', icon: <Warning />, label: 'Delayed' },
    };
    return configs[status] || configs.pending;
  };

  const getPriorityColor = (priority) => {
    const colors = { urgent: 'error', high: 'warning', normal: 'default' };
    return colors[priority] || 'default';
  };

  const handleViewMap = async (shipment) => {
    setSelectedShipment(shipment);
    setMapDialogOpen(true);
    setLoading(true);

    try {
      const waypoints = [shipment.origin.coordinates];
      
      if (shipment.currentLocation && shipment.status === 'in_transit') {
        waypoints.push(shipment.currentLocation.coordinates);
      }
      
      waypoints.push(shipment.destination.coordinates);

      const route = await getTrafficRoute(waypoints);
      setRouteData({
        ...route,
        color: shipment.status === 'delayed' ? '#f44336' : '#1976d2',
        showArrows: true,
      });
    } catch (error) {
      console.error('Failed to load route:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const filteredShipments = shipments.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return s.id.toLowerCase().includes(query) ||
             s.orderNumber.toLowerCase().includes(query) ||
             s.driver.name.toLowerCase().includes(query) ||
             s.destination.name.toLowerCase().includes(query);
    }
    return true;
  });

  const statusCounts = {
    all: shipments.length,
    in_transit: shipments.filter(s => s.status === 'in_transit').length,
    pending: shipments.filter(s => s.status === 'pending').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    delayed: shipments.filter(s => s.status === 'delayed').length,
  };

  const mapLocations = selectedShipment ? [
    {
      id: 'origin',
      type: 'warehouse',
      coordinates: selectedShipment.origin.coordinates,
      name: selectedShipment.origin.name,
      address: selectedShipment.origin.address,
    },
    ...(selectedShipment.currentLocation && ['in_transit', 'delayed'].includes(selectedShipment.status) ? [{
      id: 'current',
      type: 'truck',
      coordinates: selectedShipment.currentLocation.coordinates,
      name: 'Current Location',
      address: selectedShipment.currentLocation.address,
      info: selectedShipment.currentLocation.speed ? `${selectedShipment.currentLocation.speed} mph ${selectedShipment.currentLocation.heading}` : null,
    }] : []),
    {
      id: 'destination',
      type: 'destination',
      coordinates: selectedShipment.destination.coordinates,
      name: selectedShipment.destination.name,
      address: selectedShipment.destination.address,
      eta: selectedShipment.estimatedArrival ? formatTime(selectedShipment.estimatedArrival) : null,
    },
  ] : [];

  const mapRoutes = routeData ? [routeData] : [];

  // Overview map for all shipments
  const allLocations = shipments
    .filter(s => s.status === 'in_transit' || s.status === 'delayed')
    .flatMap(s => [
      {
        id: `${s.id}-truck`,
        type: 'truck',
        coordinates: s.currentLocation?.coordinates || s.origin.coordinates,
        name: s.id,
        address: s.driver.name,
        info: s.status === 'delayed' ? '⚠️ Delayed' : null,
      },
    ]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Shipment Tracking
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time GPS tracking with traffic-aware routing
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search shipments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
            }}
            sx={{ width: 250 }}
          />
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, v) => v && setViewMode(v)}
            size="small"
          >
            <ToggleButton value="grid"><ViewModule /></ToggleButton>
            <ToggleButton value="list"><ViewList /></ToggleButton>
            <ToggleButton value="map"><MapIcon /></ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Status Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={statusFilter} onChange={(e, v) => setStatusFilter(v)}>
          <Tab 
            value="all" 
            label={
              <Badge badgeContent={statusCounts.all} color="primary">
                <Box sx={{ pr: 2 }}>All</Box>
              </Badge>
            } 
          />
          <Tab 
            value="in_transit" 
            label={
              <Badge badgeContent={statusCounts.in_transit} color="info">
                <Box sx={{ pr: 2 }}>In Transit</Box>
              </Badge>
            } 
          />
          <Tab 
            value="pending" 
            label={
              <Badge badgeContent={statusCounts.pending} color="warning">
                <Box sx={{ pr: 2 }}>Pending</Box>
              </Badge>
            } 
          />
          <Tab 
            value="delayed" 
            label={
              <Badge badgeContent={statusCounts.delayed} color="error">
                <Box sx={{ pr: 2 }}>Delayed</Box>
              </Badge>
            } 
          />
          <Tab 
            value="delivered" 
            label={
              <Badge badgeContent={statusCounts.delivered} color="success">
                <Box sx={{ pr: 2 }}>Delivered</Box>
              </Badge>
            } 
          />
        </Tabs>
      </Paper>

      {/* Map View */}
      {viewMode === 'map' && (
        <Paper sx={{ p: 2, mb: 3, height: 500 }}>
          <Typography variant="h6" gutterBottom>Fleet Overview</Typography>
          <MapComponent
            locations={allLocations}
            center={[-87.6298, 41.8781]}
            zoom={6}
            height="430px"
            showControls={true}
            showStyleSwitcher={true}
            showTraffic={true}
            onMarkerClick={(loc) => {
              const shipment = shipments.find(s => s.id === loc.name);
              if (shipment) handleViewMap(shipment);
            }}
          />
        </Paper>
      )}

      {/* Shipment Cards/List */}
      <Grid container spacing={3}>
        {filteredShipments.map((shipment) => {
          const statusConfig = getStatusConfig(shipment.status);
          
          return (
            <Grid item xs={12} md={viewMode === 'list' ? 12 : 6} lg={viewMode === 'list' ? 12 : 4} key={shipment.id}>
              <Card sx={{ 
                height: '100%',
                borderLeft: 4,
                borderColor: `${statusConfig.color}.main`,
              }}>
                <CardContent>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6">{shipment.id}</Typography>
                      {shipment.priority === 'urgent' && (
                        <Chip label="URGENT" size="small" color="error" />
                      )}
                    </Box>
                    <Chip
                      icon={statusConfig.icon}
                      label={statusConfig.label}
                      color={statusConfig.color}
                      size="small"
                    />
                  </Box>

                  {/* Progress */}
                  {shipment.status !== 'pending' && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">Progress</Typography>
                        <Typography variant="caption" color="text.secondary">{shipment.progress}%</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={shipment.progress} 
                        color={statusConfig.color}
                        sx={{ height: 6, borderRadius: 1 }}
                      />
                    </Box>
                  )}

                  {/* Route Info */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                      <LocationOn sx={{ fontSize: 18, color: 'success.main', mt: 0.3 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={500}>{shipment.origin.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{shipment.origin.address}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Room sx={{ fontSize: 18, color: 'error.main', mt: 0.3 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={500}>{shipment.destination.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{shipment.destination.address}</Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Driver & Vehicle */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 14 }}>
                      {shipment.driver.avatar}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}>{shipment.driver.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{shipment.vehicle.number} • {shipment.vehicle.type}</Typography>
                    </Box>
                    <Tooltip title="Call Driver">
                      <IconButton size="small" href={`tel:${shipment.driver.phone}`}>
                        <Phone fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Cargo Info */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip label={`${shipment.cargo.items} items`} size="small" variant="outlined" />
                    <Chip label={`${shipment.cargo.weight.toLocaleString()} lbs`} size="small" variant="outlined" />
                  </Box>

                  {/* Status-specific info */}
                  {shipment.status === 'in_transit' && shipment.currentLocation && (
                    <Box sx={{ bgcolor: 'info.50', p: 1.5, borderRadius: 1, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Speed fontSize="small" color="info" />
                        <Typography variant="body2">
                          {shipment.currentLocation.speed} mph • {shipment.currentLocation.heading}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Last update: {formatDate(shipment.currentLocation.lastUpdate)}
                      </Typography>
                    </Box>
                  )}

                  {shipment.status === 'delayed' && (
                    <Box sx={{ bgcolor: 'error.50', p: 1.5, borderRadius: 1, mb: 2 }}>
                      <Typography variant="body2" color="error.dark">
                        ⚠️ {shipment.delayReason}
                      </Typography>
                    </Box>
                  )}

                  {/* ETA / Delivery Time */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <AccessTime fontSize="small" color="action" />
                    {shipment.status === 'in_transit' || shipment.status === 'delayed' ? (
                      <Typography variant="body2">
                        ETA: <strong>{formatDate(shipment.estimatedArrival)}</strong>
                      </Typography>
                    ) : shipment.status === 'delivered' ? (
                      <Typography variant="body2" color="success.main">
                        Delivered: {formatDate(shipment.deliveredAt)}
                      </Typography>
                    ) : (
                      <Typography variant="body2">
                        Scheduled: {formatDate(shipment.estimatedDeparture)}
                      </Typography>
                    )}
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<MapIcon />}
                      onClick={() => handleViewMap(shipment)}
                      size="small"
                    >
                      Track on Map
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Timeline />}
                      onClick={() => handleViewMap(shipment)}
                      size="small"
                    >
                      Timeline
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Map Dialog */}
      <Dialog
        open={mapDialogOpen}
        onClose={() => setMapDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">
              {selectedShipment?.id} - Live Tracking
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {selectedShipment?.cargo.description}
            </Typography>
          </Box>
          {selectedShipment && (
            <Chip
              icon={getStatusConfig(selectedShipment.status).icon}
              label={getStatusConfig(selectedShipment.status).label}
              color={getStatusConfig(selectedShipment.status).color}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {selectedShipment && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                {loading && <LinearProgress sx={{ mb: 1 }} />}
                <MapComponent
                  locations={mapLocations}
                  routes={mapRoutes}
                  center={selectedShipment.currentLocation?.coordinates || selectedShipment.origin.coordinates}
                  zoom={8}
                  height="450px"
                  showControls={true}
                  showStyleSwitcher={true}
                  showTraffic={true}
                  show3D={false}
                  fitBounds={true}
                  padding={60}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                {/* Route Stats */}
                {routeData && (
                  <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom>Route Information</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Distance</Typography>
                        <Typography variant="body2" fontWeight={500}>{routeData.distance?.toFixed(1)} mi</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Duration (w/ traffic)</Typography>
                        <Typography variant="body2" fontWeight={500}>{Math.round(routeData.duration)} min</Typography>
                      </Box>
                      {selectedShipment.estimatedArrival && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">ETA</Typography>
                          <Typography variant="body2" fontWeight={500} color="primary">
                            {formatTime(selectedShipment.estimatedArrival)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                )}

                {/* Timeline */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <Timeline sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle' }} />
                    Shipment Timeline
                  </Typography>
                  <List dense>
                    {selectedShipment.timeline.map((event, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: index === selectedShipment.timeline.length - 1 ? 'primary.main' : 'grey.300',
                            fontSize: 12,
                          }}>
                            {index + 1}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={event.event}
                          secondary={`${event.time} • ${event.location}`}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>

                {/* Driver Info */}
                <Paper sx={{ p: 2, mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Driver</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>{selectedShipment.driver.avatar}</Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}>{selectedShipment.driver.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{selectedShipment.driver.phone}</Typography>
                    </Box>
                    <Button 
                      variant="outlined" 
                      size="small"
                      startIcon={<Phone />}
                      href={`tel:${selectedShipment.driver.phone}`}
                    >
                      Call
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMapDialogOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<Navigation />}>
            Get Directions
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShipmentTrackingScreen;
