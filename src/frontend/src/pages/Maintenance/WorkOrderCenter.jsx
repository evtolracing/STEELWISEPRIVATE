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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Tooltip,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Add,
  Search,
  Build,
  Schedule,
  CheckCircle,
  Warning,
  PlayArrow,
  Pause,
  Done,
  Visibility,
  PriorityHigh,
  Engineering,
  LocalShipping,
  Assignment,
} from '@mui/icons-material';
import {
  getMaintenanceOrders,
  getMaintenanceOrderStats,
  createMaintenanceOrder,
  startMaintenanceOrder,
  completeMaintenanceOrder,
  getMaintenanceAssets,
} from '../../api/maintenanceOrders';

const WorkOrderCenter = () => {
  const [tab, setTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWO, setSelectedWO] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createStep, setCreateStep] = useState(0);


  // Real data state
  const [workOrders, setWorkOrders] = useState([]);
  const [assets, setAssets] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inProgress: 0, waitingParts: 0, breakdowns: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Create form state
  const [formData, setFormData] = useState({
    assetId: '',
    type: 'CORRECTIVE',
    problemCode: '',
    title: '',
    description: '',
    priority: 'NORMAL',
    assignedTeam: '',
    estimatedHours: 2,
    scheduledStart: '',
    lotoRequired: false,
    hotWorkRequired: false,
    confinedSpaceRequired: false,
    permitRequired: false,
    safetyNotes: '',
  });

  const resetForm = () => {
    setFormData({
      assetId: '',
      type: 'CORRECTIVE',
      problemCode: '',
      title: '',
      description: '',
      priority: 'NORMAL',
      assignedTeam: '',
      estimatedHours: 2,
      scheduledStart: '',
      lotoRequired: false,
      hotWorkRequired: false,
      confinedSpaceRequired: false,
      permitRequired: false,
      safetyNotes: '',
    });
    setCreateStep(0);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [ordersData, statsData] = await Promise.all([
        getMaintenanceOrders(),
        getMaintenanceOrderStats(),
      ]);
      setWorkOrders(Array.isArray(ordersData) ? ordersData : []);
      setStats(statsData || { total: 0, active: 0, inProgress: 0, waitingParts: 0, breakdowns: 0, completed: 0 });
      setError(null);
    } catch (err) {
      console.error('Failed to load maintenance orders:', err);
      setError('Failed to load work orders');
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAssets = useCallback(async () => {
    try {
      const data = await getMaintenanceAssets();
      setAssets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load assets:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadAssets();
  }, [loadData, loadAssets]);

  const getTypeColor = (type) => {
    switch (type) {
      case 'BREAKDOWN': return 'error';
      case 'CORRECTIVE': return 'warning';
      case 'PM': return 'success';
      case 'PROJECT': return 'info';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'EMERGENCY': return 'error';
      case 'HIGH': return 'warning';
      case 'NORMAL': return 'primary';
      case 'LOW': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'IN_PROGRESS': return 'info';
      case 'SCHEDULED': case 'APPROVED': return 'default';
      case 'WAITING_PARTS': return 'warning';
      case 'COMPLETED': case 'VERIFIED': case 'CLOSED': return 'success';
      case 'PENDING_APPROVAL': return 'secondary';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'DRAFT': return 'Draft';
      case 'PENDING_APPROVAL': return 'Pending Approval';
      case 'APPROVED': return 'Approved';
      case 'SCHEDULED': return 'Scheduled';
      case 'IN_PROGRESS': return 'In Progress';
      case 'WAITING_PARTS': return 'Waiting Parts';
      case 'COMPLETED': return 'Completed';
      case 'VERIFIED': return 'Verified';
      case 'CLOSED': return 'Closed';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'IN_PROGRESS': return <PlayArrow />;
      case 'SCHEDULED': return <Schedule />;
      case 'WAITING_PARTS': return <LocalShipping />;
      case 'COMPLETED': return <CheckCircle />;
      case 'ON_HOLD': return <Pause />;
      default: return <Assignment />;
    }
  };

  const closedStatuses = ['COMPLETED', 'VERIFIED', 'CLOSED', 'CANCELLED'];

  const filteredWOs = workOrders.filter(wo => {
    if (tab === 1 && closedStatuses.includes(wo.status)) return false;
    if (tab === 2 && wo.status !== 'IN_PROGRESS') return false;
    if (tab === 3 && wo.status !== 'WAITING_PARTS') return false;
    if (tab === 4 && !closedStatuses.includes(wo.status)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (wo.woNumber || '').toLowerCase().includes(query) || 
             (wo.asset?.assetNumber || '').toLowerCase().includes(query) ||
             (wo.asset?.name || '').toLowerCase().includes(query) ||
             (wo.title || '').toLowerCase().includes(query);
    }
    return true;
  });

  const handleCreateSubmit = async () => {
    try {
      setSubmitting(true);
      await createMaintenanceOrder({
        assetId: formData.assetId,
        type: formData.type,
        title: formData.title,
        description: formData.description || null,
        problemCode: formData.problemCode || null,
        priority: formData.priority,
        assignedTeam: formData.assignedTeam || null,
        estimatedHours: formData.estimatedHours || null,
        scheduledStart: formData.scheduledStart || null,
        lotoRequired: formData.lotoRequired,
        hotWorkRequired: formData.hotWorkRequired,
        confinedSpaceRequired: formData.confinedSpaceRequired,
        permitRequired: formData.permitRequired,
      });
      setShowCreateDialog(false);
      resetForm();
      await loadData(); // Refresh list
    } catch (err) {
      console.error('Failed to create maintenance order:', err);
      setError('Failed to create work order: ' + (err?.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartWork = async (woId) => {
    try {
      await startMaintenanceOrder(woId);
      await loadData();
      setSelectedWO(null);
    } catch (err) {
      console.error('Failed to start work:', err);
    }
  };

  const handleCompleteWork = async (woId) => {
    try {
      await completeMaintenanceOrder(woId, {});
      await loadData();
      setSelectedWO(null);
    } catch (err) {
      console.error('Failed to complete work:', err);
    }
  };

  const createSteps = ['Select Asset', 'Problem Description', 'Priority & Assignment', 'Safety Requirements', 'Review'];

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Work Order Center
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and track maintenance work orders
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setShowCreateDialog(true)}>
          New Work Order
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {stats.breakdowns > 0 && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<PriorityHigh />}>
          <strong>{stats.breakdowns} active breakdown(s)</strong> requiring immediate attention
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.light' }}>
                <Build sx={{ color: 'primary.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{stats.active}</Typography>
                <Typography variant="body2" color="text.secondary">Active Work Orders</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.light' }}>
                <PlayArrow sx={{ color: 'info.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{stats.inProgress}</Typography>
                <Typography variant="body2" color="text.secondary">In Progress</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.light' }}>
                <LocalShipping sx={{ color: 'warning.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{stats.waitingParts}</Typography>
                <Typography variant="body2" color="text.secondary">Waiting Parts</Typography>
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
                <Typography variant="h5" fontWeight={700}>{stats.breakdowns}</Typography>
                <Typography variant="body2" color="text.secondary">Breakdowns</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label={`All (${stats.total})`} />
          <Tab label={`Active (${stats.active})`} />
          <Tab label={`In Progress (${stats.inProgress})`} />
          <Tab label={`Waiting Parts (${stats.waitingParts})`} />
          <Tab label={`Completed (${stats.completed})`} />
        </Tabs>
      </Paper>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search work orders..."
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
              <Select label="Type" defaultValue="">
                <MenuItem value="">All</MenuItem>
                <MenuItem value="BREAKDOWN">Breakdown</MenuItem>
                <MenuItem value="CORRECTIVE">Corrective</MenuItem>
                <MenuItem value="PM">Preventive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select label="Priority" defaultValue="">
                <MenuItem value="">All</MenuItem>
                <MenuItem value="EMERGENCY">Emergency</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="NORMAL">Normal</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Team</InputLabel>
              <Select label="Team" defaultValue="">
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Mechanical">Mechanical</MenuItem>
                <MenuItem value="Electrical">Electrical</MenuItem>
                <MenuItem value="External">External</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Work Order Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>WO Number</TableCell>
                <TableCell>Asset / Description</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Team</TableCell>
                <TableCell>Est. Hours</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Loading work orders...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredWOs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {searchQuery ? 'No work orders match your search' : 'No work orders found. Create one to get started.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredWOs.map((wo) => (
                <TableRow 
                  key={wo.id} 
                  hover 
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setSelectedWO(wo)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="primary.main">
                      {wo.woNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {wo.asset?.assetNumber || '—'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ 
                      display: 'block', 
                      maxWidth: 250, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}>
                      {wo.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={wo.type} size="small" color={getTypeColor(wo.type)} />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={wo.priority} 
                      size="small" 
                      color={getPriorityColor(wo.priority)}
                      icon={wo.priority === 'EMERGENCY' ? <PriorityHigh /> : undefined}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusLabel(wo.status)} 
                      size="small" 
                      color={getStatusColor(wo.status)} 
                      variant="outlined"
                      icon={getStatusIcon(wo.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Engineering fontSize="small" color="action" />
                      <Typography variant="body2">{wo.assignedTeam || '—'}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {wo.actualHours != null ? (
                      <Typography variant="body2">
                        {Number(wo.actualHours)} / {Number(wo.estimatedHours || 0)}h
                      </Typography>
                    ) : (
                      <Typography variant="body2">{wo.estimatedHours ? `${Number(wo.estimatedHours)}h` : '—'}</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => setSelectedWO(wo)}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    {(wo.status === 'SCHEDULED' || wo.status === 'APPROVED') && (
                      <Tooltip title="Start Work">
                        <IconButton size="small" color="primary" onClick={() => handleStartWork(wo.id)}>
                          <PlayArrow />
                        </IconButton>
                      </Tooltip>
                    )}
                    {wo.status === 'IN_PROGRESS' && (
                      <Tooltip title="Complete">
                        <IconButton size="small" color="success" onClick={() => handleCompleteWork(wo.id)}>
                          <Done />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* WO Detail Dialog */}
      <Dialog open={!!selectedWO} onClose={() => setSelectedWO(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6">{selectedWO?.woNumber}</Typography>
              <Chip label={selectedWO?.type} size="small" color={getTypeColor(selectedWO?.type)} />
              <Chip label={selectedWO?.priority} size="small" color={getPriorityColor(selectedWO?.priority)} />
            </Box>
            <Chip 
              label={getStatusLabel(selectedWO?.status)} 
              color={getStatusColor(selectedWO?.status)} 
            />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedWO && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 1 }}>{selectedWO.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Asset: {selectedWO.asset?.assetNumber || '—'} — {selectedWO.asset?.name || ''}
                </Typography>
                {selectedWO.description && (
                  <Typography variant="body2" sx={{ mt: 1 }}>{selectedWO.description}</Typography>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Created" secondary={selectedWO.createdAt ? new Date(selectedWO.createdAt).toLocaleString() : '—'} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Started" secondary={selectedWO.actualStart ? new Date(selectedWO.actualStart).toLocaleString() : 'Not started'} />
                  </ListItem>
                  {selectedWO.completedAt && (
                    <ListItem>
                      <ListItemText primary="Completed" secondary={new Date(selectedWO.completedAt).toLocaleString()} />
                    </ListItem>
                  )}
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Team" secondary={selectedWO.assignedTeam || 'Unassigned'} />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Hours" 
                      secondary={`${selectedWO.actualHours ? Number(selectedWO.actualHours) : 0} / ${selectedWO.estimatedHours ? Number(selectedWO.estimatedHours) : 0} hours`} 
                    />
                  </ListItem>
                  {selectedWO.problemCode && (
                    <ListItem>
                      <ListItemText primary="Problem Category" secondary={selectedWO.problemCode} />
                    </ListItem>
                  )}
                </List>
              </Grid>

              {/* Safety info */}
              {(selectedWO.lotoRequired || selectedWO.hotWorkRequired || selectedWO.confinedSpaceRequired || selectedWO.permitRequired) && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    <strong>Safety Requirements:</strong>{' '}
                    {[
                      selectedWO.lotoRequired && 'LOTO',
                      selectedWO.hotWorkRequired && 'Hot Work Permit',
                      selectedWO.confinedSpaceRequired && 'Confined Space',
                      selectedWO.permitRequired && 'Permit Required',
                    ].filter(Boolean).join(', ')}
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedWO(null)}>Close</Button>
          {(selectedWO?.status === 'SCHEDULED' || selectedWO?.status === 'APPROVED') && (
            <Button variant="contained" color="primary" startIcon={<PlayArrow />} onClick={() => handleStartWork(selectedWO.id)}>
              Start Work
            </Button>
          )}
          {selectedWO?.status === 'IN_PROGRESS' && (
            <Button variant="contained" color="success" startIcon={<Done />} onClick={() => handleCompleteWork(selectedWO.id)}>
              Complete
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Create Work Order Dialog */}
      <Dialog open={showCreateDialog} onClose={() => { setShowCreateDialog(false); resetForm(); }} maxWidth="md" fullWidth>
        <DialogTitle>Create Work Order</DialogTitle>
        <DialogContent>
          <Stepper activeStep={createStep} sx={{ my: 3 }}>
            {createSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {createStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Select Asset</InputLabel>
                  <Select
                    label="Select Asset"
                    value={formData.assetId}
                    onChange={(e) => setFormData(f => ({ ...f, assetId: e.target.value }))}
                  >
                    {assets.map((a) => (
                      <MenuItem key={a.id} value={a.id}>
                        {a.assetNumber} — {a.name}{a.workCenter ? ` (${a.workCenter.code})` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {assets.length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    No assets found in the database. Add assets in the Asset Management section first.
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}

          {createStep === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Title / Short Description"
                  placeholder="e.g. Motor overheating - emergency shutdown"
                  value={formData.title}
                  onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Work Order Type</InputLabel>
                  <Select
                    label="Work Order Type"
                    value={formData.type}
                    onChange={(e) => setFormData(f => ({ ...f, type: e.target.value }))}
                  >
                    <MenuItem value="BREAKDOWN">Breakdown (Emergency)</MenuItem>
                    <MenuItem value="CORRECTIVE">Corrective</MenuItem>
                    <MenuItem value="PM">Preventive Maintenance</MenuItem>
                    <MenuItem value="INSPECTION">Inspection</MenuItem>
                    <MenuItem value="CALIBRATION">Calibration</MenuItem>
                    <MenuItem value="MODIFICATION">Modification</MenuItem>
                    <MenuItem value="SAFETY_RELATED">Safety Related</MenuItem>
                    <MenuItem value="QUALITY_RELATED">Quality Related</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Problem Category</InputLabel>
                  <Select
                    label="Problem Category"
                    value={formData.problemCode}
                    onChange={(e) => setFormData(f => ({ ...f, problemCode: e.target.value }))}
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="mechanical">Mechanical</MenuItem>
                    <MenuItem value="electrical">Electrical</MenuItem>
                    <MenuItem value="hydraulic">Hydraulic</MenuItem>
                    <MenuItem value="pneumatic">Pneumatic</MenuItem>
                    <MenuItem value="software">Software/Controls</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Problem Description"
                  placeholder="Describe the problem or work required..."
                  value={formData.description}
                  onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                />
              </Grid>
            </Grid>
          )}

          {createStep === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Asset"
                  value={(() => { const a = assets.find(a => a.id === formData.assetId); return a ? `${a.assetNumber} — ${a.name}` : 'Not selected'; })()}
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    label="Priority"
                    value={formData.priority}
                    onChange={(e) => setFormData(f => ({ ...f, priority: e.target.value }))}
                  >
                    <MenuItem value="EMERGENCY">Emergency</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="NORMAL">Normal</MenuItem>
                    <MenuItem value="LOW">Low</MenuItem>
                    <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Assigned Team"
                  placeholder="e.g. Mechanical, Electrical, External"
                  value={formData.assignedTeam}
                  onChange={(e) => setFormData(f => ({ ...f, assignedTeam: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Estimated Hours"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData(f => ({ ...f, estimatedHours: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Target Start Date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.scheduledStart}
                  onChange={(e) => setFormData(f => ({ ...f, scheduledStart: e.target.value }))}
                />
              </Grid>
            </Grid>
          )}

          {createStep === 3 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Safety requirements must be addressed before work begins
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Checkbox checked={formData.lotoRequired} onChange={(e) => setFormData(f => ({ ...f, lotoRequired: e.target.checked }))} />}
                  label="LOTO (Lockout/Tagout) Required"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Checkbox checked={formData.hotWorkRequired} onChange={(e) => setFormData(f => ({ ...f, hotWorkRequired: e.target.checked }))} />}
                  label="Hot Work Permit Required"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Checkbox checked={formData.confinedSpaceRequired} onChange={(e) => setFormData(f => ({ ...f, confinedSpaceRequired: e.target.checked }))} />}
                  label="Confined Space Entry Required"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Checkbox checked={formData.permitRequired} onChange={(e) => setFormData(f => ({ ...f, permitRequired: e.target.checked }))} />}
                  label="Work Permit / Fall Protection Required"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Additional Safety Notes"
                  value={formData.safetyNotes}
                  onChange={(e) => setFormData(f => ({ ...f, safetyNotes: e.target.value }))}
                />
              </Grid>
            </Grid>
          )}

          {createStep === 4 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="success">
                  Review work order details before submitting
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Asset</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {(() => { const a = assets.find(a => a.id === formData.assetId); return a ? `${a.assetNumber} — ${a.name}` : 'Not selected'; })()}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Title</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{formData.title || '—'}</Typography>

                  <Typography variant="subtitle2" color="text.secondary">Type & Priority</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip label={formData.type} color={getTypeColor(formData.type)} size="small" />
                    <Chip label={formData.priority} color={getPriorityColor(formData.priority)} size="small" />
                  </Box>

                  {formData.description && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>{formData.description}</Typography>
                    </>
                  )}

                  <Typography variant="subtitle2" color="text.secondary">Assigned Team</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{formData.assignedTeam || 'Unassigned'}</Typography>

                  <Typography variant="subtitle2" color="text.secondary">Estimated Hours</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{formData.estimatedHours || '—'}</Typography>

                  <Typography variant="subtitle2" color="text.secondary">Safety Requirements</Typography>
                  <Typography variant="body1">
                    {[
                      formData.lotoRequired && 'LOTO Required',
                      formData.hotWorkRequired && 'Hot Work Permit',
                      formData.confinedSpaceRequired && 'Confined Space',
                      formData.permitRequired && 'Work Permit / Fall Protection',
                    ].filter(Boolean).join(', ') || 'None'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowCreateDialog(false); resetForm(); }}>Cancel</Button>
          {createStep > 0 && (
            <Button onClick={() => setCreateStep(createStep - 1)}>Back</Button>
          )}
          {createStep < createSteps.length - 1 && (
            <Button variant="contained" onClick={() => setCreateStep(createStep + 1)}>Next</Button>
          )}
          {createStep === createSteps.length - 1 && (
            <Button 
              variant="contained" 
              color="success"
              disabled={submitting || !formData.assetId || !formData.title}
              onClick={handleCreateSubmit}
            >
              {submitting ? 'Creating...' : 'Create Work Order'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkOrderCenter;
