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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search,
  QrCode2,
  Edit,
  History,
  Build,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Description,
  Add,
  Visibility,
  Settings,
  Timeline,
  LocationOn,
  Speed,
  Schedule,
} from '@mui/icons-material';

// Mock Data
const assets = [
  {
    assetNumber: 'SAW-JKS-001',
    name: 'DoALL C-916 Band Saw',
    type: 'SAW',
    manufacturer: 'DoALL',
    model: 'C-916',
    serialNumber: 'SN-2019-45678',
    location: 'Jackson - Sawing Area',
    status: 'IN_SERVICE',
    criticality: 'A',
    currentHours: 4850,
    lastPMDate: '2026-01-28',
    nextPMDue: '2026-02-04',
    installDate: '2019-03-15',
  },
  {
    assetNumber: 'SAW-JKS-002',
    name: 'Kalamazoo K10 Cold Saw',
    type: 'SAW',
    manufacturer: 'Kalamazoo',
    model: 'K10',
    serialNumber: 'SN-2020-12345',
    location: 'Jackson - Sawing Area',
    status: 'OUT_OF_SERVICE',
    criticality: 'B',
    currentHours: 3200,
    lastPMDate: '2026-01-21',
    nextPMDue: '2026-01-28',
    installDate: '2020-06-10',
  },
  {
    assetNumber: 'ROUTER-JKS-001',
    name: 'Thermwood Model 43 CNC Router',
    type: 'ROUTER',
    manufacturer: 'Thermwood',
    model: 'Model 43',
    serialNumber: 'TW-2021-78901',
    location: 'Jackson - CNC Area',
    status: 'IN_SERVICE',
    criticality: 'A',
    currentHours: 2150,
    lastPMDate: '2026-01-25',
    nextPMDue: '2026-02-01',
    installDate: '2021-01-20',
  },
  {
    assetNumber: 'CRANE-JKS-001',
    name: 'Overhead Bridge Crane 10T',
    type: 'CRANE',
    manufacturer: 'Demag',
    model: 'EKDR 10T',
    serialNumber: 'DMG-2018-33456',
    location: 'Jackson - Main Bay',
    status: 'IN_SERVICE',
    criticality: 'A',
    currentHours: null,
    lastPMDate: '2025-11-15',
    nextPMDue: '2026-02-15',
    installDate: '2018-08-01',
  },
  {
    assetNumber: 'FORKLIFT-JKS-003',
    name: 'Yale GP050 Forklift',
    type: 'FORKLIFT',
    manufacturer: 'Yale',
    model: 'GP050',
    serialNumber: 'YL-2022-55678',
    location: 'Jackson - Shipping Area',
    status: 'IN_SERVICE',
    criticality: 'B',
    currentHours: 1250,
    lastPMDate: '2026-01-30',
    nextPMDue: '2026-02-06',
    installDate: '2022-04-12',
  },
  {
    assetNumber: 'FORKLIFT-JKS-005',
    name: 'Toyota 8FGU25 Forklift',
    type: 'FORKLIFT',
    manufacturer: 'Toyota',
    model: '8FGU25',
    serialNumber: 'TY-2019-99012',
    location: 'Jackson - Receiving Area',
    status: 'MAINTENANCE',
    criticality: 'B',
    currentHours: 3890,
    lastPMDate: '2026-01-15',
    nextPMDue: '2026-01-22',
    installDate: '2019-09-05',
  },
];

const maintenanceHistory = [
  { woNumber: 'WO-2026-0845', type: 'PM', description: 'Weekly PM Completed', date: 'Jan 28, 2026', technician: 'Mike Johnson' },
  { woNumber: 'WO-2026-0712', type: 'CORRECTIVE', description: 'Blade Replacement', date: 'Jan 15, 2026', technician: 'Tom Davis' },
  { woNumber: 'WO-2026-0598', type: 'PM', description: 'Monthly Inspection', date: 'Jan 7, 2026', technician: 'Mike Johnson' },
  { woNumber: 'WO-2025-2145', type: 'BREAKDOWN', description: 'Motor Replacement', date: 'Dec 20, 2025', technician: 'Sarah Williams' },
];

