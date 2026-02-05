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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  LinearProgress,
  Avatar,
  Tooltip,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Search,
  Schedule,
  CheckCircle,
  Warning,
  CalendarMonth,
  Visibility,
  Edit,
  ContentCopy,
  Refresh,
  Today,
  EventRepeat,
  Timer,
  Settings,
  PlayArrow,
} from '@mui/icons-material';

// Mock Data
const pmSchedules = [
  {
    id: 'PM-001',
    name: 'Weekly Saw Inspection',
    template: 'SAW-WEEKLY',
    assets: ['SAW-01', 'SAW-02', 'SAW-03'],
    frequency: 'Weekly',
    nextDue: '2026-02-10',
    lastCompleted: '2026-02-03',
    estimatedHours: 1,
    assignedTo: 'Mike Johnson',
    compliance: 95,
    status: 'ON_SCHEDULE',
  },
  {
    id: 'PM-002',
    name: 'Monthly Forklift Service',
    template: 'FORKLIFT-MONTHLY',
    assets: ['FORKLIFT-01', 'FORKLIFT-02', 'FORKLIFT-03'],
    frequency: 'Monthly',
    nextDue: '2026-02-15',
    lastCompleted: '2026-01-15',
    estimatedHours: 2,
    assignedTo: 'Tom Davis',
    compliance: 100,
    status: 'ON_SCHEDULE',
  },
  {
    id: 'PM-003',
    name: 'Quarterly Crane Inspection',
    template: 'CRANE-QUARTERLY',
    assets: ['CRANE-01', 'CRANE-02'],
    frequency: 'Quarterly',
    nextDue: '2026-03-01',
    lastCompleted: '2025-12-01',
    estimatedHours: 4,
    assignedTo: 'External - SafetyFirst Inc.',
    compliance: 100,
    status: 'ON_SCHEDULE',
  },
  {
    id: 'PM-004',
    name: 'Daily Compressor Check',
    template: 'COMPRESSOR-DAILY',
    assets: ['COMP-01'],
    frequency: 'Daily',
    nextDue: '2026-02-05',
    lastCompleted: '2026-02-04',
    estimatedHours: 0.5,
    assignedTo: 'Shift Operator',
    compliance: 98,
    status: 'ON_SCHEDULE',
  },
  {
    id: 'PM-005',
    name: 'Annual Electrical Panel Inspection',
    template: 'ELECTRICAL-ANNUAL',
    assets: ['PANEL-MAIN', 'PANEL-SHOP1', 'PANEL-SHOP2'],
    frequency: 'Annual',
    nextDue: '2026-02-01',
    lastCompleted: '2025-02-01',
    estimatedHours: 8,
    assignedTo: 'External - ElectroPro LLC',
    compliance: 100,
    status: 'OVERDUE',
  },
  {
    id: 'PM-006',
    name: 'Bi-Weekly Router Calibration',
    template: 'ROUTER-BIWEEKLY',
    assets: ['ROUTER-01', 'ROUTER-02'],
    frequency: 'Bi-Weekly',
    nextDue: '2026-02-08',
    lastCompleted: '2026-01-25',
    estimatedHours: 1.5,
    assignedTo: 'Sarah Williams',
    compliance: 88,
    status: 'DUE_SOON',
  },
];

const pmTemplates = [
  {
    id: 'SAW-WEEKLY',
    name: 'Weekly Saw Inspection',
    category: 'Cutting Equipment',
    tasks: [
      'Inspect blade tension and condition',
      'Check coolant level and quality',
      'Verify blade guide alignment',
      'Clean chip tray and work area',
      'Check emergency stop function',
      'Verify guard operation',
    ],
    partsRequired: ['Blade Cleaner Spray', 'Coolant Sample Kit'],
    estimatedHours: 1,
    skillLevel: 'Standard',
  },
  {
    id: 'FORKLIFT-MONTHLY',
    name: 'Monthly Forklift Service',
    category: 'Material Handling',
    tasks: [
      'Check engine oil level and condition',
      'Inspect hydraulic fluid level',
      'Check tire condition and pressure',
      'Test horn, lights, and backup alarm',
      'Inspect forks for damage',
      'Check seat belt operation',
      'Lubricate mast and carriage',
    ],
    partsRequired: ['Engine Oil Filter', 'Hydraulic Fluid', 'Grease Cartridge'],
    estimatedHours: 2,
    skillLevel: 'Standard',
  },
  {
    id: 'CRANE-QUARTERLY',
    name: 'Quarterly Crane Inspection',
    category: 'Lifting Equipment',
    tasks: [
      'Visual inspection of wire rope',
      'Check hook and latch condition',
      'Test limit switches',
      'Inspect pendant controls',
      'Check bridge and trolley wheels',
      'Verify load test compliance',
    ],
    partsRequired: ['Wire Rope Lubricant'],
    estimatedHours: 4,
    skillLevel: 'Specialized',
    certificationRequired: 'Crane Inspection Certification',
  },
];

