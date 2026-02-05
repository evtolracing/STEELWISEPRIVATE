import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Button,
  Grid,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Badge,
  Divider,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  LocalShipping,
  LocationOn,
  Schedule,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Visibility,
  Refresh,
  Search,
  FilterList,
  MoreVert,
  Flight,
  DirectionsBoat,
  DirectionsRailway,
  ArrowForward,
  Phone,
  Assignment,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Mock shipments by status
const mockShipments = {
  BOOKED: [
    {
      id: 'SHIP-2026-000426',
      carrier: 'FastFreight Trucking',
      mode: 'FTL',
      origin: 'Detroit Branch',
      destination: 'Chicago, IL',
      customer: 'AutoMax Manufacturing',
      packages: 3,
      weight: 8500,
      pickupTime: '2026-02-05 08:00 AM',
      eta: '2026-02-05 02:00 PM',
      priority: 'STANDARD',
      value: 450,
    },
    {
      id: 'SHIP-2026-000427',
      carrier: 'Regional Logistics',
      mode: 'LTL',
      origin: 'Toledo Facility',
      destination: 'Columbus, OH',
      customer: 'Industrial Parts Inc',
      packages: 2,
      weight: 2200,
      pickupTime: '2026-02-05 10:00 AM',
      eta: '2026-02-05 03:00 PM',
      priority: 'RUSH',
      value: 285,
    },
  ],
  IN_TRANSIT: [
    {
      id: 'SHIP-2026-000425',
      carrier: 'FastFreight Trucking',
      mode: 'LTL',
      origin: 'Detroit Branch',
      destination: 'Chicago, IL',
      customer: 'AutoMax Manufacturing',
      packages: 2,
      weight: 4300,
      pickupTime: '2026-02-04 08:15 AM',
      eta: '2026-02-04 01:45 PM',
      priority: 'HOT',
      value: 385,
      currentLocation: 'En route from Toledo, OH',
      progress: 65,
      driver: 'Mike Thompson',
      driverPhone: '+1 (555) 234-5678',
    },
    {
      id: 'SHIP-2026-000420',
      carrier: 'National Carriers',
      mode: 'FTL',
      origin: 'Detroit Branch',
      destination: 'Cleveland, OH',
      customer: 'Steel Solutions LLC',
      packages: 5,
      weight: 12000,
      pickupTime: '2026-02-04 06:00 AM',
      eta: '2026-02-04 10:00 AM',
      priority: 'STANDARD',
      value: 520,
      currentLocation: 'Near Cleveland, OH',
      progress: 90,
      driver: 'John Davis',
      driverPhone: '+1 (555) 345-6789',
      alert: 'slight_delay',
      alertMessage: 'Traffic delay - ETA pushed 15 min',
    },
    {
      id: 'SHIP-2026-000418',
      carrier: 'Express Freight',
      mode: 'AIR',
      origin: 'Detroit Branch',
      destination: 'Los Angeles, CA',
      customer: 'Pacific Industries',
      packages: 1,
      weight: 450,
      pickupTime: '2026-02-03 02:00 PM',
      eta: '2026-02-04 06:00 PM',
      priority: 'HOT',
      value: 1250,
      currentLocation: 'In flight - Phoenix, AZ',
      progress: 75,
    },
  ],
  OUT_FOR_DELIVERY: [
    {
      id: 'SHIP-2026-000415',
      carrier: 'Local Express',
      mode: 'LTL',
      origin: 'Detroit Branch',
      destination: 'Ann Arbor, MI',
      customer: 'University Research Lab',
      packages: 1,
      weight: 800,
      pickupTime: '2026-02-04 07:00 AM',
      eta: '2026-02-04 11:30 AM',
      priority: 'STANDARD',
      value: 125,
      currentLocation: 'Out for delivery',
      progress: 95,
      driver: 'Sarah Wilson',
      driverPhone: '+1 (555) 456-7890',
    },
  ],
  DELIVERED: [
    {
      id: 'SHIP-2026-000410',
      carrier: 'Regional Logistics',
      mode: 'LTL',
      origin: 'Detroit Branch',
      destination: 'Toledo, OH',
      customer: 'Industrial Parts LLC',
      packages: 2,
      weight: 3200,
      deliveredAt: '2026-02-03 02:15 PM',
      signedBy: 'John Smith',
      priority: 'STANDARD',
      value: 210,
      hasPOD: true,
    },
    {
      id: 'SHIP-2026-000408',
      carrier: 'FastFreight Trucking',
      mode: 'FTL',
      origin: 'Detroit Branch',
      destination: 'Indianapolis, IN',
      customer: 'Midwest Manufacturing',
      packages: 4,
      weight: 9500,
      deliveredAt: '2026-02-03 10:45 AM',
      signedBy: 'Mary Johnson',
      priority: 'RUSH',
      value: 485,
      hasPOD: true,
    },
    {
      id: 'SHIP-2026-000405',
      carrier: 'Express Freight',
      mode: 'AIR',
      origin: 'Detroit Branch',
      destination: 'New York, NY',
      customer: 'Empire Steel Corp',
      packages: 1,
      weight: 350,
      deliveredAt: '2026-02-02 04:30 PM',
      signedBy: 'Robert Brown',
      priority: 'HOT',
      value: 890,
      hasPOD: true,
    },
  ],
};

