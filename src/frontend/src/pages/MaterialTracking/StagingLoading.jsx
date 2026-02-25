import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button,
  TextField, InputAdornment, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Snackbar, CircularProgress, Divider, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  Search, LocalShipping, CheckCircle, Schedule, Refresh,
  Inventory2, Warning,
} from '@mui/icons-material';
import { getStagingData, shipJob } from '../../api/materialTracking';

const StagingLoading = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [shipDialog, setShipDialog] = useState(null);
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getStagingData();
      setJobs(data);
    } catch (err) {
      console.error('Failed to load staging data:', err);
      setSnackbar({ open: true, message: 'Failed to load staging data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleShip = async () => {
    if (!shipDialog) return;
    try {
      await shipJob(shipDialog.id, { carrier, trackingNumber });
      setSnackbar({ open: true, message: `${shipDialog.jobNumber} marked as shipped`, severity: 'success' });
      setShipDialog(null);
      setCarrier('');
      setTrackingNumber('');
      loadData();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to ship', severity: 'error' });
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (job.jobNumber || '').toLowerCase().includes(q) ||
           (job.customerName || '').toLowerCase().includes(q) ||
           (job.orderNumber || '').toLowerCase().includes(q);
  });

  const readyToShip = filteredJobs.filter(j => j.status === 'READY_TO_SHIP');
  const shipped = filteredJobs.filter(j => j.status === 'SHIPPED');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Staging & Loading</Typography>
          <Typography variant="body2" color="text.secondary">
            Stage packages at docks, assign carriers, and load onto trucks
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={loadData}>Refresh</Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {readyToShip.length}
              </Typography>
              <Typography variant="caption">Ready to Ship</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                {shipped.length}
              </Typography>
              <Typography variant="caption">Shipped</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="h4" fontWeight={700} color="info.main">
                {jobs.reduce((sum, j) => sum + (j.packageCount || 0), 0)}
              </Typography>
              <Typography variant="caption">Total Packages</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField fullWidth size="small"
          placeholder="Search by job number, customer, order..."
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
        />
      </Paper>

      {/* Ready to Ship Section */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Inventory2 color="success" /> Ready to Ship ({readyToShip.length})
      </Typography>
      {readyToShip.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', mb: 4 }}>
          <Typography color="text.secondary">No jobs ready to ship</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'success.light' }}>
                <TableCell sx={{ fontWeight: 600 }}>Job</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Order</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ship To</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Packages</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {readyToShip.map((job) => (
                <TableRow key={job.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {job.jobNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>{job.customerName}</TableCell>
                  <TableCell>{job.orderNumber || '-'}</TableCell>
                  <TableCell>{job.shipTo || '-'}</TableCell>
                  <TableCell>
                    {job.dueDate ? (
                      <Typography variant="body2"
                        color={new Date(job.dueDate) < new Date() ? 'error.main' : 'text.primary'}>
                        {new Date(job.dueDate).toLocaleDateString()}
                      </Typography>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip label={job.priority} size="small"
                      color={job.priority === 'Critical' ? 'error' : job.priority === 'High' ? 'warning' : 'default'} />
                  </TableCell>
                  <TableCell>{job.packageCount}</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="contained" color="success"
                      startIcon={<LocalShipping />}
                      onClick={() => setShipDialog(job)}>
                      Ship
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Shipped Section */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocalShipping color="primary" /> Recently Shipped ({shipped.length})
      </Typography>
      {shipped.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No recently shipped jobs</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.light' }}>
                <TableCell sx={{ fontWeight: 600 }}>Job</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Carrier</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tracking #</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Shipped Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shipped.map((job) => (
                <TableRow key={job.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {job.jobNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>{job.customerName}</TableCell>
                  <TableCell>{job.shippingCarrier || '-'}</TableCell>
                  <TableCell>{job.trackingNumber || '-'}</TableCell>
                  <TableCell>
                    {job.shippedAt ? new Date(job.shippedAt).toLocaleString() : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip label="Shipped" color="success" size="small" icon={<CheckCircle />} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Ship Dialog */}
      <Dialog open={!!shipDialog} onClose={() => setShipDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Ship: {shipDialog?.jobNumber}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Customer: {shipDialog?.customerName}
          </Typography>
          <TextField fullWidth label="Carrier" value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            sx={{ mb: 2 }} placeholder="e.g. FedEx Freight, XPO, Will Call"
          />
          <TextField fullWidth label="Tracking Number" value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Optional"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShipDialog(null)}>Cancel</Button>
          <Button variant="contained" color="success" startIcon={<LocalShipping />}
            onClick={handleShip}>
            Confirm Ship
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StagingLoading;