const PMSchedules = () => {
  const [tab, setTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPM, setSelectedPM] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ON_SCHEDULE': return 'success';
      case 'DUE_SOON': return 'warning';
      case 'OVERDUE': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ON_SCHEDULE': return 'On Schedule';
      case 'DUE_SOON': return 'Due Soon';
      case 'OVERDUE': return 'Overdue';
      default: return status;
    }
  };

  const getComplianceColor = (compliance) => {
    if (compliance >= 95) return 'success';
    if (compliance >= 80) return 'warning';
    return 'error';
  };

  const filteredSchedules = pmSchedules.filter(pm => {
    if (tab === 1 && pm.status !== 'OVERDUE') return false;
    if (tab === 2 && pm.status !== 'DUE_SOON') return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return pm.name.toLowerCase().includes(query) || 
             pm.template.toLowerCase().includes(query);
    }
    return true;
  });

  const overdueCount = pmSchedules.filter(p => p.status === 'OVERDUE').length;
  const dueSoonCount = pmSchedules.filter(p => p.status === 'DUE_SOON').length;
  const avgCompliance = Math.round(pmSchedules.reduce((acc, p) => acc + p.compliance, 0) / pmSchedules.length);

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            PM Schedules
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Preventive maintenance scheduling and compliance tracking
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<CalendarMonth />}>
            Calendar View
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setShowCreateDialog(true)}>
            New PM Schedule
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {overdueCount > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>{overdueCount} PM schedule(s) overdue</strong> - immediate attention required
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.light' }}>
                <Schedule sx={{ color: 'primary.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{pmSchedules.length}</Typography>
                <Typography variant="body2" color="text.secondary">Active Schedules</Typography>
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
                <Typography variant="h5" fontWeight={700}>{overdueCount}</Typography>
                <Typography variant="body2" color="text.secondary">Overdue</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.light' }}>
                <Today sx={{ color: 'warning.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{dueSoonCount}</Typography>
                <Typography variant="body2" color="text.secondary">Due This Week</Typography>
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
                <Typography variant="h5" fontWeight={700}>{avgCompliance}%</Typography>
                <Typography variant="body2" color="text.secondary">Avg Compliance</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label={`All Schedules (${pmSchedules.length})`} />
          <Tab label={`Overdue (${overdueCount})`} />
          <Tab label={`Due Soon (${dueSoonCount})`} />
          <Tab label="Templates" />
        </Tabs>
      </Paper>

      {/* Search */}
      {tab !== 3 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search schedules..."
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
                <InputLabel>Frequency</InputLabel>
                <Select label="Frequency" defaultValue="">
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Daily">Daily</MenuItem>
                  <MenuItem value="Weekly">Weekly</MenuItem>
                  <MenuItem value="Monthly">Monthly</MenuItem>
                  <MenuItem value="Quarterly">Quarterly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Assigned To</InputLabel>
                <Select label="Assigned To" defaultValue="">
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Mike Johnson">Mike Johnson</MenuItem>
                  <MenuItem value="Tom Davis">Tom Davis</MenuItem>
                  <MenuItem value="External">External</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Schedules Table */}
      {tab !== 3 && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>PM Schedule</TableCell>
                  <TableCell>Assets</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Next Due</TableCell>
                  <TableCell>Last Completed</TableCell>
                  <TableCell>Compliance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSchedules.map((pm) => (
                  <TableRow 
                    key={pm.id} 
                    hover 
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setSelectedPM(pm)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{pm.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Template: {pm.template}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {pm.assets.slice(0, 2).map(asset => (
                          <Chip key={asset} label={asset} size="small" variant="outlined" />
                        ))}
                        {pm.assets.length > 2 && (
                          <Chip label={`+${pm.assets.length - 2}`} size="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        icon={<EventRepeat />} 
                        label={pm.frequency} 
                        size="small" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={pm.status === 'OVERDUE' ? 'error.main' : 'text.primary'}
                        fontWeight={pm.status === 'OVERDUE' ? 600 : 400}
                      >
                        {pm.nextDue}
                      </Typography>
                    </TableCell>
                    <TableCell>{pm.lastCompleted}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={pm.compliance} 
                          color={getComplianceColor(pm.compliance)}
                          sx={{ width: 60, height: 8, borderRadius: 1 }}
                        />
                        <Typography variant="body2">{pm.compliance}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusLabel(pm.status)} 
                        size="small" 
                        color={getStatusColor(pm.status)} 
                      />
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => setSelectedPM(pm)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Generate WO">
                        <IconButton size="small" color="primary">
                          <PlayArrow />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Templates Tab */}
      {tab === 3 && (
        <Grid container spacing={3}>
          {pmTemplates.map((template) => (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>{template.name}</Typography>
                      <Chip label={template.category} size="small" sx={{ mt: 0.5 }} />
                    </Box>
                    <IconButton size="small" onClick={() => setSelectedTemplate(template)}>
                      <Visibility />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Timer fontSize="small" color="action" />
                      <Typography variant="body2">{template.estimatedHours}h</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Settings fontSize="small" color="action" />
                      <Typography variant="body2">{template.skillLevel}</Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {template.tasks.length} tasks • {template.partsRequired.length} parts required
                  </Typography>

                  {template.certificationRequired && (
                    <Alert severity="info" sx={{ py: 0.5 }}>
                      <Typography variant="caption">
                        Requires: {template.certificationRequired}
                      </Typography>
                    </Alert>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" startIcon={<ContentCopy />}>Duplicate</Button>
                    <Button size="small" startIcon={<Edit />}>Edit</Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* PM Detail Dialog */}
      <Dialog open={!!selectedPM} onClose={() => setSelectedPM(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{selectedPM?.name}</Typography>
            <Chip 
              label={getStatusLabel(selectedPM?.status)} 
              color={getStatusColor(selectedPM?.status)} 
            />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPM && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Schedule Details
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Template" secondary={selectedPM.template} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Frequency" secondary={selectedPM.frequency} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Estimated Hours" secondary={`${selectedPM.estimatedHours} hours`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Assigned To" secondary={selectedPM.assignedTo} />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Covered Assets ({selectedPM.assets.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedPM.assets.map(asset => (
                    <Chip key={asset} label={asset} variant="outlined" />
                  ))}
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Compliance Rate
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={selectedPM.compliance} 
                      color={getComplianceColor(selectedPM.compliance)}
                      sx={{ width: 150, height: 10, borderRadius: 1 }}
                    />
                    <Typography variant="h6">{selectedPM.compliance}%</Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Alert severity={selectedPM.status === 'OVERDUE' ? 'error' : 'info'}>
                  Next Due: <strong>{selectedPM.nextDue}</strong> | Last Completed: <strong>{selectedPM.lastCompleted}</strong>
                </Alert>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPM(null)}>Close</Button>
          <Button variant="contained" startIcon={<PlayArrow />}>
            Generate Work Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Detail Dialog */}
      <Dialog open={!!selectedTemplate} onClose={() => setSelectedTemplate(null)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedTemplate?.name}</DialogTitle>
        <DialogContent dividers>
          {selectedTemplate && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Task Checklist
                </Typography>
                <List dense>
                  {selectedTemplate.tasks.map((task, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Checkbox disabled />
                      </ListItemIcon>
                      <ListItemText primary={task} />
                    </ListItem>
                  ))}
                </List>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Required Parts
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedTemplate.partsRequired.map((part, index) => (
                    <Chip key={index} label={part} variant="outlined" />
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Estimated Time
                    </Typography>
                    <Typography variant="body1">{selectedTemplate.estimatedHours} hours</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Skill Level
                    </Typography>
                    <Typography variant="body1">{selectedTemplate.skillLevel}</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTemplate(null)}>Close</Button>
          <Button variant="outlined" startIcon={<ContentCopy />}>Duplicate</Button>
          <Button variant="contained" startIcon={<Edit />}>Edit Template</Button>
        </DialogActions>
      </Dialog>

      {/* Create PM Schedule Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create PM Schedule</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Schedule Name" placeholder="e.g., Weekly Saw Inspection" />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Template</InputLabel>
                <Select label="Template" defaultValue="">
                  {pmTemplates.map(t => (
                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select label="Frequency" defaultValue="Weekly">
                  <MenuItem value="Daily">Daily</MenuItem>
                  <MenuItem value="Weekly">Weekly</MenuItem>
                  <MenuItem value="Bi-Weekly">Bi-Weekly</MenuItem>
                  <MenuItem value="Monthly">Monthly</MenuItem>
                  <MenuItem value="Quarterly">Quarterly</MenuItem>
                  <MenuItem value="Annual">Annual</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth type="date" label="Start Date" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Assign To</InputLabel>
                <Select label="Assign To" defaultValue="">
                  <MenuItem value="Mike Johnson">Mike Johnson</MenuItem>
                  <MenuItem value="Tom Davis">Tom Davis</MenuItem>
                  <MenuItem value="Sarah Williams">Sarah Williams</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Select Assets</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {['SAW-01', 'SAW-02', 'SAW-03', 'ROUTER-01', 'FORKLIFT-01'].map(asset => (
                  <FormControlLabel
                    key={asset}
                    control={<Checkbox size="small" />}
                    label={asset}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Auto-generate work orders when due"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => { setShowCreateDialog(false); alert('PM Schedule created!'); }}
          >
            Create Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PMSchedules;