const ShipmentTrackingBoard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);

  const statusColumns = [
    { key: 'BOOKED', label: 'Booked', color: 'info', icon: <Assignment /> },
    { key: 'IN_TRANSIT', label: 'In Transit', color: 'primary', icon: <LocalShipping /> },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: 'warning', icon: <LocationOn /> },
    { key: 'DELIVERED', label: 'Delivered', color: 'success', icon: <CheckCircle /> },
  ];

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'AIR': return <Flight fontSize="small" />;
      case 'RAIL': return <DirectionsRailway fontSize="small" />;
      case 'OCEAN': return <DirectionsBoat fontSize="small" />;
      default: return <LocalShipping fontSize="small" />;
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'HOT': 'error',
      'RUSH': 'warning',
      'STANDARD': 'default',
    };
    return colors[priority] || 'default';
  };

  const handleMenuOpen = (event, shipment) => {
    setAnchorEl(event.currentTarget);
    setSelectedShipment(shipment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedShipment(null);
  };

  const ShipmentCard = ({ shipment, status }) => (
    <Card 
      sx={{ 
        mb: 1.5, 
        cursor: 'pointer',
        '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' },
        transition: 'all 0.2s',
        borderLeft: 3,
        borderColor: getPriorityColor(shipment.priority) + '.main',
      }}
      onClick={() => navigate(`/freight/route/${shipment.id}`)}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="body2" fontWeight={600} color="primary.main">
              {shipment.id}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {shipment.customer}
            </Typography>
          </Box>
          <IconButton 
            size="small" 
            onClick={(e) => { e.stopPropagation(); handleMenuOpen(e, shipment); }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>

        {/* Route */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Typography variant="caption" noWrap sx={{ maxWidth: 80 }}>
            {shipment.origin}
          </Typography>
          <ArrowForward fontSize="small" color="action" />
          <Typography variant="caption" noWrap fontWeight={500}>
            {shipment.destination}
          </Typography>
        </Box>

        {/* Carrier & Mode */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          {getModeIcon(shipment.mode)}
          <Typography variant="caption" color="text.secondary" noWrap>
            {shipment.carrier}
          </Typography>
          <Chip label={shipment.mode} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
        </Box>

        {/* Progress (for in-transit shipments) */}
        {shipment.progress && status !== 'DELIVERED' && (
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {shipment.currentLocation}
              </Typography>
              <Typography variant="caption" fontWeight={600}>
                {shipment.progress}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={shipment.progress} 
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}

        {/* Alert */}
        {shipment.alert && (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5, 
              bgcolor: 'warning.50', 
              p: 0.75, 
              borderRadius: 1,
              mb: 1.5,
            }}
          >
            <Warning fontSize="small" color="warning" />
            <Typography variant="caption" color="warning.dark">
              {shipment.alertMessage}
            </Typography>
          </Box>
        )}

        {/* Footer Stats */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={shipment.priority}
              size="small"
              color={getPriorityColor(shipment.priority)}
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
            <Chip 
              label={`${shipment.packages} pkg`}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {status === 'DELIVERED' 
              ? `Signed: ${shipment.signedBy}`
              : `ETA: ${shipment.eta?.split(' ').slice(-2).join(' ') || '-'}`
            }
          </Typography>
        </Box>

        {/* Delivered specific */}
        {status === 'DELIVERED' && shipment.hasPOD && (
          <Button 
            size="small" 
            variant="text" 
            sx={{ mt: 1, p: 0 }}
            onClick={(e) => { e.stopPropagation(); navigate(`/freight/pod/${shipment.id}`); }}
          >
            View POD
          </Button>
        )}
      </CardContent>
    </Card>
  );

  const totalShipments = Object.values(mockShipments).flat().length;
  const inTransitCount = mockShipments.IN_TRANSIT.length + mockShipments.OUT_FOR_DELIVERY.length;
  const hotCount = Object.values(mockShipments).flat().filter(s => s.priority === 'HOT').length;

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Shipment Tracking Board
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time shipment visibility and tracking
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Refresh />}>
            Refresh
          </Button>
          <Button 
            variant="contained" 
            startIcon={<LocalShipping />}
            onClick={() => navigate('/freight/planner')}
          >
            New Shipment
          </Button>
        </Box>
      </Box>

      {/* Stats Bar */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700} color="primary.main">
              {totalShipments}
            </Typography>
            <Typography variant="caption" color="text.secondary">Total Active</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700} color="info.main">
              {inTransitCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">In Transit</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700} color="error.main">
              {hotCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">HOT Priority</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700} color="success.main">
              {mockShipments.DELIVERED.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">Delivered Today</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Search & Filter Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search shipments, carriers, customers..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1, maxWidth: 400 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="outlined" startIcon={<FilterList />}>
            Filter
          </Button>
        </Box>
      </Paper>

      {/* Kanban Board */}
      <Grid container spacing={2}>
        {statusColumns.map((column) => (
          <Grid item xs={12} md={3} key={column.key}>
            <Paper sx={{ p: 2, bgcolor: 'grey.100', minHeight: 400 }}>
              {/* Column Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: column.color + '.main', 
                      width: 28, 
                      height: 28,
                    }}
                  >
                    {React.cloneElement(column.icon, { sx: { fontSize: 16 } })}
                  </Avatar>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {column.label}
                  </Typography>
                </Box>
                <Chip 
                  label={mockShipments[column.key].length}
                  size="small"
                  color={column.color}
                  sx={{ height: 22, minWidth: 28 }}
                />
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Cards */}
              <Box sx={{ maxHeight: 'calc(100vh - 420px)', overflowY: 'auto' }}>
                {mockShipments[column.key].map((shipment) => (
                  <ShipmentCard 
                    key={shipment.id} 
                    shipment={shipment} 
                    status={column.key}
                  />
                ))}

                {mockShipments[column.key].length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No shipments
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleMenuClose(); navigate(`/freight/route/${selectedShipment?.id}`); }}>
          <Visibility fontSize="small" sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Phone fontSize="small" sx={{ mr: 1 }} /> Contact Driver
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Warning fontSize="small" sx={{ mr: 1 }} /> Report Exception
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ShipmentTrackingBoard;
