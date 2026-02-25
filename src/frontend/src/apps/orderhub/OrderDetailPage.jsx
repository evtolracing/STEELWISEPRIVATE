import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Stack,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Avatar,
  LinearProgress,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  PlayArrow as PlanIcon,
  Inventory as PackageIcon,
  LocalShipping as ShipIcon,
  CheckCircle as CompleteIcon,
  Build as JobIcon,
  Refresh as RefreshIcon,
  Business as CompanyIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { getOrder, planOrder, markOrderPackaging } from '../../services/orderApi';
import { TOLERANCE_PRESETS, CERT_OPTIONS } from '../../services/customerPreferencesApi';

const orderStatuses = ['NEW', 'PLANNING', 'IN_PRODUCTION', 'PACKAGING', 'READY_TO_SHIP', 'SHIPPED'];
const statusColors = {
  NEW: 'info',
  PLANNING: 'warning',
  IN_PRODUCTION: 'primary',
  PACKAGING: 'secondary',
  READY_TO_SHIP: 'success',
  SHIPPED: 'default',
  CANCELLED: 'error',
};

const lineStatusColors = {
  NEW: 'default',
  PLANNING: 'warning',
  RELEASED_TO_PRODUCTION: 'primary',
  COMPLETE: 'success',
};

const jobStatusColors = {
  PLANNING: 'warning',
  READY: 'info',
  IN_PROCESS: 'primary',
  COMPLETE: 'success',
  PACKAGED: 'secondary',
};

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const data = await getOrder(orderId);
      setOrder(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanJobs = async () => {
    setActionLoading(true);
    setError(null);
    setActionSuccess(null);
    try {
      const result = await planOrder(orderId);
      setOrder(result.order);
      setActionSuccess(`Created ${result.jobs?.length || 0} job(s) for this order.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPackaging = async () => {
    setActionLoading(true);
    setError(null);
    setActionSuccess(null);
    try {
      const result = await markOrderPackaging(orderId);
      setOrder(result);
      setActionSuccess('Order marked for packaging!');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCurrentStep = () => {
    const idx = orderStatuses.indexOf(order?.status);
    return idx >= 0 ? idx : 0;
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading Order...</Typography>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Order not found</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/orderhub')}>
          Back to List
        </Button>
      </Box>
    );
  }

  const hasJobs = order.jobs && order.jobs.length > 0;
  const allJobsComplete = hasJobs && order.jobs.every((j) => j.status === 'COMPLETE');
  const canPlanJobs = order.status === 'NEW' && !hasJobs;
  const canMarkPackaging = order.status === 'IN_PRODUCTION' || (hasJobs && allJobsComplete);

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/orderhub')}>
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Order Detail
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {order.id}
            </Typography>
          </Box>
          <Chip
            label={order.status}
            color={statusColors[order.status] || 'default'}
            sx={{ ml: 2 }}
          />
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchOrder}
            disabled={loading}
          >
            Refresh
          </Button>
          {canPlanJobs && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlanIcon />}
              onClick={handlePlanJobs}
              disabled={actionLoading}
            >
              Plan Jobs
            </Button>
          )}
          {canMarkPackaging && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PackageIcon />}
              onClick={handleMarkPackaging}
              disabled={actionLoading}
            >
              Mark Packaging Ready
            </Button>
          )}
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {actionSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}

      {/* Progress Stepper */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={getCurrentStep()} alternativeLabel>
          {orderStatuses.map((status) => (
            <Step key={status}>
              <StepLabel>{status.replace(/_/g, ' ')}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Grid container spacing={2}>
        {/* Left Column - Order Details */}
        <Grid item xs={12} md={8}>
          {/* Contact Info */}
          <Card sx={{ mb: 2 }}>
            <CardHeader
              title="Customer"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
              sx={{ pb: 0 }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CompanyIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Company
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {order.contact?.companyName || '-'}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Contact
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {order.contact?.contactName || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EmailIcon color="action" />
                    <Typography variant="body2">{order.contact?.email || '-'}</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PhoneIcon color="action" />
                    <Typography variant="body2">{order.contact?.phone || '-'}</Typography>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Order Header */}
          <Card sx={{ mb: 2 }}>
            <CardHeader
              title="Order Info"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
              sx={{ pb: 0 }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">
                    Channel
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {order.channel}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {order.locationId}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">
                    Division
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {order.division || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body2">{formatDate(order.createdAt)}</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">
                    Requested Ship
                  </Typography>
                  <Typography variant="body2">{formatDate(order.requestedShipDate)}</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">
                    Promise Date
                  </Typography>
                  <Typography variant="body2">{formatDate(order.promiseDate)}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Order Lines */}
          <Card sx={{ mb: 2 }}>
            <CardHeader
              title={`Order Lines (${order.lines?.length || 0})`}
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Material</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Grade</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Dimensions</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Qty</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Job</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Specs</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.lines?.map((line, idx) => (
                      <TableRow key={line.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {line.materialCode || `${line.commodity} ${line.form}`}
                          </Typography>
                        </TableCell>
                        <TableCell>{line.grade || '-'}</TableCell>
                        <TableCell>
                          {line.thickness && line.width && line.length
                            ? `${line.thickness}" x ${line.width}" x ${line.length}"`
                            : line.thickness
                            ? `${line.thickness}" dia`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip label={line.quantity} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={line.status}
                            size="small"
                            color={lineStatusColors[line.status] || 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {line.jobId ? (
                            <Typography variant="caption" color="primary" fontWeight={600}>
                              {line.jobId.substring(0, 8)}...
                            </Typography>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                            {line.tolerancePreset && (
                              <Chip label={`Tol: ${line.tolerancePreset}`} size="small" sx={{ height: 18, fontSize: '0.6rem' }} />
                            )}
                            {(line.certRequirements || []).length > 0 && (
                              <Chip label={`${line.certRequirements.length} cert(s)`} size="small" color="secondary" sx={{ height: 18, fontSize: '0.6rem' }} />
                            )}
                            {line.surfaceFinish && (
                              <Chip label={line.surfaceFinish} size="small" color="info" sx={{ height: 18, fontSize: '0.6rem' }} />
                            )}
                            {!line.tolerancePreset && !(line.certRequirements || []).length && !line.surfaceFinish && (
                              <Typography variant="caption" color="text.secondary">Default</Typography>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Jobs */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <JobIcon />
                </Avatar>
              }
              title="Production Jobs"
              subheader={`${order.jobs?.length || 0} job(s)`}
              sx={{ pb: 0 }}
            />
            <Divider />
            <CardContent>
              {!hasJobs ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    No jobs created yet
                  </Typography>
                  {canPlanJobs && (
                    <Button
                      variant="outlined"
                      startIcon={<PlanIcon />}
                      onClick={handlePlanJobs}
                      disabled={actionLoading}
                    >
                      Plan Jobs
                    </Button>
                  )}
                </Box>
              ) : (
                <Stack spacing={2}>
                  {order.jobs.map((job) => (
                    <Paper key={job.id} variant="outlined" sx={{ p: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          Job {job.id.substring(0, 8)}...
                        </Typography>
                        <Chip
                          label={job.status}
                          size="small"
                          color={jobStatusColors[job.status] || 'default'}
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Material: {job.materialCode}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Division: {job.division}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Location: {job.locationId}
                      </Typography>
                      {job.thickness && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Dims: {job.thickness}" x {job.width || '?'}" x {job.length || '?'}"
                        </Typography>
                      )}
                    </Paper>
                  ))}

                  {allJobsComplete && order.status !== 'PACKAGING' && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      All jobs complete! Ready for packaging.
                    </Alert>
                  )}
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card sx={{ mt: 2 }}>
            <CardHeader
              title="Actions"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
              sx={{ pb: 0 }}
            />
            <Divider />
            <CardContent>
              <Stack spacing={1}>
                {order.status === 'PACKAGING' && (
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ShipIcon />}
                    onClick={() => alert('Shipping handoff - implement as needed')}
                  >
                    Create Shipment
                  </Button>
                )}
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => navigate('/orderhub')}
                >
                  Back to RFQ List
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
