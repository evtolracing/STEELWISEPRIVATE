/**
 * Shipping Screen
 * Interface for dispatching ready-to-ship jobs
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid
} from '@mui/material';
import {
  LocalShipping as ShipIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { fetchJobs, shipJob } from '../../services/jobsService';

const CARRIERS = [
  'FedEx',
  'UPS',
  'USPS',
  'DHL',
  'Local Delivery',
  'Customer Pickup',
  'Other'
];

export default function ShippingScreen() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState('');
  const [error, setError] = useState('');
  const [shipDialog, setShipDialog] = useState({ open: false, job: null });
  const [shipmentData, setShipmentData] = useState({
    carrier: '',
    trackingNumber: '',
    notes: ''
  });

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError('');
      
      const filters = {};
      if (locationFilter) filters.locationId = locationFilter;

      const data = await fetchJobs(filters);
      
      // Filter to show only READY_TO_SHIP and SHIPPED jobs
      const shippingJobs = data.filter(
        job => job.status === 'READY_TO_SHIP' || job.status === 'SHIPPED'
      );
      
      setJobs(shippingJobs);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadJobs, 30000);
    return () => clearInterval(interval);
  }, [locationFilter]);

  const handleShipJob = async () => {
    try {
      setError('');
      await shipJob(
        shipDialog.job.id,
        shipmentData.trackingNumber,
        shipmentData.carrier,
        shipmentData.notes
      );
      
      setShipDialog({ open: false, job: null });
      setShipmentData({ carrier: '', trackingNumber: '', notes: '' });
      await loadJobs();
    } catch (err) {
      console.error('Error shipping job:', err);
      setError('Failed to ship job');
    }
  };

  const openShipDialog = (job) => {
    setShipDialog({ open: true, job });
    setShipmentData({ carrier: '', trackingNumber: '', notes: '' });
  };

  const readyToShipJobs = jobs.filter(job => job.status === 'READY_TO_SHIP');
  const shippedJobs = jobs.filter(job => job.status === 'SHIPPED');

  const JobCard = ({ job, variant }) => {
    const isReadyToShip = variant === 'ready';
    const isShipped = variant === 'shipped';

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6">
              {job.jobNumber || job.id.slice(0, 8)}
            </Typography>
            {isShipped && (
              <Chip 
                icon={<CheckIcon />}
                label="Shipped" 
                color="success" 
                size="small"
              />
            )}
          </Box>

          <Typography variant="body1" gutterBottom>
            {job.workOrder?.order?.customer?.name || 'No customer'}
          </Typography>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Location: {job.location?.name || 'Not assigned'}
          </Typography>

          {job.workOrder?.order?.deliveryAddress && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Ship to: {job.workOrder.order.deliveryAddress}
            </Typography>
          )}

          {job.priority === 'HIGH' && (
            <Chip 
              label="High Priority" 
              color="error" 
              size="small" 
              sx={{ mt: 1 }}
            />
          )}
        </CardContent>

        {isReadyToShip && (
          <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<ShipIcon />}
              onClick={() => openShipDialog(job)}
            >
              Ship Job
            </Button>
          </CardActions>
        )}
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Shipping & Dispatch</Typography>
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Location</InputLabel>
          <Select
            value={locationFilter}
            label="Location"
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <MenuItem value="">All Locations</MenuItem>
            <MenuItem value="loc1">Location 1</MenuItem>
            <MenuItem value="loc2">Location 2</MenuItem>
            <MenuItem value="loc3">Location 3</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              Ready to Ship ({readyToShipJobs.length})
            </Typography>
            
            {readyToShipJobs.length === 0 ? (
              <Alert severity="info">No jobs ready to ship</Alert>
            ) : (
              <Grid container spacing={2}>
                {readyToShipJobs.map(job => (
                  <Grid item xs={12} key={job.id}>
                    <JobCard job={job} variant="ready" />
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              Recently Shipped ({shippedJobs.length})
            </Typography>
            
            {shippedJobs.length === 0 ? (
              <Alert severity="info">No recently shipped jobs</Alert>
            ) : (
              <Grid container spacing={2}>
                {shippedJobs.map(job => (
                  <Grid item xs={12} key={job.id}>
                    <JobCard job={job} variant="shipped" />
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      )}

      {/* Ship Job Dialog */}
      <Dialog 
        open={shipDialog.open} 
        onClose={() => setShipDialog({ open: false, job: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Ship Job</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Job: {shipDialog.job?.jobNumber || shipDialog.job?.id.slice(0, 8)}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
            Customer: {shipDialog.job?.workOrder?.order?.customer?.name}
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Carrier *</InputLabel>
            <Select
              value={shipmentData.carrier}
              label="Carrier *"
              onChange={(e) => setShipmentData({ ...shipmentData, carrier: e.target.value })}
            >
              {CARRIERS.map(carrier => (
                <MenuItem key={carrier} value={carrier}>{carrier}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Tracking Number *"
            value={shipmentData.trackingNumber}
            onChange={(e) => setShipmentData({ ...shipmentData, trackingNumber: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Shipping Notes (optional)"
            value={shipmentData.notes}
            onChange={(e) => setShipmentData({ ...shipmentData, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShipDialog({ open: false, job: null })}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleShipJob}
            disabled={!shipmentData.carrier || !shipmentData.trackingNumber}
            startIcon={<ShipIcon />}
          >
            Ship Job
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
