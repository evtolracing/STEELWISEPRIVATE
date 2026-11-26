import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button,
  TextField, InputAdornment, Badge, Divider, FormControl, InputLabel,
  Select, MenuItem, Alert, Snackbar, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  Search, Inventory2, CheckCircle, Schedule, LocalShipping,
  PlayArrow, Refresh, PriorityHigh,
} from '@mui/icons-material';
import { getJobs, updateJobStatus } from '../../api/jobs';
import client from '../../api/client';
import { moveProblem, shippedText, shipFormProblem } from './shipText';
import { calendarDate } from '../../utils/calendarDate'

const PackagingQueue = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getJobs({ status: 'WAITING_QC,PACKAGING,READY_TO_SHIP,SHIPPED' });
      setJobs(data);
    } catch (err) {
      console.error('Failed to load packaging jobs:', err);
      setSnackbar({ open: true, message: 'Failed to load jobs', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const handleStatusChange = async (jobId, newStatus, label) => {
    try {
      await updateJobStatus(jobId, newStatus);
      setSnackbar({ open: true, message: `Job moved to ${label}`, severity: 'success' });
      loadJobs();
    } catch (err) {
      // The server says why in words (a step not finished, an inspection not passed): shown as it is.
      setSnackbar({ open: true, message: moveProblem(err), severity: 'error' });
    }
  };

  // Shipping a job. A job for a customer order goes out on a real shipment, so stock, the order and the invoice
  // follow: that needs the carrier and a tracking or BOL number. A job with no order is simply marked shipped.
  const [shipping, setShipping] = useState(null); // { job, carrier, trackingNumber, busy, error }
  const startShipping = (job) => {
    if (!job.orderId) { handleStatusChange(job.id, 'SHIPPED', 'Shipped'); return; }
    setShipping({ job, carrier: '', trackingNumber: '', busy: false, error: '' });
  };
  const ship = async () => {
    const { job, carrier, trackingNumber } = shipping;
    setShipping((s) => ({ ...s, busy: true, error: '' }));
    try {
      const { data } = await client.post(`/jobs/${job.id}/ship`, { carrier: carrier.trim(), trackingNumber: trackingNumber.trim() });
      setShipping(null);
      setSnackbar({ open: true, message: shippedText(job, data), severity: 'success' });
      loadJobs();
    } catch (err) {
      setShipping((s) => ({ ...s, busy: false, error: moveProblem(err, 'The job could not be shipped.') }));
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': case 'EXPEDITE': return 'error';
      case 'High': case 'HIGH': return 'warning';
      default: return 'default';
    }
  };

  const isHighPriority = (p) => ['Critical', 'EXPEDITE', 'High', 'HIGH'].includes(p);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'WAITING_QC': return <Schedule />;
      case 'PACKAGING': return <Inventory2 />;
      case 'READY_TO_SHIP': return <CheckCircle />;
      case 'SHIPPED': return <LocalShipping />;
      default: return <Inventory2 />;
    }
  };

  const filterJobs = (status) => {
    return jobs.filter(job => {
      if (job.status !== status) return false;
      if (priorityFilter && job.priority !== priorityFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (job.jobNumber || '').toLowerCase().includes(q) ||
               (job.customerName || '').toLowerCase().includes(q) ||
               (job.material || '').toLowerCase().includes(q);
      }
      return true;
    });
  };

  const countByStatus = (status) => jobs.filter(j => j.status === status).length;

  const waitingQcCount = countByStatus('WAITING_QC');
  const packagingCount = countByStatus('PACKAGING');
  const readyToShipCount = countByStatus('READY_TO_SHIP');
  const shippedCount = countByStatus('SHIPPED');

  const urgentCount = jobs.filter(j =>
    isHighPriority(j.priority) && !['SHIPPED', 'COMPLETE'].includes(j.status)
  ).length;

  const renderJobCard = (job) => (
    <Card
      key={job.id}
      sx={{
        mb: 1.5,
        cursor: 'pointer',
        border: isHighPriority(job.priority) ? '2px solid' : '1px solid',
        borderColor: isHighPriority(job.priority) ? 'error.main' : 'divider',
        '&:hover': { boxShadow: 3 },
      }}
    >
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} color="primary.main">
            {job.jobNumber}
          </Typography>
          {isHighPriority(job.priority) && (
            <Chip
              label={job.priority}
              size="small"
              color={getPriorityColor(job.priority)}
              icon={<PriorityHigh />}
            />
          )}
        </Box>

        <Typography variant="body2" fontWeight={500} noWrap>
          {job.customerName || 'No Customer'}
        </Typography>

        <Divider sx={{ my: 1 }} />

        <Typography variant="body2" color="text.secondary">
          {job.material || 'N/A'}
        </Typography>
        {job.dueDate && (
          <Typography variant="caption" color="text.secondary" display="block">
            Due: {calendarDate(job.dueDate)}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
          {job.status === 'WAITING_QC' && (
            <Button size="small" variant="contained" color="warning"
              startIcon={<PlayArrow />} fullWidth
              onClick={() => handleStatusChange(job.id, 'PACKAGING', 'Packaging')}>
              Start Packaging
            </Button>
          )}
          {job.status === 'PACKAGING' && (
            <Button size="small" variant="contained" color="info"
              startIcon={<CheckCircle />} fullWidth
              onClick={() => handleStatusChange(job.id, 'READY_TO_SHIP', 'Ready to Ship')}>
              Mark Ready
            </Button>
          )}
          {job.status === 'READY_TO_SHIP' && (
            <Button size="small" variant="contained" color="success"
              startIcon={<LocalShipping />} fullWidth
              onClick={() => startShipping(job)} data-testid="mark-shipped">
              Mark Shipped
            </Button>
          )}
          {job.status === 'SHIPPED' && (
            <Chip label="Shipped" color="success" size="small" sx={{ width: '100%' }} />
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const renderColumn = (title, status, count, color) => (
    <Box sx={{ flex: 1, minWidth: 280, maxWidth: 340 }}>
      <Paper
        sx={{
          p: 1.5, mb: 1, bgcolor: `${color}.tint`,
          borderLeft: 4, borderColor: `${color}.main`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getStatusIcon(status)}
            <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>
          </Box>
          <Badge badgeContent={count} color={color} />
        </Box>
      </Paper>
      <Box sx={{ maxHeight: 'calc(100vh - 340px)', overflow: 'auto', pr: 0.5 }}>
        {filterJobs(status).map(renderJobCard)}
        {filterJobs(status).length === 0 && (
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
            <Typography variant="body2" color="text.secondary">No jobs</Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography component="h1" variant="h4" fontWeight={700}>Packaging Queue</Typography>
          <Typography variant="body2" color="text.secondary">
            Bundle, band, tag, and prepare materials for shipment
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={loadJobs}>Refresh</Button>
      </Box>

      {urgentCount > 0 && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<PriorityHigh />}>
          <strong>{urgentCount} urgent job(s)</strong> require immediate attention
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Waiting QC', value: waitingQcCount, color: 'warning' },
          { label: 'Packaging', value: packagingCount, color: 'info' },
          { label: 'Ready to Ship', value: readyToShipCount, color: 'success' },
          { label: 'Shipped', value: shippedCount, color: 'primary' },
        ].map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h4" fontWeight={700} color={`${s.color}.main`}>{s.value}</Typography>
                <Typography variant="caption">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField inputProps={{ 'aria-label': "Search by job number, customer, material" }} fullWidth size="small"
              placeholder="Search by job number, customer, material..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select label="Priority" value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Critical">Critical</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, overflow: 'auto', pb: 2 }}>
        {renderColumn('Waiting QC', 'WAITING_QC', waitingQcCount, 'warning')}
        {renderColumn('Packaging', 'PACKAGING', packagingCount, 'info')}
        {renderColumn('Ready to Ship', 'READY_TO_SHIP', readyToShipCount, 'success')}
        {renderColumn('Shipped', 'SHIPPED', shippedCount, 'primary')}
      </Box>

      <Dialog open={Boolean(shipping)} onClose={() => !shipping?.busy && setShipping(null)} maxWidth="xs" fullWidth data-testid="ship-job-dialog">
        <DialogTitle>Ship job {shipping?.job?.jobNumber}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This job is for a customer order, so shipping it makes a shipment, takes the reserved stock out and raises the invoice.
          </Typography>
          <TextField label="Carrier" fullWidth size="small" sx={{ mb: 2 }} autoFocus value={shipping?.carrier || ''}
            onChange={(e) => setShipping((s) => ({ ...s, carrier: e.target.value }))} inputProps={{ 'data-testid': 'ship-carrier', maxLength: 80 }} />
          <TextField label="Tracking or BOL number" fullWidth size="small" value={shipping?.trackingNumber || ''}
            onChange={(e) => setShipping((s) => ({ ...s, trackingNumber: e.target.value }))} inputProps={{ 'data-testid': 'ship-tracking', maxLength: 80 }} />
          {shipping?.error && <Alert severity="error" sx={{ mt: 2 }} data-testid="ship-error">{shipping.error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShipping(null)} disabled={shipping?.busy}>Cancel</Button>
          <Button variant="contained" onClick={ship} disabled={shipping?.busy || Boolean(shipFormProblem(shipping || {}))} data-testid="ship-confirm">
            {shipping?.busy ? 'Shipping…' : 'Ship'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={8000} data-testid="packaging-message"
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PackagingQueue;
