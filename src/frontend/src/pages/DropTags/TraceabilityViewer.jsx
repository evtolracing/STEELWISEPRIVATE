/**
 * Traceability Viewer
 * Complete audit trail and lifecycle view for a drop tag
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  LinearProgress,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  QrCode as QrCodeIcon,
  CheckCircle as CheckCircleIcon,
  Print as PrintIcon,
  LocalShipping as ShippingIcon,
  Warehouse as WarehouseIcon,
  Inventory as InventoryIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  ArrowBack as BackIcon,
  Timeline as TimelineIcon,
  Verified as VerifiedIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

// Mock trace data
const mockTraceData = {
  dropTag: {
    id: 'DT-20240115-0001',
    status: 'DELIVERED',
    packageId: 'PKG-001',
    createdAt: '2024-01-15 08:00:00',
    customer: 'ABC Steel Corp',
    product: '1/2" HR Plate 48x96',
    quantity: 25,
    weight: '5,250 lbs',
    heatNumber: 'H-23456',
    jobNumber: 'JOB-2024-0512',
    orderNumber: 'ORD-2024-0834',
    printCount: 1,
    listingId: 'DTL-20240115-0001',
    shipmentId: 'SHP-2024-0512',
  },
  events: [
    {
      id: 'EVT-001',
      eventType: 'TAG_GENERATED',
      timestamp: '2024-01-15 08:00:00',
      actor: 'system',
      details: 'Drop tag generated for package PKG-001',
      station: 'PRINT_CENTER',
      previousStatus: null,
      newStatus: 'DRAFT',
    },
    {
      id: 'EVT-002',
      eventType: 'TAG_VALIDATED',
      timestamp: '2024-01-15 08:05:00',
      actor: 'john.doe@company.com',
      details: 'Tag validated and marked ready to print',
      station: 'PRINT_CENTER',
      previousStatus: 'DRAFT',
      newStatus: 'READY_TO_PRINT',
    },
    {
      id: 'EVT-003',
      eventType: 'TAG_PRINTED',
      timestamp: '2024-01-15 08:10:00',
      actor: 'john.doe@company.com',
      details: 'Tag printed at Print Station A',
      station: 'PRINT_STATION_A',
      previousStatus: 'READY_TO_PRINT',
      newStatus: 'PRINTED',
    },
    {
      id: 'EVT-004',
      eventType: 'TAG_APPLIED',
      timestamp: '2024-01-15 09:30:00',
      actor: 'jane.smith@company.com',
      details: 'Tag scanned and applied to package',
      station: 'APPLY_STATION_1',
      previousStatus: 'PRINTED',
      newStatus: 'APPLIED',
    },
    {
      id: 'EVT-005',
      eventType: 'PACKAGE_SEALED',
      timestamp: '2024-01-15 10:00:00',
      actor: 'jane.smith@company.com',
      details: 'Package sealed with seal ID: SEAL-12345',
      station: 'SEAL_STATION',
      previousStatus: 'APPLIED',
      newStatus: 'SEALED',
    },
    {
      id: 'EVT-006',
      eventType: 'TAG_STAGED',
      timestamp: '2024-01-15 11:00:00',
      actor: 'mike.wilson@company.com',
      details: 'Package moved to staging Lane A',
      station: 'STAGING_LANE_A',
      previousStatus: 'SEALED',
      newStatus: 'STAGED',
    },
    {
      id: 'EVT-007',
      eventType: 'TAG_LOADED',
      timestamp: '2024-01-15 14:00:00',
      actor: 'truck.driver@carrier.com',
      details: 'Loaded onto truck - Carrier: Standard Freight',
      station: 'LOADING_DOCK_1',
      previousStatus: 'STAGED',
      newStatus: 'LOADED',
    },
    {
      id: 'EVT-008',
      eventType: 'SHIPMENT_DEPARTED',
      timestamp: '2024-01-15 14:30:00',
      actor: 'system',
      details: 'Shipment departed for Chicago, IL',
      station: null,
      previousStatus: 'LOADED',
      newStatus: 'SHIPPED',
    },
    {
      id: 'EVT-009',
      eventType: 'TAG_DELIVERED',
      timestamp: '2024-01-16 10:15:00',
      actor: 'delivery.driver@carrier.com',
      details: 'Delivered - Signed by: John Smith',
      station: 'CUSTOMER_SITE',
      previousStatus: 'SHIPPED',
      newStatus: 'DELIVERED',
    },
  ],
  certifications: [
    { type: 'Mill Test Report', number: 'MTR-23456', date: '2024-01-10' },
    { type: 'QC Inspection', number: 'QC-78901', date: '2024-01-15' },
  ],
};

const statusColors = {
  DRAFT: 'default',
  READY_TO_PRINT: 'info',
  PRINTED: 'primary',
  APPLIED: 'primary',
  SEALED: 'secondary',
  STAGED: 'warning',
  LOADED: 'warning',
  SHIPPED: 'info',
  DELIVERED: 'success',
  VOID: 'error',
};

const statusSteps = ['DRAFT', 'PRINTED', 'APPLIED', 'SEALED', 'STAGED', 'LOADED', 'DELIVERED'];

const eventIcons = {
  TAG_GENERATED: <QrCodeIcon />,
  TAG_VALIDATED: <VerifiedIcon />,
  TAG_PRINTED: <PrintIcon />,
  TAG_APPLIED: <CheckCircleIcon />,
  PACKAGE_SEALED: <InventoryIcon />,
  TAG_STAGED: <WarehouseIcon />,
  TAG_LOADED: <ShippingIcon />,
  SHIPMENT_DEPARTED: <ShippingIcon />,
  TAG_DELIVERED: <CheckCircleIcon />,
  TAG_VOIDED: <CancelIcon />,
};

export default function TraceabilityViewer() {
  const [searchValue, setSearchValue] = useState('');
  const [traceData, setTraceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState(null);

  // Load mock data on mount for demo
  useEffect(() => {
    handleSearch('DT-20240115-0001');
  }, []);

  const handleSearch = async (value) => {
    if (!value.trim()) return;

    setLoading(true);
    setError(null);
    setTraceData(null);

    try {
      // const response = await fetch(`/api/drop-tags/${value}`);
      // const data = await response.json();

      await new Promise((resolve) => setTimeout(resolve, 500));

      if (value.startsWith('DT-')) {
        setTraceData(mockTraceData);
      } else {
        setError('Drop tag not found. Please enter a valid tag ID.');
      }
    } catch (error) {
      console.error('Error loading trace data:', error);
      setError('Failed to load trace data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(searchValue);
    }
  };

  const getStatusStep = (status) => {
    const index = statusSteps.indexOf(status);
    return index >= 0 ? index : 0;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Traceability Viewer
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Complete audit trail and lifecycle tracking
          </Typography>
        </Box>
      </Box>

      {/* Search Bar */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Search by Drop Tag ID
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Enter Drop Tag ID (e.g., DT-20240115-0001)"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <QrCodeIcon />
                </InputAdornment>
              ),
              sx: { fontFamily: 'monospace', fontSize: '1.2rem' },
            }}
          />
          <Button
            variant="contained"
            onClick={() => handleSearch(searchValue)}
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            Search
          </Button>
        </Box>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {traceData && (
        <>
          {/* Status Stepper */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Tag Lifecycle
              </Typography>
              <Chip
                label={traceData.dropTag.status}
                color={statusColors[traceData.dropTag.status]}
                size="medium"
              />
            </Box>
            <Stepper activeStep={getStatusStep(traceData.dropTag.status)} alternativeLabel>
              {statusSteps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>

          {/* Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
              <Tab label="Overview" icon={<AssignmentIcon />} iconPosition="start" />
              <Tab label="Timeline" icon={<TimelineIcon />} iconPosition="start" />
              <Tab label="Documents" icon={<VerifiedIcon />} iconPosition="start" />
            </Tabs>
          </Paper>

          {/* Overview Tab */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <QrCodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Tag Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Tag ID</Typography>
                        <Typography variant="body1" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                          {traceData.dropTag.id}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Package ID</Typography>
                        <Typography variant="body1">{traceData.dropTag.packageId}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Created</Typography>
                        <Typography variant="body1">{traceData.dropTag.createdAt}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Print Count</Typography>
                        <Typography variant="body1">{traceData.dropTag.printCount}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <InventoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Product Details
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">Product</Typography>
                        <Typography variant="body1" fontWeight="bold">{traceData.dropTag.product}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Quantity</Typography>
                        <Typography variant="body1">{traceData.dropTag.quantity} pcs</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Weight</Typography>
                        <Typography variant="body1">{traceData.dropTag.weight}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Heat Number</Typography>
                        <Chip label={traceData.dropTag.heatNumber} size="small" variant="outlined" />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Order Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Job Number</Typography>
                        <Typography variant="body1">{traceData.dropTag.jobNumber}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Order Number</Typography>
                        <Typography variant="body1">{traceData.dropTag.orderNumber}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">Customer</Typography>
                        <Typography variant="body1" fontWeight="bold">{traceData.dropTag.customer}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <ShippingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Shipping Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Listing ID</Typography>
                        <Typography variant="body1">{traceData.dropTag.listingId}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Shipment ID</Typography>
                        <Typography variant="body1">{traceData.dropTag.shipmentId}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Timeline Tab */}
          {tabValue === 1 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Event Timeline
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {traceData.events.map((event, index) => (
                    <Paper
                      key={event.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        mb: 2,
                        borderLeft: '4px solid',
                        borderLeftColor:
                          event.eventType.includes('VOID') ? 'error.main' :
                          event.eventType.includes('DELIVERED') ? 'success.main' :
                          'primary.main',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            sx={{
                              p: 1,
                              borderRadius: 1,
                              backgroundColor: 'grey.100',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {eventIcons[event.eventType] || <HistoryIcon />}
                          </Box>
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              {event.eventType.replace(/_/g, ' ')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {event.details}
                            </Typography>
                            {event.station && (
                              <Chip label={event.station} size="small" sx={{ mt: 1 }} />
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" fontWeight="bold">
                            {event.timestamp.split(' ')[1]}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {event.timestamp.split(' ')[0]}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            by {event.actor}
                          </Typography>
                        </Box>
                      </Box>
                      {event.previousStatus && (
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={event.previousStatus} size="small" variant="outlined" />
                          <Typography variant="caption">→</Typography>
                          <Chip label={event.newStatus} size="small" color="primary" />
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Documents Tab */}
          {tabValue === 2 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Linked Documents & Certifications
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Document Number</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {traceData.certifications.map((cert, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip label={cert.type} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>{cert.number}</TableCell>
                          <TableCell>{cert.date}</TableCell>
                          <TableCell>
                            <Button size="small" variant="outlined">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
}
