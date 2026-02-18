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
  Divider,
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
  Edit,
  PriorityHigh,
  Engineering,
  LocalShipping,
  Settings,
  AccessTime,
  Assignment,
} from '@mui/icons-material';
import { getWorkCenters } from '../../api/workCenters';

// Mock Data
const workOrders = [
  { 
    id: 'WO-2026-0892', 
    asset: 'SAW-02', 
    assetName: 'Kalamazoo K10 Cold Saw',
    title: 'Motor overheating - emergency shutdown', 
    type: 'BREAKDOWN', 
    status: 'IN_PROGRESS', 
    priority: 'EMERGENCY',
    technician: 'Mike Johnson',
    createdAt: '2026-02-04 08:30 AM',
    startedAt: '2026-02-04 08:45 AM',
    estimatedHours: 3,
    actualHours: null,
  },
  { 
    id: 'WO-2026-0891', 
    asset: 'FORKLIFT-03', 
    assetName: 'Yale GP050',
    title: 'Weekly PM - General inspection and lubrication', 
    type: 'PM', 
    status: 'SCHEDULED', 
    priority: 'NORMAL',
    technician: 'Tom Davis',
    createdAt: '2026-02-01',
    startedAt: null,
    estimatedHours: 1,
    actualHours: null,
  },
  { 
    id: 'WO-2026-0890', 
    asset: 'ROUTER-01', 
    assetName: 'Thermwood Model 43',
    title: 'Spindle vibration - abnormal noise during operation', 
    type: 'CORRECTIVE', 
    status: 'WAITING_PARTS', 
    priority: 'HIGH',
    technician: 'Sarah Williams',
    createdAt: '2026-02-03',
    startedAt: '2026-02-03 10:00 AM',
    estimatedHours: 4,
    actualHours: 2,
    waitingFor: 'Spindle Bearing Set (ETA: Feb 6)',
  },
  { 
    id: 'WO-2026-0889', 
    asset: 'CRANE-01', 
    assetName: 'Overhead Bridge Crane 10T',
    title: 'Annual load test and safety certification', 
    type: 'PM', 
    status: 'SCHEDULED', 
    priority: 'NORMAL',
    technician: 'External Contractor - SafetyFirst Inc.',
    createdAt: '2026-01-28',
    startedAt: null,
    estimatedHours: 8,
    actualHours: null,
  },
  { 
    id: 'WO-2026-0888', 
    asset: 'SHEAR-01', 
    assetName: 'LVD PPEB-8 Press Brake',
    title: 'Blade replacement and alignment', 
    type: 'CORRECTIVE', 
    status: 'COMPLETED', 
    priority: 'HIGH',
    technician: 'Mike Johnson',
    createdAt: '2026-02-01',
    startedAt: '2026-02-02 09:00 AM',
    completedAt: '2026-02-02 02:30 PM',
    estimatedHours: 6,
    actualHours: 5.5,
  },
  { 
    id: 'WO-2026-0887', 
    asset: 'FORKLIFT-05', 
    assetName: 'Toyota 8FGU25',
    title: 'Transmission fluid leak investigation', 
    type: 'BREAKDOWN', 
    status: 'IN_PROGRESS', 
    priority: 'HIGH',
    technician: 'Tom Davis',
    createdAt: '2026-02-03',
    startedAt: '2026-02-03 02:00 PM',
    estimatedHours: 4,
    actualHours: null,
  },
];

