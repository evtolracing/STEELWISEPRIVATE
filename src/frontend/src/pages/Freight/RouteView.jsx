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
  Divider,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  LocalShipping,
  LocationOn,
  Schedule,
  CheckCircle,
  Warning,
  ArrowForward,
  Map as MapIcon,
  Timeline,
  Business,
  Person,
  Phone,
  Navigation,
  ArrowBack,
  Print,
  Share,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

// Mock route data
const routeData = {
  id: 'ROUTE-2026-000125',
  shipmentId: 'SHIP-2026-000425',
  carrier: 'FastFreight Trucking',
  driver: 'Mike Thompson',
  driverPhone: '+1 (555) 234-5678',
  truckId: 'FFT-4521',
  mode: 'LTL',
  status: 'IN_TRANSIT',
  totalMiles: 285,
  estimatedHours: 5.5,
  currentLocation: {
    city: 'Toledo',
    state: 'OH',
    lat: 41.6528,
    lng: -83.5379,
    updatedAt: '2026-02-04 11:30 AM',
  },
  origin: {
    name: 'Detroit Branch',
    address: '1500 Industrial Ave, Detroit, MI 48207',
    contact: 'Shipping Dept',
    phone: '+1 (555) 123-4567',
  },
  stops: [
    {
      sequence: 1,
      type: 'PICKUP',
      location: {
        name: 'Detroit Branch',
        address: '1500 Industrial Ave, Detroit, MI 48207',
        city: 'Detroit',
        state: 'MI',
      },
      scheduledTime: '2026-02-04 08:00 AM',
      actualTime: '2026-02-04 08:15 AM',
      status: 'COMPLETED',
      packages: ['PKG-2026-000052', 'PKG-2026-000053'],
      weight: 4300,
      notes: 'Picked up on time',
    },
    {
      sequence: 2,
      type: 'DELIVERY',
      location: {
        name: 'Industrial Parts LLC',
        address: '800 Commerce Dr, Toledo, OH 43615',
        city: 'Toledo',
        state: 'OH',
      },
      scheduledTime: '2026-02-04 10:30 AM',
      actualTime: '2026-02-04 10:45 AM',
      status: 'COMPLETED',
      packages: ['PKG-2026-000052'],
      weight: 1500,
      contact: 'John Smith',
      phone: '+1 (555) 345-6789',
      notes: 'Delivered to receiving dock',
    },
    {
      sequence: 3,
      type: 'DELIVERY',
      location: {
        name: 'AutoMax Manufacturing',
        address: '4500 Industrial Blvd, Chicago, IL 60632',
        city: 'Chicago',
        state: 'IL',
      },
      scheduledTime: '2026-02-04 02:00 PM',
      actualTime: null,
      status: 'EN_ROUTE',
      packages: ['PKG-2026-000053'],
      weight: 2800,
      contact: 'Sarah Johnson',
      phone: '+1 (555) 456-7890',
      eta: '2026-02-04 01:45 PM',
      notes: 'Call 30 min before arrival',
    },
  ],
  timeline: [
    { time: '2026-02-04 07:30 AM', event: 'Driver arrived at Detroit Branch', status: 'info' },
    { time: '2026-02-04 08:15 AM', event: 'Pickup completed - 2 packages loaded', status: 'success' },
    { time: '2026-02-04 08:20 AM', event: 'Departed Detroit Branch', status: 'info' },
    { time: '2026-02-04 10:45 AM', event: 'Delivered to Industrial Parts LLC', status: 'success' },
    { time: '2026-02-04 10:55 AM', event: 'Departed Toledo stop', status: 'info' },
    { time: '2026-02-04 11:30 AM', event: 'In transit to Chicago (ETA 1:45 PM)', status: 'info' },
  ],
};

