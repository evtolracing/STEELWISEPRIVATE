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
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Avatar,
  Tooltip,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Badge,
} from '@mui/material';
import {
  LocalShipping,
  Add,
  Search,
  CheckCircle,
  Warning,
  Schedule,
  LocationOn,
  Person,
  Scale,
  Inventory2,
  ArrowForward,
  Lightbulb,
  Close,
  FilterList,
  Refresh,
  RequestQuote,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Mock packages ready to ship
const readyPackages = [
  {
    id: 'PKG-2026-000051',
    orderId: 'ORD-2026-1241',
    customer: 'Marine Systems Corp',
    customerCity: 'Cleveland, OH',
    material: '316SS Sheet',
    weight: 3200,
    pieces: 8,
    sealed: true,
    qcReleased: true,
    shipBy: '2026-02-04',
    priority: 'RUSH',
    requiresFlatbed: true,
    branch: 'Detroit',
  },
  {
    id: 'PKG-2026-000052',
    orderId: 'ORD-2026-1242',
    customer: 'Industrial Parts LLC',
    customerCity: 'Toledo, OH',
    material: '1018 Steel Bar',
    weight: 1500,
    pieces: 24,
    sealed: true,
    qcReleased: true,
    shipBy: '2026-02-05',
    priority: 'STANDARD',
    requiresFlatbed: false,
    branch: 'Detroit',
  },
  {
    id: 'PKG-2026-000053',
    orderId: 'ORD-2026-1243',
    customer: 'AutoMax Manufacturing',
    customerCity: 'Chicago, IL',
    material: 'Aluminum 6061',
    weight: 2800,
    pieces: 15,
    sealed: true,
    qcReleased: true,
    shipBy: '2026-02-04',
    priority: 'HOT',
    requiresFlatbed: false,
    branch: 'Detroit',
  },
  {
    id: 'PKG-2026-000054',
    orderId: 'ORD-2026-1244',
    customer: 'Precision Mfg Inc',
    customerCity: 'Indianapolis, IN',
    material: '304SS Plate',
    weight: 4500,
    pieces: 6,
    sealed: true,
    qcReleased: true,
    shipBy: '2026-02-06',
    priority: 'STANDARD',
    requiresFlatbed: true,
    branch: 'Detroit',
  },
  {
    id: 'PKG-2026-000055',
    orderId: 'ORD-2026-1245',
    customer: 'Thompson Fabrication',
    customerCity: 'Detroit, MI',
    material: 'Carbon Steel',
    weight: 850,
    pieces: 12,
    sealed: true,
    qcReleased: true,
    shipBy: '2026-02-05',
    priority: 'STANDARD',
    requiresFlatbed: false,
    branch: 'Detroit',
  },
];

// Mock consolidation suggestions
const consolidationSuggestions = [
  {
    id: 'CONSOL-001',
    packages: ['PKG-2026-000052', 'PKG-2026-000053'],
    customers: ['Industrial Parts LLC', 'AutoMax Manufacturing'],
    reason: 'Same route corridor (Toledo → Chicago), compatible LTL',
    savings: 145,
    combinedWeight: 4300,
  },
];

const ShipmentPlanner = () => {
  const navigate = useNavigate();
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deliveryWindow, setDeliveryWindow] = useState({ start: '', end: '' });

  const getPriorityColor = (priority) => {
    const colors = {
      'HOT': 'error',
      'RUSH': 'warning',
      'STANDARD': 'default',
    };
    return colors[priority] || 'default';
  };

  const isOverdue = (shipBy) => {
    return new Date(shipBy) <= new Date();
  };

  const togglePackageSelection = (pkgId) => {
    setSelectedPackages(prev => 
      prev.includes(pkgId) 
        ? prev.filter(id => id !== pkgId)
        : [...prev, pkgId]
    );
  };

  const selectedPackageDetails = readyPackages.filter(p => selectedPackages.includes(p.id));
  const totalWeight = selectedPackageDetails.reduce((sum, p) => sum + p.weight, 0);
  const totalPieces = selectedPackageDetails.reduce((sum, p) => sum + p.pieces, 0);

  const filteredPackages = readyPackages.filter(pkg => {
    if (filterBranch !== 'all' && pkg.branch !== filterBranch) return false;
    if (filterPriority !== 'all' && pkg.priority !== filterPriority) return false;
    if (searchText && !pkg.id.toLowerCase().includes(searchText.toLowerCase()) &&
        !pkg.customer.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const handleGetQuotes = () => {
    // Navigate to freight comparison with selected packages
    navigate('/freight/comparison', { state: { packageIds: selectedPackages } });
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Shipment Planner
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Plan and create shipments from ready packages
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Refresh />}>
            Refresh
          </Button>
          <Button 
            variant="contained" 
            startIcon={<LocalShipping />}
            disabled={selectedPackages.length === 0}
            onClick={() => setShowCreateDialog(true)}
          >
            Create Shipment
          </Button>
        </Box>
      </Box>

      {/* Stats Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.light' }}>
                <Inventory2 />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {readyPackages.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ready to Ship
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'error.light' }}>
                <Warning />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {readyPackages.filter(p => p.priority === 'HOT').length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Hot Priority
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'warning.light' }}>
                <Schedule />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {readyPackages.filter(p => isOverdue(p.shipBy)).length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ship Today
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'success.light' }}>
                <Scale />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {(readyPackages.reduce((sum, p) => sum + p.weight, 0) / 1000).toFixed(1)}K
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total lbs Ready
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Package List */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Ready to Ship
              </Typography>
              <Badge badgeContent={selectedPackages.length} color="primary">
                <Chip label="Selected" size="small" variant="outlined" />
              </Badge>
            </Box>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                size="small"
                placeholder="Search..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ flexGrow: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <Select
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="all">All Branches</MenuItem>
                  <MenuItem value="Detroit">Detroit</MenuItem>
                  <MenuItem value="Chicago">Chicago</MenuItem>
                  <MenuItem value="Cleveland">Cleveland</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <Select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="all">All Priority</MenuItem>
                  <MenuItem value="HOT">Hot</MenuItem>
                  <MenuItem value="RUSH">Rush</MenuItem>
                  <MenuItem value="STANDARD">Standard</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Package List */}
            <List sx={{ maxHeight: 450, overflow: 'auto' }}>
              {filteredPackages.map((pkg) => (
                <Card 
                  key={pkg.id} 
                  variant="outlined" 
                  sx={{ 
                    mb: 1, 
                    cursor: 'pointer',
                    borderLeft: '4px solid',
                    borderLeftColor: selectedPackages.includes(pkg.id) ? 'primary.main' : 
                      getPriorityColor(pkg.priority) + '.main',
                    bgcolor: selectedPackages.includes(pkg.id) ? 'primary.50' : 'transparent',
                    '&:hover': { boxShadow: 2 },
                  }}
                  onClick={() => togglePackageSelection(pkg.id)}
                >
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Checkbox 
                        checked={selectedPackages.includes(pkg.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => togglePackageSelection(pkg.id)}
                        size="small"
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" fontWeight={600}>
                            {pkg.id}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Chip 
                              label={pkg.priority} 
                              size="small" 
                              color={getPriorityColor(pkg.priority)}
                            />
                            {pkg.requiresFlatbed && (
                              <Chip label="Flatbed" size="small" variant="outlined" />
                            )}
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {pkg.customer}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOn fontSize="inherit" color="action" />
                            <Typography variant="caption">{pkg.customerCity}</Typography>
                          </Box>
                          <Typography variant="caption">
                            {pkg.material} • {pkg.weight.toLocaleString()} lbs • {pkg.pieces} pcs
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <Schedule fontSize="inherit" color={isOverdue(pkg.shipBy) ? 'error' : 'action'} />
                          <Typography 
                            variant="caption" 
                            color={isOverdue(pkg.shipBy) ? 'error' : 'text.secondary'}
                            fontWeight={isOverdue(pkg.shipBy) ? 600 : 400}
                          >
                            Ship by: {pkg.shipBy} {isOverdue(pkg.shipBy) && '⚠️'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Shipment Builder */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Shipment Builder
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {selectedPackages.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <LocalShipping sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                <Typography color="text.secondary">
                  Select packages from the list to build a shipment
                </Typography>
              </Box>
            ) : (
              <>
                {/* Selected Destination */}
                {selectedPackageDetails.length > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={500}>
                      Destination: {selectedPackageDetails[0].customer}
                    </Typography>
                    <Typography variant="caption">
                      {selectedPackageDetails[0].customerCity}
                    </Typography>
                  </Alert>
                )}

                {/* Selected Packages */}
                <Typography variant="subtitle2" gutterBottom>
                  Selected Packages ({selectedPackages.length})
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {selectedPackageDetails.map((pkg) => (
                    <Box 
                      key={pkg.id}
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        px: 2,
                        py: 1,
                        mb: 0.5,
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={500}>{pkg.id}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {pkg.material}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2">
                          {pkg.weight.toLocaleString()} lbs
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => togglePackageSelection(pkg.id)}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </Box>

                {/* Totals */}
                <Box sx={{ bgcolor: 'primary.50', borderRadius: 1, p: 2, mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Total Weight</Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {totalWeight.toLocaleString()} lbs
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Total Pieces</Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {totalPieces}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Requirements */}
                <Typography variant="subtitle2" gutterBottom>Requirements</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <FormControlLabel 
                    control={<Checkbox checked={selectedPackageDetails.some(p => p.requiresFlatbed)} disabled />} 
                    label="Flatbed Required" 
                  />
                  <FormControlLabel control={<Checkbox />} label="Liftgate" />
                  <FormControlLabel control={<Checkbox />} label="Inside Delivery" />
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    onClick={() => setSelectedPackages([])}
                  >
                    Clear
                  </Button>
                  <Button 
                    variant="contained" 
                    fullWidth
                    startIcon={<RequestQuote />}
                    onClick={handleGetQuotes}
                  >
                    Get Quotes
                  </Button>
                </Box>
              </>
            )}
          </Paper>

          {/* Consolidation Suggestions */}
          {consolidationSuggestions.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Lightbulb color="warning" />
                <Typography variant="subtitle1" fontWeight={600}>
                  Consolidation Suggestions
                </Typography>
              </Box>

              {consolidationSuggestions.map((suggestion) => (
                <Alert 
                  key={suggestion.id} 
                  severity="info"
                  sx={{ mb: 1 }}
                  action={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        size="small" 
                        onClick={() => setSelectedPackages(suggestion.packages)}
                      >
                        Apply
                      </Button>
                      <Button size="small" color="inherit">
                        Dismiss
                      </Button>
                    </Box>
                  }
                >
                  <Typography variant="body2" fontWeight={500}>
                    💡 Combine {suggestion.packages.join(' + ')}
                  </Typography>
                  <Typography variant="caption">
                    {suggestion.reason}
                  </Typography>
                  <Typography variant="caption" display="block" color="success.main" fontWeight={500}>
                    Estimated savings: ${suggestion.savings}
                  </Typography>
                </Alert>
              ))}
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Create Shipment Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Shipment</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Creating shipment with {selectedPackages.length} packages • {totalWeight.toLocaleString()} lbs
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Destination"
                value={selectedPackageDetails[0]?.customer || ''}
                disabled
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Requested Delivery Date"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Service Level</InputLabel>
                <Select label="Service Level" defaultValue="standard">
                  <MenuItem value="economy">Economy (5-7 days)</MenuItem>
                  <MenuItem value="standard">Standard (3-5 days)</MenuItem>
                  <MenuItem value="expedited">Expedited (1-2 days)</MenuItem>
                  <MenuItem value="next_day">Next Day</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Special Instructions"
                multiline
                rows={2}
                placeholder="Delivery instructions, contact info, etc."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            startIcon={<ArrowForward />}
            onClick={() => {
              setShowCreateDialog(false);
              handleGetQuotes();
            }}
          >
            Continue to Quotes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShipmentPlanner;
