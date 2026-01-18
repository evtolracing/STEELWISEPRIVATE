// Shipments Page - Kanban Board Layout
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LocalShipping as TruckIcon,
  CheckCircle as DeliveredIcon,
  Schedule as ScheduledIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { mockShipments } from '../mocks/shipmentsData';

const USE_MOCK_DATA = true;

const statusConfig = {
  READY_TO_SHIP: { label: 'Ready to Ship', color: 'info', icon: ScheduledIcon },
  IN_TRANSIT: { label: 'In Transit', color: 'warning', icon: TruckIcon },
  DELIVERED: { label: 'Delivered', color: 'success', icon: DeliveredIcon },
};

function ShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadShipments();
  }, []);

  async function loadShipments() {
    try {
      setLoading(true);
      setError(null);
      
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setShipments(mockShipments);
      } else {
        const response = await fetch('/api/shipments', { credentials: 'include' });
        const data = await response.json();
        setShipments(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const groupedShipments = {
    READY_TO_SHIP: shipments.filter(s => s.status === 'READY_TO_SHIP'),
    IN_TRANSIT: shipments.filter(s => s.status === 'IN_TRANSIT'),
    DELIVERED: shipments.filter(s => s.status === 'DELIVERED'),
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Shipment Tracking</Typography>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadShipments}>
          Refresh
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {Object.entries(groupedShipments).map(([status, items]) => {
          const config = statusConfig[status];
          const StatusIcon = config.icon;
          
          return (
            <Grid item xs={12} md={4} key={status}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50', minHeight: '70vh' }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <StatusIcon color={config.color} />
                  <Typography variant="h6">{config.label}</Typography>
                  <Chip label={items.length} size="small" />
                </Stack>
                
                <Stack spacing={2}>
                  {items.map(shipment => (
                    <Card key={shipment.id} sx={{ border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Stack spacing={1}>
                          <Stack direction="row" justifyContent="space-between" alignItems="start">
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {shipment.shipmentNumber}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {shipment.customerName}
                              </Typography>
                            </Box>
                            {shipment.bolNumber && (
                              <Chip label={shipment.bolNumber} size="small" variant="outlined" />
                            )}
                          </Stack>

                          <Stack direction="row" spacing={1} alignItems="center">
                            <TruckIcon fontSize="small" color="action" />
                            <Typography variant="caption">
                              {shipment.carrier || 'No carrier assigned'}
                            </Typography>
                          </Stack>

                          <Typography variant="caption" color="text.secondary">
                            📍 {shipment.destination}
                          </Typography>

                          {shipment.trackingNumber && (
                            <Typography variant="caption" fontFamily="monospace" sx={{ bgcolor: 'grey.100', p: 0.5, borderRadius: 0.5 }}>
                              {shipment.trackingNumber}
                            </Typography>
                          )}

                          <Stack direction="row" spacing={1}>
                            <Chip label={`${shipment.packages} packages`} size="small" variant="outlined" />
                            <Chip label={`${shipment.totalWeight.toLocaleString()} lbs`} size="small" variant="outlined" />
                          </Stack>

                          {shipment.estimatedDelivery && !shipment.actualDelivery && (
                            <Typography variant="caption" color="primary">
                              ETA: {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                            </Typography>
                          )}

                          {shipment.actualDelivery && (
                            <Typography variant="caption" color="success.main">
                              ✓ Delivered: {new Date(shipment.actualDelivery).toLocaleDateString()}
                              {shipment.signedBy && ` (${shipment.signedBy})`}
                            </Typography>
                          )}

                          {shipment.lastLocation && (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Typography variant="caption" color="warning.main">
                                📍 {shipment.lastLocation}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                • {new Date(shipment.lastUpdate).toLocaleTimeString()}
                              </Typography>
                            </Stack>
                          )}

                          {status === 'READY_TO_SHIP' && (
                            <Button size="small" variant="contained" startIcon={<TruckIcon />} fullWidth>
                              Schedule Pickup
                            </Button>
                          )}

                          {status === 'IN_TRANSIT' && (
                            <Button size="small" variant="outlined" startIcon={<PhoneIcon />} fullWidth>
                              Contact Carrier
                            </Button>
                          )}

                          {status === 'DELIVERED' && (
                            <Button size="small" variant="outlined" startIcon={<PrintIcon />} fullWidth>
                              Print POD
                            </Button>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}

                  {items.length === 0 && (
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.100' }}>
                      <Typography variant="body2" color="text.secondary">
                        No {config.label.toLowerCase()}
                      </Typography>
                    </Paper>
                  )}
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

export default ShipmentsPage;