const WorkOrderCenter = () => {
  const [tab, setTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWO, setSelectedWO] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [workCenters, setWorkCenters] = useState([]);
  const [selectedWorkCenter, setSelectedWorkCenter] = useState('');

  const loadWorkCenters = useCallback(async () => {
    try {
      const data = await getWorkCenters();
      setWorkCenters(Array.isArray(data) ? data : data?.workCenters || []);
    } catch (err) {
      console.error('Failed to load work centers:', err);
    }
  }, []);

  useEffect(() => { loadWorkCenters(); }, [loadWorkCenters]);

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
      case 'SCHEDULED': return 'default';
      case 'WAITING_PARTS': return 'warning';
      case 'COMPLETED': return 'success';
      case 'ON_HOLD': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'IN_PROGRESS': return 'In Progress';
      case 'SCHEDULED': return 'Scheduled';
      case 'WAITING_PARTS': return 'Waiting Parts';
      case 'COMPLETED': return 'Completed';
      case 'ON_HOLD': return 'On Hold';
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

  const filteredWOs = workOrders.filter(wo => {
    if (tab === 1 && wo.status === 'COMPLETED') return false;
    if (tab === 2 && wo.status !== 'IN_PROGRESS') return false;
    if (tab === 3 && wo.status !== 'WAITING_PARTS') return false;
    if (tab === 4 && wo.status !== 'COMPLETED') return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return wo.id.toLowerCase().includes(query) || 
             wo.asset.toLowerCase().includes(query) ||
             wo.title.toLowerCase().includes(query);
    }
    return true;
  });

  const activeCount = workOrders.filter(w => w.status !== 'COMPLETED').length;
  const inProgressCount = workOrders.filter(w => w.status === 'IN_PROGRESS').length;
  const waitingPartsCount = workOrders.filter(w => w.status === 'WAITING_PARTS').length;
  const breakdownCount = workOrders.filter(w => w.type === 'BREAKDOWN' && w.status !== 'COMPLETED').length;

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
      {breakdownCount > 0 && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<PriorityHigh />}>
          <strong>{breakdownCount} active breakdown(s)</strong> requiring immediate attention
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
                <Typography variant="h5" fontWeight={700}>{activeCount}</Typography>
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
                <Typography variant="h5" fontWeight={700}>{inProgressCount}</Typography>
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
                <Typography variant="h5" fontWeight={700}>{waitingPartsCount}</Typography>
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
                <Typography variant="h5" fontWeight={700}>{breakdownCount}</Typography>
                <Typography variant="body2" color="text.secondary">Breakdowns</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label={`All (${workOrders.length})`} />
          <Tab label={`Active (${activeCount})`} />
          <Tab label={`In Progress (${inProgressCount})`} />
          <Tab label={`Waiting Parts (${waitingPartsCount})`} />
          <Tab label="Completed" />
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
              <InputLabel>Technician</InputLabel>
              <Select label="Technician" defaultValue="">
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Mike Johnson">Mike Johnson</MenuItem>
                <MenuItem value="Tom Davis">Tom Davis</MenuItem>
                <MenuItem value="Sarah Williams">Sarah Williams</MenuItem>
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
                <TableCell>Technician</TableCell>
                <TableCell>Est. Hours</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredWOs.map((wo) => (
                <TableRow 
                  key={wo.id} 
                  hover 
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setSelectedWO(wo)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="primary.main">
                      {wo.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{wo.asset}</Typography>
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
                      <Typography variant="body2">{wo.technician}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {wo.actualHours !== null ? (
                      <Typography variant="body2">
                        {wo.actualHours} / {wo.estimatedHours}h
                      </Typography>
                    ) : (
                      <Typography variant="body2">{wo.estimatedHours}h</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => setSelectedWO(wo)}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    {wo.status === 'SCHEDULED' && (
                      <Tooltip title="Start Work">
                        <IconButton size="small" color="primary">
                          <PlayArrow />
                        </IconButton>
                      </Tooltip>
                    )}
                    {wo.status === 'IN_PROGRESS' && (
                      <Tooltip title="Complete">
                        <IconButton size="small" color="success">
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
              <Typography variant="h6">{selectedWO?.id}</Typography>
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
                  Asset: {selectedWO.asset} - {selectedWO.assetName}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Created" secondary={selectedWO.createdAt} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Started" secondary={selectedWO.startedAt || 'Not started'} />
                  </ListItem>
                  {selectedWO.completedAt && (
                    <ListItem>
                      <ListItemText primary="Completed" secondary={selectedWO.completedAt} />
                    </ListItem>
                  )}
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Assigned To" secondary={selectedWO.technician} />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Hours" 
                      secondary={`${selectedWO.actualHours || 0} / ${selectedWO.estimatedHours} hours`} 
                    />
                  </ListItem>
                </List>
              </Grid>

              {selectedWO.waitingFor && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    <strong>Waiting for:</strong> {selectedWO.waitingFor}
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedWO(null)}>Close</Button>
          {selectedWO?.status === 'SCHEDULED' && (
            <Button variant="contained" color="primary" startIcon={<PlayArrow />}>
              Start Work
            </Button>
          )}
          {selectedWO?.status === 'IN_PROGRESS' && (
            <Button variant="contained" color="success" startIcon={<Done />}>
              Complete
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Create Work Order Dialog */}
      <Dialog open={showCreateDialog} onClose={() => { setShowCreateDialog(false); setCreateStep(0); setSelectedWorkCenter(''); }} maxWidth="md" fullWidth>
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
                  <InputLabel>Select Asset / Work Center</InputLabel>
                  <Select label="Select Asset / Work Center" value={selectedWorkCenter} onChange={(e) => setSelectedWorkCenter(e.target.value)}>
                    {workCenters.map((wc) => (
                      <MenuItem key={wc.id} value={wc.id}>
                        {wc.code} — {wc.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          {createStep === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Work Order Type</InputLabel>
                  <Select label="Work Order Type" defaultValue="CORRECTIVE">
                    <MenuItem value="BREAKDOWN">Breakdown (Emergency)</MenuItem>
                    <MenuItem value="CORRECTIVE">Corrective</MenuItem>
                    <MenuItem value="PM">Preventive Maintenance</MenuItem>
                    <MenuItem value="PROJECT">Project / Improvement</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Problem Category</InputLabel>
                  <Select label="Problem Category" defaultValue="">
                    <MenuItem value="mechanical">Mechanical</MenuItem>
                    <MenuItem value="electrical">Electrical</MenuItem>
                    <MenuItem value="hydraulic">Hydraulic</MenuItem>
                    <MenuItem value="pneumatic">Pneumatic</MenuItem>
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
                />
              </Grid>
            </Grid>
          )}

          {createStep === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Work Center"
                  value={(() => { const wc = workCenters.find(w => w.id === selectedWorkCenter); return wc ? `${wc.code} — ${wc.name}` : 'Not selected'; })()}
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiInputBase-input': { color: 'text.primary' } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select label="Priority" defaultValue="NORMAL">
                    <MenuItem value="EMERGENCY">Emergency</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="NORMAL">Normal</MenuItem>
                    <MenuItem value="LOW">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Assign To</InputLabel>
                  <Select label="Assign To" defaultValue="">
                    <MenuItem value="mike">Mike Johnson</MenuItem>
                    <MenuItem value="tom">Tom Davis</MenuItem>
                    <MenuItem value="sarah">Sarah Williams</MenuItem>
                    <MenuItem value="external">External Contractor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth type="number" label="Estimated Hours" defaultValue={2} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth type="date" label="Target Date" InputLabelProps={{ shrink: true }} />
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
                <FormControlLabel control={<Checkbox />} label="LOTO (Lockout/Tagout) Required" />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel control={<Checkbox />} label="Hot Work Permit Required" />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel control={<Checkbox />} label="Confined Space Entry Required" />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel control={<Checkbox />} label="Work at Height - Fall Protection Required" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={2} label="Additional Safety Notes" />
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
                  <Typography variant="body1" sx={{ mb: 2 }}>SAW-JKS-001 - DoALL C-916 Band Saw</Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Type & Priority</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip label="CORRECTIVE" color="warning" size="small" />
                    <Chip label="NORMAL" color="primary" size="small" />
                  </Box>

                  <Typography variant="subtitle2" color="text.secondary">Assigned To</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>Mike Johnson</Typography>

                  <Typography variant="subtitle2" color="text.secondary">Safety Requirements</Typography>
                  <Typography variant="body1">LOTO Required</Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowCreateDialog(false); setCreateStep(0); }}>Cancel</Button>
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
              onClick={() => { setShowCreateDialog(false); setCreateStep(0); alert('Work order created!'); }}
            >
              Create Work Order
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkOrderCenter;
