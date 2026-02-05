/**
 * Drop Tag Listing Page
 * Manage shipment manifests/listings of drop tags
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Grid,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Checkbox,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  Lock as LockIcon,
  PlayArrow as DepartIcon,
  DoneAll as DeliverIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  QrCode as QrCodeIcon,
  Description as DocIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

// Mock data
const mockListings = [
  {
    id: 'DTL-20240115-0001',
    shipmentId: 'SHP-2024-0512',
    customer: 'ABC Steel Corp',
    destination: '123 Industrial Blvd, Chicago, IL',
    status: 'READY',
    dropTagCount: 5,
    totalWeight: '15,250 lbs',
    createdAt: '2024-01-15 08:00',
    expectedDelivery: '2024-01-17',
    carrier: 'Standard Freight',
  },
  {
    id: 'DTL-20240115-0002',
    shipmentId: 'SHP-2024-0508',
    customer: 'XYZ Manufacturing',
    destination: '456 Factory Way, Detroit, MI',
    status: 'LOADED',
    dropTagCount: 3,
    totalWeight: '8,400 lbs',
    createdAt: '2024-01-15 10:30',
    expectedDelivery: '2024-01-16',
    carrier: 'Express Trucking',
  },
  {
    id: 'DTL-20240114-0008',
    shipmentId: 'SHP-2024-0499',
    customer: 'Metro Builders',
    destination: '789 Construction Ave, Cleveland, OH',
    status: 'DEPARTED',
    dropTagCount: 8,
    totalWeight: '22,100 lbs',
    createdAt: '2024-01-14 14:00',
    expectedDelivery: '2024-01-15',
    carrier: 'Regional Hauling',
  },
  {
    id: 'DTL-20240113-0015',
    shipmentId: 'SHP-2024-0485',
    customer: 'Delta Fabrication',
    destination: '321 Steel St, Pittsburgh, PA',
    status: 'DELIVERED',
    dropTagCount: 4,
    totalWeight: '11,800 lbs',
    createdAt: '2024-01-13 09:00',
    expectedDelivery: '2024-01-14',
    carrier: 'Premium Transport',
  },
];

const mockAvailableTags = [
  { id: 'DT-20240115-0010', product: '1/2" HR Plate', weight: '3,200 lbs', customer: 'ABC Steel' },
  { id: 'DT-20240115-0011', product: '3/8" CR Sheet', weight: '2,100 lbs', customer: 'ABC Steel' },
  { id: 'DT-20240115-0012', product: '1" HR Round Bar', weight: '1,500 lbs', customer: 'ABC Steel' },
];

const statusColors = {
  DRAFT: 'default',
  READY: 'primary',
  PRINTED: 'info',
  LOADED: 'warning',
  DEPARTED: 'secondary',
  DELIVERED: 'success',
  CLOSED: 'default',
};

const statusSteps = ['DRAFT', 'READY', 'PRINTED', 'LOADED', 'DEPARTED', 'DELIVERED'];

export default function DropTagListingPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedListing, setSelectedListing] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setLoading(true);
    try {
      // const response = await fetch('/api/drop-tags/listings');
      // const data = await response.json();
      setTimeout(() => {
        setListings(mockListings);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading listings:', error);
      setLoading(false);
    }
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      listing.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.shipmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || listing.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDetails = (listing) => {
    setSelectedListing(listing);
    setDetailsOpen(true);
  };

  const handleAction = async (listingId, action) => {
    console.log(`Performing ${action} on listing ${listingId}`);
    // Call appropriate API endpoint
  };

  // Stats
  const stats = {
    draft: listings.filter((l) => l.status === 'DRAFT').length,
    ready: listings.filter((l) => l.status === 'READY' || l.status === 'PRINTED').length,
    inTransit: listings.filter((l) => l.status === 'LOADED' || l.status === 'DEPARTED').length,
    delivered: listings.filter((l) => l.status === 'DELIVERED').length,
  };

  const getStatusStep = (status) => {
    return statusSteps.indexOf(status);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            <ShippingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Drop Tag Listings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Shipment manifests and delivery tracking
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadListings}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            New Listing
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" fontWeight="bold">
                    {stats.draft}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Draft
                  </Typography>
                </Box>
                <EditIcon sx={{ fontSize: 48, color: 'grey.400' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" fontWeight="bold" color="primary.main">
                    {stats.ready}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ready / Printed
                  </Typography>
                </Box>
                <PrintIcon sx={{ fontSize: 48, color: 'primary.light' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" fontWeight="bold" color="warning.main">
                    {stats.inTransit}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Transit
                  </Typography>
                </Box>
                <ShippingIcon sx={{ fontSize: 48, color: 'warning.light' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" fontWeight="bold" color="success.main">
                    {stats.delivered}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Delivered
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 48, color: 'success.light' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search listings, shipments, customers..."
            size="small"
            sx={{ minWidth: 300 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="DRAFT">Draft</MenuItem>
              <MenuItem value="READY">Ready</MenuItem>
              <MenuItem value="PRINTED">Printed</MenuItem>
              <MenuItem value="LOADED">Loaded</MenuItem>
              <MenuItem value="DEPARTED">Departed</MenuItem>
              <MenuItem value="DELIVERED">Delivered</MenuItem>
              <MenuItem value="CLOSED">Closed</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Listings Table */}
      {loading ? (
        <LinearProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell>Listing ID</TableCell>
                <TableCell>Shipment</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Destination</TableCell>
                <TableCell align="center">Tags</TableCell>
                <TableCell>Weight</TableCell>
                <TableCell>Expected</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredListings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No listings found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredListings.map((listing) => (
                  <TableRow key={listing.id} hover>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{ fontFamily: 'monospace', cursor: 'pointer' }}
                        onClick={() => handleOpenDetails(listing)}
                      >
                        {listing.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={listing.shipmentId} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{listing.customer}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {listing.destination}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={listing.dropTagCount} size="small" color="primary" />
                    </TableCell>
                    <TableCell>{listing.totalWeight}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={
                          new Date(listing.expectedDelivery) <= new Date()
                            ? 'error.main'
                            : 'text.primary'
                        }
                      >
                        {listing.expectedDelivery}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={listing.status}
                        size="small"
                        color={statusColors[listing.status]}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {listing.status === 'READY' && (
                        <Tooltip title="Print Manifest">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleAction(listing.id, 'print')}
                          >
                            <PrintIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {listing.status === 'PRINTED' && (
                        <Tooltip title="Lock & Depart">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => handleAction(listing.id, 'depart')}
                          >
                            <DepartIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {listing.status === 'DEPARTED' && (
                        <Tooltip title="Confirm Delivery">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleAction(listing.id, 'deliver')}
                          >
                            <DeliverIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleOpenDetails(listing)}>
                          <SearchIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Listing Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Listing Details
          {selectedListing && (
            <Chip
              label={selectedListing.status}
              size="small"
              color={statusColors[selectedListing?.status]}
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {selectedListing && (
            <Box sx={{ pt: 2 }}>
              {/* Progress Stepper */}
              <Stepper activeStep={getStatusStep(selectedListing.status)} alternativeLabel sx={{ mb: 4 }}>
                {statusSteps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
                <Tab label="Overview" />
                <Tab label="Drop Tags" />
                <Tab label="History" />
              </Tabs>

              {tabValue === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Listing ID</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedListing.id}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Shipment ID</Typography>
                    <Typography variant="body1">{selectedListing.shipmentId}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Customer</Typography>
                    <Typography variant="body1">{selectedListing.customer}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Carrier</Typography>
                    <Typography variant="body1">{selectedListing.carrier}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Destination</Typography>
                    <Typography variant="body1">{selectedListing.destination}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Drop Tags</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedListing.dropTagCount}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Total Weight</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedListing.totalWeight}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Expected Delivery</Typography>
                    <Typography variant="body1">{selectedListing.expectedDelivery}</Typography>
                  </Grid>
                </Grid>
              )}

              {tabValue === 1 && (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {selectedListing.dropTagCount} drop tags assigned to this listing
                  </Alert>
                  <List>
                    {mockAvailableTags.slice(0, selectedListing.dropTagCount).map((tag) => (
                      <ListItem key={tag.id} divider>
                        <ListItemIcon>
                          <QrCodeIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={tag.id}
                          secondary={`${tag.product} • ${tag.weight}`}
                        />
                        <ListItemSecondaryAction>
                          <Chip label="APPLIED" size="small" color="success" />
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {tabValue === 2 && (
                <List>
                  <ListItem divider>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Listing Created"
                      secondary={selectedListing.createdAt}
                    />
                  </ListItem>
                  <ListItem divider>
                    <ListItemIcon>
                      <QrCodeIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${selectedListing.dropTagCount} tags added`}
                      secondary="Tags assigned to listing"
                    />
                  </ListItem>
                </List>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {selectedListing?.status === 'READY' && (
            <Button variant="contained" startIcon={<PrintIcon />}>
              Print Manifest
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Create Listing Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Listing</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Shipment</InputLabel>
                  <Select label="Shipment" defaultValue="">
                    <MenuItem value="SHP-2024-0520">SHP-2024-0520 - ABC Steel Corp</MenuItem>
                    <MenuItem value="SHP-2024-0521">SHP-2024-0521 - XYZ Manufacturing</MenuItem>
                    <MenuItem value="SHP-2024-0522">SHP-2024-0522 - Delta Fabrication</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Origin Location</InputLabel>
                  <Select label="Origin Location" defaultValue="">
                    <MenuItem value="main">Main Warehouse</MenuItem>
                    <MenuItem value="prod">Production Floor</MenuItem>
                    <MenuItem value="staging">Staging Area</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Available Drop Tags
                </Typography>
                <List dense sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  {mockAvailableTags.map((tag) => (
                    <ListItem key={tag.id}>
                      <ListItemIcon>
                        <Checkbox size="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={tag.id}
                        secondary={`${tag.product} • ${tag.weight}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<AddIcon />}>
            Create Listing
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