const AssetRegistry = () => {
  const [tab, setTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [criticalityFilter, setCriticalityFilter] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'IN_SERVICE': return 'success';
      case 'OUT_OF_SERVICE': return 'error';
      case 'MAINTENANCE': return 'warning';
      case 'SAFETY_HOLD': return 'error';
      case 'QUALITY_HOLD': return 'warning';
      case 'PENDING_RETURN': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'IN_SERVICE': return 'In Service';
      case 'OUT_OF_SERVICE': return 'Out of Service';
      case 'MAINTENANCE': return 'Maintenance';
      case 'SAFETY_HOLD': return 'Safety Hold';
      case 'QUALITY_HOLD': return 'Quality Hold';
      case 'PENDING_RETURN': return 'Pending Return';
      default: return status;
    }
  };

  const getCriticalityColor = (criticality) => {
    switch (criticality) {
      case 'A': return 'error';
      case 'B': return 'warning';
      case 'C': return 'default';
      default: return 'default';
    }
  };

  const filteredAssets = assets.filter(asset => {
    if (tab === 1 && asset.status !== 'IN_SERVICE') return false;
    if (tab === 2 && (asset.status === 'IN_SERVICE')) return false;
    if (typeFilter && asset.type !== typeFilter) return false;
    if (statusFilter && asset.status !== statusFilter) return false;
    if (criticalityFilter && asset.criticality !== criticalityFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return asset.assetNumber.toLowerCase().includes(query) ||
             asset.name.toLowerCase().includes(query) ||
             asset.location.toLowerCase().includes(query);
    }
    return true;
  });

  const inServiceCount = assets.filter(a => a.status === 'IN_SERVICE').length;
  const downCount = assets.filter(a => a.status !== 'IN_SERVICE').length;

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Asset Registry
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Equipment inventory and status management
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<QrCode2 />}>
            Scan QR
          </Button>
          <Button variant="contained" startIcon={<Add />}>
            Add Asset
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.light' }}>
                <Settings sx={{ color: 'primary.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{assets.length}</Typography>
                <Typography variant="body2" color="text.secondary">Total Assets</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.light' }}>
                <CheckCircle sx={{ color: 'success.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{inServiceCount}</Typography>
                <Typography variant="body2" color="text.secondary">In Service</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'error.light' }}>
                <Warning sx={{ color: 'error.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{downCount}</Typography>
                <Typography variant="body2" color="text.secondary">Down / Maintenance</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.light' }}>
                <Schedule sx={{ color: 'warning.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>5</Typography>
                <Typography variant="body2" color="text.secondary">PM Due This Week</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label={`All Assets (${assets.length})`} />
          <Tab label={`In Service (${inServiceCount})`} />
          <Tab label={`Down / Maintenance (${downCount})`} />
        </Tabs>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="SAW">Saw</MenuItem>
                <MenuItem value="ROUTER">Router</MenuItem>
                <MenuItem value="CRANE">Crane</MenuItem>
                <MenuItem value="FORKLIFT">Forklift</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="IN_SERVICE">In Service</MenuItem>
                <MenuItem value="OUT_OF_SERVICE">Out of Service</MenuItem>
                <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Criticality</InputLabel>
              <Select value={criticalityFilter} label="Criticality" onChange={(e) => setCriticalityFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="A">Class A (Critical)</MenuItem>
                <MenuItem value="B">Class B (Important)</MenuItem>
                <MenuItem value="C">Class C (Standard)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button 
              variant="text" 
              onClick={() => { setSearchQuery(''); setTypeFilter(''); setStatusFilter(''); setCriticalityFilter(''); }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Asset Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Asset Number</TableCell>
                <TableCell>Name / Model</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Criticality</TableCell>
                <TableCell>Hours</TableCell>
                <TableCell>Next PM</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssets.map((asset) => (
                <TableRow 
                  key={asset.assetNumber} 
                  hover 
                  sx={{ cursor: 'pointer' }}
                  onClick={() => { setSelectedAsset(asset); setDetailOpen(true); }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="primary.main">
                      {asset.assetNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{asset.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{asset.manufacturer} {asset.model}</Typography>
                  </TableCell>
                  <TableCell>{asset.type}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2">{asset.location}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusLabel(asset.status)} 
                      size="small" 
                      color={getStatusColor(asset.status)} 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`Class ${asset.criticality}`} 
                      size="small" 
                      color={getCriticalityColor(asset.criticality)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {asset.currentHours ? asset.currentHours.toLocaleString() : '—'}
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      color={new Date(asset.nextPMDue) < new Date() ? 'error.main' : 'text.primary'}
                    >
                      {asset.nextPMDue}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => { setSelectedAsset(asset); setDetailOpen(true); }}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small">
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Create Work Order">
                      <IconButton size="small">
                        <Build />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Asset Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">{selectedAsset?.assetNumber}</Typography>
              <Typography variant="body2" color="text.secondary">{selectedAsset?.name}</Typography>
            </Box>
            <Chip 
              label={getStatusLabel(selectedAsset?.status)} 
              color={getStatusColor(selectedAsset?.status)} 
            />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedAsset && (
            <Grid container spacing={3}>
              {/* Asset Info */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Equipment Details
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Manufacturer" secondary={selectedAsset.manufacturer} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Model" secondary={selectedAsset.model} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Serial Number" secondary={selectedAsset.serialNumber} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Location" secondary={selectedAsset.location} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Criticality" secondary={`Class ${selectedAsset.criticality}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Install Date" secondary={selectedAsset.installDate} />
                  </ListItem>
                </List>
              </Grid>

              {/* Status & Meters */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Status & Meters
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><CheckCircle color={getStatusColor(selectedAsset.status)} /></ListItemIcon>
                    <ListItemText 
                      primary="Status" 
                      secondary={getStatusLabel(selectedAsset.status)} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Speed color="action" /></ListItemIcon>
                    <ListItemText 
                      primary="Current Hours" 
                      secondary={selectedAsset.currentHours?.toLocaleString() || 'N/A'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><History color="action" /></ListItemIcon>
                    <ListItemText primary="Last PM" secondary={selectedAsset.lastPMDate} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Schedule color="action" /></ListItemIcon>
                    <ListItemText primary="Next PM Due" secondary={selectedAsset.nextPMDue} />
                  </ListItem>
                </List>
              </Grid>

              {/* Maintenance History */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  Recent Maintenance History
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>WO Number</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Technician</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {maintenanceHistory.map((wo) => (
                        <TableRow key={wo.woNumber}>
                          <TableCell>
                            <Typography variant="body2" color="primary.main">{wo.woNumber}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={wo.type} size="small" />
                          </TableCell>
                          <TableCell>{wo.description}</TableCell>
                          <TableCell>{wo.date}</TableCell>
                          <TableCell>{wo.technician}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
          <Button variant="outlined" startIcon={<History />}>Full History</Button>
          <Button variant="contained" startIcon={<Build />}>Create Work Order</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssetRegistry;
