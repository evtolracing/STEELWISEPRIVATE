import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Badge,
  Card,
  CardContent,
} from '@mui/material';
import {
  Factory,
  LocalShipping,
  Inventory2,
  Speed,
  Warning,
  CheckCircle,
  Error,
  ZoomIn,
  ZoomOut,
  Refresh,
  Fullscreen,
  Layers,
  Timeline,
  PlayArrow,
  Pause,
  SkipNext,
  Build,
  People,
  TrendingUp,
  TrendingDown,
  DirectionsCar,
  Schedule,
  CenterFocusStrong,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Mock digital twin data
const mockTwinData = {
  timestamp: '2026-02-04T14:34:00Z',
  
  locations: [
    {
      id: 'DET',
      name: 'Detroit Plant',
      type: 'PRODUCTION',
      coordinates: { x: 200, y: 150 },
      status: 'CRITICAL',
      utilization: 97,
      workCenters: 8,
      activeJobs: 24,
      workforce: 45,
      metrics: {
        throughput: '42,500 lbs/day',
        efficiency: '91%',
        quality: '99.2%',
      },
      alerts: [
        { type: 'CAPACITY', message: 'Above 95% threshold', severity: 'HIGH' },
        { type: 'MAINTENANCE', message: 'SAW-01 due for service', severity: 'MEDIUM' },
      ],
    },
    {
      id: 'CLE',
      name: 'Cleveland Plant',
      type: 'PRODUCTION',
      coordinates: { x: 280, y: 180 },
      status: 'OPTIMAL',
      utilization: 58,
      workCenters: 6,
      activeJobs: 12,
      workforce: 32,
      metrics: {
        throughput: '28,000 lbs/day',
        efficiency: '94%',
        quality: '99.5%',
      },
      alerts: [],
    },
    {
      id: 'CHI',
      name: 'Chicago Plant',
      type: 'PRODUCTION',
      coordinates: { x: 180, y: 200 },
      status: 'OPTIMAL',
      utilization: 82,
      workCenters: 10,
      activeJobs: 28,
      workforce: 52,
      metrics: {
        throughput: '51,000 lbs/day',
        efficiency: '92%',
        quality: '99.1%',
      },
      alerts: [],
    },
    {
      id: 'WH1',
      name: 'Main Warehouse',
      type: 'WAREHOUSE',
      coordinates: { x: 240, y: 250 },
      status: 'OPTIMAL',
      capacity: 85,
      skuCount: 1250,
      metrics: {
        inventoryValue: '$4.2M',
        turnover: '8.2x',
        accuracy: '99.8%',
      },
      alerts: [
        { type: 'INVENTORY', message: '4 items below reorder', severity: 'MEDIUM' },
      ],
    },
  ],
  
  logistics: [
    { id: 'LANE1', from: 'DET', to: 'CHI', activeShipments: 3, status: 'ACTIVE' },
    { id: 'LANE2', from: 'CLE', to: 'DET', activeShipments: 1, status: 'ACTIVE' },
    { id: 'LANE3', from: 'WH1', to: 'DET', activeShipments: 2, status: 'ACTIVE' },
    { id: 'LANE4', from: 'WH1', to: 'CLE', activeShipments: 1, status: 'ACTIVE' },
    { id: 'LANE5', from: 'WH1', to: 'CHI', activeShipments: 2, status: 'ACTIVE' },
  ],
  
  inboundShipments: [
    { id: 'PO-2026-1234', from: 'Supplier A', to: 'WH1', eta: '2026-02-05', status: 'IN_TRANSIT' },
    { id: 'PO-2026-1235', from: 'Supplier B', to: 'DET', eta: '2026-02-06', status: 'IN_TRANSIT' },
  ],
  
  outboundShipments: [
    { id: 'ORD-2026-4521', from: 'DET', to: 'Customer A', departure: '2026-02-04 16:00', status: 'LOADING' },
    { id: 'ORD-2026-4522', from: 'CHI', to: 'Customer B', departure: '2026-02-04 17:30', status: 'SCHEDULED' },
  ],
  
  workCenters: [
    { id: 'SAW-01', location: 'DET', type: 'SAW', status: 'RUNNING', utilization: 98, currentJob: 'JOB-2026-1234' },
    { id: 'SAW-02', location: 'DET', type: 'SAW', status: 'RUNNING', utilization: 95, currentJob: 'JOB-2026-1235' },
    { id: 'LAT-01', location: 'DET', type: 'LATHE', status: 'RUNNING', utilization: 92, currentJob: 'JOB-2026-1236' },
    { id: 'SAW-03', location: 'CLE', type: 'SAW', status: 'IDLE', utilization: 0, currentJob: null },
    { id: 'LAT-02', location: 'CLE', type: 'LATHE', status: 'RUNNING', utilization: 78, currentJob: 'JOB-2026-1240' },
    { id: 'SAW-04', location: 'CHI', type: 'SAW', status: 'RUNNING', utilization: 85, currentJob: 'JOB-2026-1245' },
  ],
};

const layerOptions = [
  { id: 'locations', label: 'Locations', icon: <Factory />, default: true },
  { id: 'logistics', label: 'Logistics Lanes', icon: <LocalShipping />, default: true },
  { id: 'inventory', label: 'Inventory', icon: <Inventory2 />, default: true },
  { id: 'capacity', label: 'Capacity Heat', icon: <Speed />, default: true },
  { id: 'alerts', label: 'Alerts', icon: <Warning />, default: true },
  { id: 'workforce', label: 'Workforce', icon: <People />, default: false },
];

const DigitalTwinViewer = () => {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeLayers, setActiveLayers] = useState(['locations', 'logistics', 'capacity', 'alerts']);
  const [zoom, setZoom] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeOffset, setTimeOffset] = useState(0);
  const [viewMode, setViewMode] = useState('MAP');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const toggleLayer = (layerId) => {
    setActiveLayers(prev => 
      prev.includes(layerId) 
        ? prev.filter(l => l !== layerId)
        : [...prev, layerId]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CRITICAL': return '#f44336';
      case 'WARNING': return '#ff9800';
      case 'OPTIMAL': return '#4caf50';
      case 'IDLE': return '#9e9e9e';
      default: return '#2196f3';
    }
  };

  const getUtilizationColor = (util) => {
    if (util >= 90) return '#f44336';
    if (util >= 80) return '#ff9800';
    if (util >= 60) return '#4caf50';
    return '#2196f3';
  };

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
    setDetailDialogOpen(true);
  };

  // Simple map visualization
  const renderMap = () => (
    <Box 
      sx={{ 
        position: 'relative', 
        width: '100%', 
        height: 400, 
        bgcolor: '#e3f2fd',
        borderRadius: 2,
        overflow: 'hidden',
        transform: `scale(${zoom})`,
        transformOrigin: 'center center',
      }}
    >
      {/* Grid lines */}
      <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.2 }}>
        {[...Array(20)].map((_, i) => (
          <React.Fragment key={i}>
            <line x1={i * 40} y1="0" x2={i * 40} y2="400" stroke="#1976d2" strokeWidth="1" />
            <line x1="0" y1={i * 40} x2="100%" y2={i * 40} stroke="#1976d2" strokeWidth="1" />
          </React.Fragment>
        ))}
      </svg>

      {/* Logistics Lanes */}
      {activeLayers.includes('logistics') && (
        <svg width="100%" height="100%" style={{ position: 'absolute' }}>
          {mockTwinData.logistics.map((lane) => {
            const from = mockTwinData.locations.find(l => l.id === lane.from);
            const to = mockTwinData.locations.find(l => l.id === lane.to);
            if (!from || !to) return null;
            return (
              <g key={lane.id}>
                <line
                  x1={from.coordinates.x}
                  y1={from.coordinates.y}
                  x2={to.coordinates.x}
                  y2={to.coordinates.y}
                  stroke="#1976d2"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.6"
                />
                {/* Shipment indicator */}
                {lane.activeShipments > 0 && (
                  <circle
                    cx={(from.coordinates.x + to.coordinates.x) / 2}
                    cy={(from.coordinates.y + to.coordinates.y) / 2}
                    r="8"
                    fill="#1976d2"
                  />
                )}
              </g>
            );
          })}
        </svg>
      )}

      {/* Locations */}
      {activeLayers.includes('locations') && mockTwinData.locations.map((location) => (
        <Tooltip 
          key={location.id} 
          title={`${location.name} - ${location.utilization || location.capacity}% ${location.type === 'PRODUCTION' ? 'Utilization' : 'Capacity'}`}
        >
          <Box
            onClick={() => handleLocationClick(location)}
            sx={{
              position: 'absolute',
              left: location.coordinates.x - 30,
              top: location.coordinates.y - 30,
              width: 60,
              height: 60,
              borderRadius: '50%',
              bgcolor: 'white',
              border: 4,
              borderColor: getStatusColor(location.status),
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: 2,
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: 4,
              },
            }}
          >
            {location.type === 'PRODUCTION' ? (
              <Factory sx={{ color: getStatusColor(location.status) }} />
            ) : (
              <Inventory2 sx={{ color: getStatusColor(location.status) }} />
            )}
            <Typography variant="caption" fontWeight={600}>
              {location.id}
            </Typography>
            
            {/* Alert badge */}
            {activeLayers.includes('alerts') && location.alerts.length > 0 && (
              <Badge
                badgeContent={location.alerts.length}
                color="error"
                sx={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                }}
              />
            )}
            
            {/* Capacity indicator */}
            {activeLayers.includes('capacity') && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -8,
                  width: 40,
                  height: 4,
                  bgcolor: 'grey.300',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    width: `${location.utilization || location.capacity}%`,
                    height: '100%',
                    bgcolor: getUtilizationColor(location.utilization || location.capacity),
                  }}
                />
              </Box>
            )}
          </Box>
        </Tooltip>
      ))}

      {/* Legend */}
      <Paper sx={{ position: 'absolute', bottom: 10, left: 10, p: 1 }}>
        <Typography variant="caption" fontWeight={600}>Status</Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4caf50' }} />
            <Typography variant="caption">Optimal</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff9800' }} />
            <Typography variant="caption">Warning</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f44336' }} />
            <Typography variant="caption">Critical</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Digital Twin Viewer
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time visualization of operational state • Updated {new Date(mockTwinData.timestamp).toLocaleTimeString()}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/executive/cockpit')}>
            Back to Cockpit
          </Button>
          <IconButton onClick={() => setZoom(Math.min(zoom + 0.1, 1.5))}><ZoomIn /></IconButton>
          <IconButton onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}><ZoomOut /></IconButton>
          <IconButton><CenterFocusStrong /></IconButton>
          <IconButton><Fullscreen /></IconButton>
          <Button variant="contained" startIcon={<Refresh />}>
            Refresh
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Layer Controls */}
        <Grid item xs={12} md={2}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              <Layers sx={{ mr: 1, verticalAlign: 'middle', fontSize: 18 }} />
              Layers
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {layerOptions.map((layer) => (
              <FormControlLabel
                key={layer.id}
                control={
                  <Switch
                    size="small"
                    checked={activeLayers.includes(layer.id)}
                    onChange={() => toggleLayer(layer.id)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {layer.icon}
                    <Typography variant="body2">{layer.label}</Typography>
                  </Box>
                }
                sx={{ display: 'flex', mb: 1 }}
              />
            ))}
          </Paper>

          {/* Time Controls */}
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              <Timeline sx={{ mr: 1, verticalAlign: 'middle', fontSize: 18 }} />
              Time Travel
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
              <IconButton size="small">
                <SkipNext sx={{ transform: 'rotate(180deg)' }} />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => setIsPlaying(!isPlaying)}
                color={isPlaying ? 'primary' : 'default'}
              >
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
              <IconButton size="small">
                <SkipNext />
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mt: 1 }}>
              {timeOffset === 0 ? 'Live' : `${Math.abs(timeOffset)} hours ${timeOffset < 0 ? 'ago' : 'ahead'}`}
            </Typography>
            <Slider
              value={timeOffset}
              onChange={(e, val) => setTimeOffset(val)}
              min={-24}
              max={24}
              step={1}
              marks={[
                { value: -24, label: '-24h' },
                { value: 0, label: 'Now' },
                { value: 24, label: '+24h' },
              ]}
              sx={{ mt: 1 }}
            />
          </Paper>
        </Grid>

        {/* Main Map View */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Operations Map
              </Typography>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, val) => val && setViewMode(val)}
                size="small"
              >
                <ToggleButton value="MAP">Map</ToggleButton>
                <ToggleButton value="SCHEMATIC">Schematic</ToggleButton>
                <ToggleButton value="TABLE">Table</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            
            {renderMap()}
          </Paper>

          {/* Active Shipments */}
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Active Shipments
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  INBOUND
                </Typography>
                {mockTwinData.inboundShipments.map((ship) => (
                  <Paper key={ship.id} sx={{ p: 1, mt: 1, bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight={500}>{ship.id}</Typography>
                      <Chip label={ship.status.replace(/_/g, ' ')} size="small" color="info" sx={{ height: 18 }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {ship.from} → {ship.to} • ETA: {ship.eta}
                    </Typography>
                  </Paper>
                ))}
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  OUTBOUND
                </Typography>
                {mockTwinData.outboundShipments.map((ship) => (
                  <Paper key={ship.id} sx={{ p: 1, mt: 1, bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight={500}>{ship.id}</Typography>
                      <Chip 
                        label={ship.status} 
                        size="small" 
                        color={ship.status === 'LOADING' ? 'warning' : 'default'} 
                        sx={{ height: 18 }} 
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {ship.from} → Customer • Departure: {ship.departure}
                    </Typography>
                  </Paper>
                ))}
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Right Panel - Details */}
        <Grid item xs={12} md={3}>
          {/* Summary Stats */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              System Summary
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Paper sx={{ p: 1.5, bgcolor: 'grey.50', textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700} color="primary.main">
                    {mockTwinData.locations.filter(l => l.type === 'PRODUCTION').length}
                  </Typography>
                  <Typography variant="caption">Plants</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 1.5, bgcolor: 'grey.50', textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700} color="primary.main">
                    {mockTwinData.workCenters.length}
                  </Typography>
                  <Typography variant="caption">Work Centers</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 1.5, bgcolor: 'grey.50', textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {mockTwinData.workCenters.filter(w => w.status === 'RUNNING').length}
                  </Typography>
                  <Typography variant="caption">Running</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 1.5, bgcolor: 'grey.50', textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700} color="error.main">
                    {mockTwinData.locations.reduce((sum, l) => sum + l.alerts.length, 0)}
                  </Typography>
                  <Typography variant="caption">Active Alerts</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>

          {/* Work Center Status */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Work Center Status
            </Typography>
            {mockTwinData.workCenters.slice(0, 5).map((wc) => (
              <Box key={wc.id} sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box 
                      sx={{ 
                        width: 8, height: 8, borderRadius: '50%',
                        bgcolor: wc.status === 'RUNNING' ? 'success.main' : 'grey.400',
                      }} 
                    />
                    <Typography variant="body2" fontWeight={500}>{wc.id}</Typography>
                    <Chip label={wc.location} size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
                  </Box>
                  <Typography variant="caption" color={getUtilizationColor(wc.utilization)}>
                    {wc.utilization}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={wc.utilization}
                  sx={{ 
                    height: 4, 
                    borderRadius: 1, 
                    mt: 0.5,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getUtilizationColor(wc.utilization),
                    },
                  }}
                />
              </Box>
            ))}
          </Paper>

          {/* Active Alerts */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Active Alerts
            </Typography>
            <List dense>
              {mockTwinData.locations
                .flatMap(l => l.alerts.map(a => ({ ...a, location: l.id })))
                .map((alert, idx) => (
                  <ListItem key={idx} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Warning color={alert.severity === 'HIGH' ? 'error' : 'warning'} fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={alert.message}
                      secondary={alert.location}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))
              }
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Location Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth>
        {selectedLocation && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: getStatusColor(selectedLocation.status) }}>
                  {selectedLocation.type === 'PRODUCTION' ? <Factory /> : <Inventory2 />}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedLocation.name}</Typography>
                  <Chip 
                    label={selectedLocation.status} 
                    size="small" 
                    sx={{ bgcolor: getStatusColor(selectedLocation.status), color: 'white' }}
                  />
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <Typography variant="h4" fontWeight={700} color={getUtilizationColor(selectedLocation.utilization || selectedLocation.capacity)}>
                      {selectedLocation.utilization || selectedLocation.capacity}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedLocation.type === 'PRODUCTION' ? 'Utilization' : 'Capacity Used'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <Typography variant="h4" fontWeight={700}>
                      {selectedLocation.workCenters || selectedLocation.skuCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedLocation.type === 'PRODUCTION' ? 'Work Centers' : 'SKUs'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Key Metrics
                  </Typography>
                  {Object.entries(selectedLocation.metrics).map(([key, value]) => (
                    <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>{value}</Typography>
                    </Box>
                  ))}
                </Grid>

                {selectedLocation.alerts.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Active Alerts
                    </Typography>
                    {selectedLocation.alerts.map((alert, idx) => (
                      <Paper 
                        key={idx} 
                        sx={{ 
                          p: 1, 
                          mb: 1, 
                          bgcolor: alert.severity === 'HIGH' ? 'error.50' : 'warning.50',
                          borderLeft: 3,
                          borderColor: alert.severity === 'HIGH' ? 'error.main' : 'warning.main',
                        }}
                      >
                        <Typography variant="body2">{alert.message}</Typography>
                        <Chip 
                          label={alert.type} 
                          size="small" 
                          sx={{ height: 16, fontSize: '0.6rem', mt: 0.5 }} 
                        />
                      </Paper>
                    ))}
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
              <Button variant="outlined" onClick={() => navigate('/executive/simulation')}>
                Run Simulation
              </Button>
              <Button variant="contained">
                View Details
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default DigitalTwinViewer;