const RouteView = () => {
  const navigate = useNavigate();
  const { shipmentId } = useParams();
  const [expandedStop, setExpandedStop] = useState(2); // EN_ROUTE stop

  const getStopStatusColor = (status) => {
    const colors = {
      'COMPLETED': 'success',
      'EN_ROUTE': 'primary',
      'PENDING': 'default',
      'DELAYED': 'warning',
      'FAILED': 'error',
    };
    return colors[status] || 'default';
  };

  const getStopIcon = (type, status) => {
    if (status === 'COMPLETED') return <CheckCircle color="success" />;
    if (type === 'PICKUP') return <Business color="primary" />;
    return <LocationOn color={status === 'EN_ROUTE' ? 'primary' : 'action'} />;
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={() => navigate('/freight/tracking')}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Route View
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {routeData.id} • {routeData.shipmentId}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Print />}>
            Print Route
          </Button>
          <Button variant="outlined" startIcon={<Share />}>
            Share Tracking
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Route Map Placeholder */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Route Map
              </Typography>
              <Chip 
                icon={<Navigation />} 
                label={`${routeData.totalMiles} miles • ${routeData.estimatedHours} hours`}
                variant="outlined"
              />
            </Box>
            
            {/* Map Placeholder */}
            <Box 
              sx={{ 
                height: 400, 
                bgcolor: 'grey.200', 
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed',
                borderColor: 'grey.400',
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <MapIcon sx={{ fontSize: 64, color: 'grey.500', mb: 1 }} />
                <Typography color="text.secondary">
                  Interactive map would display here
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Detroit → Toledo → Chicago
                </Typography>
              </Box>
            </Box>

            {/* Current Location */}
            <Alert severity="info" sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    📍 Current Location: {routeData.currentLocation.city}, {routeData.currentLocation.state}
                  </Typography>
                  <Typography variant="caption">
                    Updated: {routeData.currentLocation.updatedAt}
                  </Typography>
                </Box>
                <Chip label="Live Tracking" color="primary" size="small" />
              </Box>
            </Alert>
          </Paper>

          {/* Route Stops */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Route Stops
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Stepper orientation="vertical" activeStep={routeData.stops.findIndex(s => s.status === 'EN_ROUTE')}>
              {routeData.stops.map((stop, index) => (
                <Step key={stop.sequence} expanded={expandedStop === index}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Avatar 
                        sx={{ 
                          bgcolor: getStopStatusColor(stop.status) + '.main',
                          width: 32,
                          height: 32,
                        }}
                      >
                        {getStopIcon(stop.type, stop.status)}
                      </Avatar>
                    )}
                    onClick={() => setExpandedStop(expandedStop === index ? -1 : index)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          {stop.type === 'PICKUP' ? 'Pickup' : `Stop ${stop.sequence - 1}`}: {stop.location.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {stop.location.city}, {stop.location.state}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip 
                          label={stop.status.replace('_', ' ')}
                          size="small"
                          color={getStopStatusColor(stop.status)}
                        />
                        {stop.status === 'EN_ROUTE' && stop.eta && (
                          <Typography variant="caption" display="block" color="primary.main">
                            ETA: {stop.eta}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </StepLabel>
                  <StepContent>
                    <Card variant="outlined" sx={{ p: 2, mt: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="caption" color="text.secondary">Address</Typography>
                          <Typography variant="body2">{stop.location.address}</Typography>
                        </Grid>
                        {stop.contact && (
                          <Grid item xs={12} md={6}>
                            <Typography variant="caption" color="text.secondary">Contact</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person fontSize="small" color="action" />
                              <Typography variant="body2">{stop.contact}</Typography>
                              <Phone fontSize="small" color="action" />
                              <Typography variant="body2">{stop.phone}</Typography>
                            </Box>
                          </Grid>
                        )}
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Scheduled</Typography>
                          <Typography variant="body2">{stop.scheduledTime}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            {stop.status === 'COMPLETED' ? 'Actual' : 'ETA'}
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {stop.actualTime || stop.eta || 'Pending'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">Packages</Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                            {stop.packages.map(pkg => (
                              <Chip key={pkg} label={pkg} size="small" variant="outlined" />
                            ))}
                            <Chip label={`${stop.weight.toLocaleString()} lbs`} size="small" />
                          </Box>
                        </Grid>
                        {stop.notes && (
                          <Grid item xs={12}>
                            <Alert severity="info" sx={{ py: 0 }}>
                              <Typography variant="caption">{stop.notes}</Typography>
                            </Alert>
                          </Grid>
                        )}
                      </Grid>
                    </Card>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Carrier & Driver Info */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Carrier Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.light', width: 48, height: 48 }}>
                <LocalShipping />
              </Avatar>
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  {routeData.carrier}
                </Typography>
                <Chip label={routeData.mode} size="small" variant="outlined" />
              </Box>
            </Box>

            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Driver</Typography>
                <Typography variant="body2" fontWeight={500}>{routeData.driver}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Truck ID</Typography>
                <Typography variant="body2" fontWeight={500}>{routeData.truckId}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Driver Phone</Typography>
                <Typography variant="body2" fontWeight={500}>{routeData.driverPhone}</Typography>
              </Grid>
            </Grid>

            <Button 
              variant="outlined" 
              fullWidth 
              startIcon={<Phone />}
              sx={{ mt: 2 }}
            >
              Contact Driver
            </Button>
          </Paper>

          {/* Timeline */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Activity Timeline
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <List dense>
              {routeData.timeline.map((event, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {event.status === 'success' ? (
                      <CheckCircle color="success" fontSize="small" />
                    ) : event.status === 'warning' ? (
                      <Warning color="warning" fontSize="small" />
                    ) : (
                      <Timeline color="info" fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={event.event}
                    secondary={event.time}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RouteView;
