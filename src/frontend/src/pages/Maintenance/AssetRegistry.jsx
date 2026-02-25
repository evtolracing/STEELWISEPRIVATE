import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Build,
  CheckCircle,
  Warning,
  Add,
  Visibility,
  Settings,
  Speed,
  Schedule,
  LocationOn,
  Sync,
} from '@mui/icons-material';
import { getAssets, getAssetStats, getAssetTypes, createAsset, seedAssetsFromWorkCenters } from '../../api/assets';
import { getLocations } from '../../api/inventory';
import { getWorkCenters } from '../../api/workCenters';

const AssetRegistry = () => {
  const [tab, setTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [criticalityFilter, setCriticalityFilter] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Real data state
  const [assets, setAssets] = useState([]);
  const [stats, setStats] = useState({ total: 0, inService: 0, down: 0, maintenance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assetTypes, setAssetTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [workCenters, setWorkCenters] = useState([]);
  const [seeding, setSeeding] = useState(false);

  const [formData, setFormData] = useState({
    assetNumber: '',
    name: '',
    description: '',
    assetTypeId: '',
    siteId: '',
    workCenterId: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    criticality: 'C',
  });

  const resetForm = () => {
    setFormData({
      assetNumber: '',
      name: '',
      description: '',
      assetTypeId: '',
      siteId: '',
      workCenterId: '',
      manufacturer: '',
      model: '',
      serialNumber: '',
      criticality: 'C',
    });
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [assetsData, statsData] = await Promise.all([
        getAssets(),
        getAssetStats(),
      ]);
      setAssets(Array.isArray(assetsData) ? assetsData : []);
      setStats(statsData || { total: 0, inService: 0, down: 0, maintenance: 0 });
      setError(null);
    } catch (err) {
      console.error('Failed to load assets:', err);
      setError('Failed to load assets');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDropdowns = useCallback(async () => {
    try {
      const [typesData, locsData, wcData] = await Promise.all([
        getAssetTypes().catch(() => []),
        getLocations().catch(() => []),
        getWorkCenters().catch(() => []),
      ]);
      setAssetTypes(Array.isArray(typesData) ? typesData : []);
      setLocations(Array.isArray(locsData) ? locsData : locsData?.locations || []);
      setWorkCenters(Array.isArray(wcData) ? wcData : wcData?.workCenters || []);
    } catch (err) {
      console.error('Failed to load dropdowns:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadDropdowns();
  }, [loadData, loadDropdowns]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'IN_SERVICE': return 'success';
      case 'OUT_OF_SERVICE': return 'error';
      case 'MAINTENANCE': return 'warning';
      case 'SAFETY_HOLD': return 'error';
      case 'QUALITY_HOLD': return 'warning';
      case 'PENDING_RETURN': return 'info';
      case 'DECOMMISSIONED': return 'default';
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
      case 'DECOMMISSIONED': return 'Decommissioned';
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
    if (tab === 2 && asset.status === 'IN_SERVICE') return false;
    if (typeFilter && asset.assetType?.category !== typeFilter) return false;
    if (statusFilter && asset.status !== statusFilter) return false;
    if (criticalityFilter && asset.criticality !== criticalityFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (asset.assetNumber || '').toLowerCase().includes(query) ||
             (asset.name || '').toLowerCase().includes(query) ||
             (asset.site?.name || '').toLowerCase().includes(query) ||
             (asset.manufacturer || '').toLowerCase().includes(query);
    }
    return true;
  });

  const handleCreate = async () => {
    try {
      setSubmitting(true);
      await createAsset({
        assetNumber: formData.assetNumber,
        name: formData.name,
        description: formData.description || null,
        assetTypeId: formData.assetTypeId,
        siteId: formData.siteId,
        workCenterId: formData.workCenterId || null,
        manufacturer: formData.manufacturer || null,
        model: formData.model || null,
        serialNumber: formData.serialNumber || null,
        criticality: formData.criticality,
      });
      setCreateOpen(false);
      resetForm();
      setSuccessMsg('Asset created successfully');
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadData();
    } catch (err) {
      console.error('Failed to create asset:', err);
      setError(err?.response?.data?.error || 'Failed to create asset');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSeedFromWorkCenters = async () => {
    try {
      setSeeding(true);
      const result = await seedAssetsFromWorkCenters();
      const created = result.results?.filter(r => r.status === 'created').length || 0;
      const skipped = result.results?.filter(r => r.status === 'skipped').length || 0;
      setSuccessMsg(`Seeded from work centers: ${created} created, ${skipped} skipped (already exist)`);
      setTimeout(() => setSuccessMsg(null), 6000);
      await loadData();
      await loadDropdowns();
    } catch (err) {
      console.error('Failed to seed from work centers:', err);
      setError(err?.response?.data?.error || 'Failed to seed from work centers');
    } finally {
      setSeeding(false);
    }
  };

  const typeCategories = [...new Set(assets.map(a => a.assetType?.category).filter(Boolean))];

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Asset Registry</Typography>
          <Typography variant="body2" color="text.secondary">Equipment inventory and status management</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={seeding ? <CircularProgress size={16} /> : <Sync />}
            onClick={handleSeedFromWorkCenters}
            disabled={seeding}
          >
            {seeding ? 'Seeding...' : 'Import Work Centers'}
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setCreateOpen(true); loadDropdowns(); }}>
            Add Asset
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg(null)}>{successMsg}</Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.light' }}><Settings sx={{ color: 'primary.main' }} /></Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{stats.total}</Typography>
                <Typography variant="body2" color="text.secondary">Total Assets</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.light' }}><CheckCircle sx={{ color: 'success.main' }} /></Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{stats.inService}</Typography>
                <Typography variant="body2" color="text.secondary">In Service</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'error.light' }}><Warning sx={{ color: 'error.main' }} /></Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{stats.down}</Typography>
                <Typography variant="body2" color="text.secondary">Down / Out of Service</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.light' }}><Schedule sx={{ color: 'warning.main' }} /></Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{stats.maintenance}</Typography>
                <Typography variant="body2" color="text.secondary">In Maintenance</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label={`All Assets (${stats.total})`} />
          <Tab label={`In Service (${stats.inService})`} />
          <Tab label={`Down / Maintenance (${stats.down})`} />
        </Tabs>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth size="small" placeholder="Search assets..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {typeCategories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
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
                <MenuItem value="SAFETY_HOLD">Safety Hold</MenuItem>
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
            <Button variant="text" onClick={() => { setSearchQuery(''); setTypeFilter(''); setStatusFilter(''); setCriticalityFilter(''); }}>
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
                <TableCell>Work Center</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary" component="span">Loading assets...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {assets.length === 0
                        ? 'No assets found. Click "Import Work Centers" to create assets from your work centers, or "Add Asset" to create one manually.'
                        : 'No assets match your filters.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredAssets.map((asset) => (
                <TableRow key={asset.id} hover sx={{ cursor: 'pointer' }}
                  onClick={() => { setSelectedAsset(asset); setDetailOpen(true); }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="primary.main">{asset.assetNumber}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{asset.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {[asset.manufacturer, asset.model].filter(Boolean).join(' ') || '\u2014'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{asset.assetType?.category || asset.assetType?.name || '\u2014'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2">{asset.site?.name || '\u2014'}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={getStatusLabel(asset.status)} size="small" color={getStatusColor(asset.status)} />
                  </TableCell>
                  <TableCell>
                    <Chip label={`Class ${asset.criticality}`} size="small" color={getCriticalityColor(asset.criticality)} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{asset.workCenter?.code || '\u2014'}</Typography>
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => { setSelectedAsset(asset); setDetailOpen(true); }}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Create Work Order">
                      <IconButton size="small"><Build /></IconButton>
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
            <Chip label={getStatusLabel(selectedAsset?.status)} color={getStatusColor(selectedAsset?.status)} />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedAsset && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Equipment Details</Typography>
                <List dense>
                  <ListItem><ListItemText primary="Manufacturer" secondary={selectedAsset.manufacturer || '\u2014'} /></ListItem>
                  <ListItem><ListItemText primary="Model" secondary={selectedAsset.model || '\u2014'} /></ListItem>
                  <ListItem><ListItemText primary="Serial Number" secondary={selectedAsset.serialNumber || '\u2014'} /></ListItem>
                  <ListItem><ListItemText primary="Location" secondary={selectedAsset.site?.name || '\u2014'} /></ListItem>
                  <ListItem><ListItemText primary="Work Center" secondary={selectedAsset.workCenter ? `${selectedAsset.workCenter.code} \u2014 ${selectedAsset.workCenter.name}` : '\u2014'} /></ListItem>
                  <ListItem><ListItemText primary="Criticality" secondary={`Class ${selectedAsset.criticality}`} /></ListItem>
                  <ListItem><ListItemText primary="Type" secondary={selectedAsset.assetType?.name || '\u2014'} /></ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Status & Info</Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><CheckCircle color={getStatusColor(selectedAsset.status)} /></ListItemIcon>
                    <ListItemText primary="Status" secondary={getStatusLabel(selectedAsset.status)} />
                  </ListItem>
                  {selectedAsset.currentHours && (
                    <ListItem>
                      <ListItemIcon><Speed color="action" /></ListItemIcon>
                      <ListItemText primary="Current Hours" secondary={Number(selectedAsset.currentHours).toLocaleString()} />
                    </ListItem>
                  )}
                  {selectedAsset.description && (
                    <ListItem><ListItemText primary="Description" secondary={selectedAsset.description} /></ListItem>
                  )}
                  <ListItem>
                    <ListItemText primary="Created" secondary={selectedAsset.createdAt ? new Date(selectedAsset.createdAt).toLocaleDateString() : '\u2014'} />
                  </ListItem>
                </List>
              </Grid>

              {/* Maintenance Orders on this asset */}
              {selectedAsset.maintenanceOrders?.length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                    Recent Maintenance Orders
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>WO Number</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Title</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedAsset.maintenanceOrders.map((mo) => (
                          <TableRow key={mo.id}>
                            <TableCell><Typography variant="body2" color="primary.main">{mo.woNumber}</Typography></TableCell>
                            <TableCell><Chip label={mo.type} size="small" /></TableCell>
                            <TableCell>{mo.title}</TableCell>
                            <TableCell><Chip label={mo.status} size="small" variant="outlined" /></TableCell>
                            <TableCell>{new Date(mo.createdAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<Build />}>Create Work Order</Button>
        </DialogActions>
      </Dialog>

      {/* Create Asset Dialog */}
      <Dialog open={createOpen} onClose={() => { setCreateOpen(false); resetForm(); }} maxWidth="sm" fullWidth>
        <DialogTitle>Add Asset</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth required label="Asset Number" placeholder="e.g. SAW-001"
                value={formData.assetNumber} onChange={(e) => setFormData(f => ({ ...f, assetNumber: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth required label="Name" placeholder="e.g. DoALL C-916 Band Saw"
                value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2}
                value={formData.description} onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Asset Type</InputLabel>
                <Select label="Asset Type" value={formData.assetTypeId}
                  onChange={(e) => setFormData(f => ({ ...f, assetTypeId: e.target.value }))}>
                  {assetTypes.map(t => (
                    <MenuItem key={t.id} value={t.id}>{t.name}{t.category ? ` (${t.category})` : ''}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {assetTypes.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  No asset types found. Import work centers first to create a default type.
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Site / Location</InputLabel>
                <Select label="Site / Location" value={formData.siteId}
                  onChange={(e) => setFormData(f => ({ ...f, siteId: e.target.value }))}>
                  {locations.map(loc => (
                    <MenuItem key={loc.id} value={loc.id}>{loc.code ? `${loc.code} \u2014 ` : ''}{loc.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Work Center (optional)</InputLabel>
                <Select label="Work Center (optional)" value={formData.workCenterId}
                  onChange={(e) => setFormData(f => ({ ...f, workCenterId: e.target.value }))}>
                  <MenuItem value="">None</MenuItem>
                  {workCenters.map(wc => (
                    <MenuItem key={wc.id} value={wc.id}>{wc.code} \u2014 {wc.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Criticality</InputLabel>
                <Select label="Criticality" value={formData.criticality}
                  onChange={(e) => setFormData(f => ({ ...f, criticality: e.target.value }))}>
                  <MenuItem value="A">Class A \u2014 Critical</MenuItem>
                  <MenuItem value="B">Class B \u2014 Important</MenuItem>
                  <MenuItem value="C">Class C \u2014 Standard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Manufacturer"
                value={formData.manufacturer} onChange={(e) => setFormData(f => ({ ...f, manufacturer: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Model"
                value={formData.model} onChange={(e) => setFormData(f => ({ ...f, model: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Serial Number"
                value={formData.serialNumber} onChange={(e) => setFormData(f => ({ ...f, serialNumber: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCreateOpen(false); resetForm(); }}>Cancel</Button>
          <Button variant="contained"
            disabled={submitting || !formData.assetNumber || !formData.name || !formData.assetTypeId || !formData.siteId}
            onClick={handleCreate}
          >
            {submitting ? 'Creating...' : 'Create Asset'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssetRegistry;
