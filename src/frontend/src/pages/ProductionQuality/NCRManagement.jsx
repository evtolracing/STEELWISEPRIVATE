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
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  Add,
  Search,
  Warning,
  Edit,
  Visibility,
  Assignment,
  CheckCircle,
  Cancel,
  Build,
  Delete,
  LocalShipping,
  History,
  AttachFile,
  Comment,
} from '@mui/icons-material';

// Mock Data
const ncrs = [
  { 
    id: 'NCR-2026-0142', 
    defectType: 'Dimension Out of Spec', 
    severity: 'MAJOR', 
    job: 'JOB-2026-0542', 
    status: 'INVESTIGATING',
    disposition: null,
    age: '2 days',
    quantity: 5,
    description: 'OD measured 2.510" vs spec 2.498-2.502"',
    workCenter: 'LATHE-01',
    createdBy: 'QC-Smith',
    createdAt: '2026-02-02 09:30 AM',
  },
  { 
    id: 'NCR-2026-0141', 
    defectType: 'Surface Defect', 
    severity: 'MINOR', 
    job: 'JOB-2026-0538', 
    status: 'DISPOSITION_SET',
    disposition: 'REWORK',
    age: '3 days',
    quantity: 2,
    description: 'Visible scratch on finished surface',
    workCenter: 'GRIND-01',
    createdBy: 'QC-Johnson',
    createdAt: '2026-02-01 02:15 PM',
  },
  { 
    id: 'NCR-2026-0140', 
    defectType: 'Material Defect', 
    severity: 'CRITICAL', 
    job: 'JOB-2026-0535', 
    status: 'OPEN',
    disposition: null,
    age: '4 days',
    quantity: 50,
    description: 'Wrong material grade - received 4140 instead of 4340',
    workCenter: 'RECEIVING',
    createdBy: 'QC-Williams',
    createdAt: '2026-01-30 10:00 AM',
  },
  { 
    id: 'NCR-2026-0139', 
    defectType: 'Dimension Out of Spec', 
    severity: 'MAJOR', 
    job: 'JOB-2026-0530', 
    status: 'ACTION_TAKEN',
    disposition: 'REWORK',
    age: '5 days',
    quantity: 10,
    description: 'Length short by 0.015"',
    workCenter: 'SAW-02',
    createdBy: 'QC-Smith',
    createdAt: '2026-01-29 08:45 AM',
  },
  { 
    id: 'NCR-2026-0138', 
    defectType: 'Hardness Out of Spec', 
    severity: 'MAJOR', 
    job: 'JOB-2026-0528', 
    status: 'CLOSED',
    disposition: 'SCRAP',
    age: '7 days',
    quantity: 3,
    description: 'Hardness measured 52 HRC vs spec 58-62 HRC',
    workCenter: 'HT-01',
    createdBy: 'QC-Johnson',
    createdAt: '2026-01-27 11:30 AM',
    closedAt: '2026-01-28 03:00 PM',
  },
];

const defectTypes = [
  'Dimension Out of Spec',
  'Surface Defect',
  'Material Defect',
  'Hardness Out of Spec',
  'Wrong Alloy',
  'Burrs/Sharp Edges',
  'Crack/Fracture',
  'Corrosion/Rust',
  'Documentation Error',
  'Other',
];

const NCRManagement = () => {
  const [tab, setTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNCR, setSelectedNCR] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDispositionDialog, setShowDispositionDialog] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'error';
      case 'INVESTIGATING': return 'warning';
      case 'DISPOSITION_SET': return 'info';
      case 'ACTION_TAKEN': return 'primary';
      case 'PENDING_VERIFICATION': return 'secondary';
      case 'VERIFIED': return 'success';
      case 'CLOSED': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'OPEN': return 'Open';
      case 'INVESTIGATING': return 'Investigating';
      case 'DISPOSITION_SET': return 'Disposition Set';
      case 'ACTION_TAKEN': return 'Action Taken';
      case 'PENDING_VERIFICATION': return 'Pending Verification';
      case 'VERIFIED': return 'Verified';
      case 'CLOSED': return 'Closed';
      default: return status;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'MAJOR': return 'warning';
      case 'MINOR': return 'default';
      default: return 'default';
    }
  };

  const getDispositionLabel = (disposition) => {
    switch (disposition) {
      case 'USE_AS_IS': return 'Use As-Is';
      case 'REWORK': return 'Rework';
      case 'REPAIR': return 'Repair';
      case 'SCRAP': return 'Scrap';
      case 'RETURN_TO_SUPPLIER': return 'Return to Supplier';
      case 'SORT': return 'Sort (100% Inspection)';
      default: return disposition || '—';
    }
  };

  const ncrSteps = ['Open', 'Investigating', 'Disposition Set', 'Action Taken', 'Verified', 'Closed'];

  const getActiveStep = (status) => {
    switch (status) {
      case 'OPEN': return 0;
      case 'INVESTIGATING': return 1;
      case 'DISPOSITION_SET': return 2;
      case 'ACTION_TAKEN': return 3;
      case 'PENDING_VERIFICATION': return 4;
      case 'VERIFIED': return 4;
      case 'CLOSED': return 5;
      default: return 0;
    }
  };

  const filteredNCRs = ncrs.filter(ncr => {
    if (tab === 0 && ncr.status === 'CLOSED') return false;
    if (tab === 1 && (ncr.status !== 'OPEN' && ncr.status !== 'INVESTIGATING')) return false;
    if (tab === 2 && ncr.status !== 'DISPOSITION_SET') return false;
    if (tab === 3 && ncr.status !== 'CLOSED') return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return ncr.id.toLowerCase().includes(query) || 
             ncr.job.toLowerCase().includes(query) ||
             ncr.defectType.toLowerCase().includes(query);
    }
    return true;
  });

  const openCount = ncrs.filter(n => n.status !== 'CLOSED').length;
  const pendingDisposition = ncrs.filter(n => n.status === 'OPEN' || n.status === 'INVESTIGATING').length;
  const inProgress = ncrs.filter(n => n.status === 'DISPOSITION_SET' || n.status === 'ACTION_TAKEN').length;

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Nonconformance Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track, investigate, and resolve quality nonconformances
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setShowCreateDialog(true)}>
          Create NCR
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'error.light' }}>
                <Warning sx={{ color: 'error.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{openCount}</Typography>
                <Typography variant="body2" color="text.secondary">Open NCRs</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.light' }}>
                <Assignment sx={{ color: 'warning.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{pendingDisposition}</Typography>
                <Typography variant="body2" color="text.secondary">Pending Disposition</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.light' }}>
                <Build sx={{ color: 'info.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>{inProgress}</Typography>
                <Typography variant="body2" color="text.secondary">In Progress</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'grey.200' }}>
                <Typography sx={{ color: 'text.secondary', fontWeight: 700 }}>1.8</Typography>
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>Days</Typography>
                <Typography variant="body2" color="text.secondary">Avg Resolution Time</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label={`All Open (${openCount})`} />
          <Tab label={`Pending Disposition (${pendingDisposition})`} />
          <Tab label={`In Progress (${inProgress})`} />
          <Tab label="Closed" />
        </Tabs>
      </Paper>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by NCR number, job, defect type..."
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
      </Paper>

      {/* NCR Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>NCR Number</TableCell>
                <TableCell>Defect Type</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Job / Work Center</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Disposition</TableCell>
                <TableCell>Age</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredNCRs.map((ncr) => (
                <TableRow 
                  key={ncr.id} 
                  hover 
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setSelectedNCR(ncr)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="primary.main">
                      {ncr.id}
                    </Typography>
                  </TableCell>
                  <TableCell>{ncr.defectType}</TableCell>
                  <TableCell>
                    <Chip label={ncr.severity} size="small" color={getSeverityColor(ncr.severity)} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{ncr.job}</Typography>
                    <Typography variant="caption" color="text.secondary">{ncr.workCenter}</Typography>
                  </TableCell>
                  <TableCell>{ncr.quantity}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusLabel(ncr.status)} 
                      size="small" 
                      color={getStatusColor(ncr.status)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{getDispositionLabel(ncr.disposition)}</TableCell>
                  <TableCell>{ncr.age}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelectedNCR(ncr); }}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    {ncr.status !== 'CLOSED' && (
                      <Tooltip title="Set Disposition">
                        <IconButton 
                          size="small" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedNCR(ncr);
                            setShowDispositionDialog(true); 
                          }}
                        >
                          <Edit />
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

      {/* NCR Detail Dialog */}
      <Dialog open={!!selectedNCR && !showDispositionDialog} onClose={() => setSelectedNCR(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Warning color={getSeverityColor(selectedNCR?.severity)} />
              <Typography variant="h6">{selectedNCR?.id}</Typography>
              <Chip 
                label={selectedNCR?.severity} 
                size="small" 
                color={getSeverityColor(selectedNCR?.severity)} 
              />
            </Box>
            <Chip 
              label={getStatusLabel(selectedNCR?.status)} 
              color={getStatusColor(selectedNCR?.status)}
            />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedNCR && (
            <Box>
              {/* Status Stepper */}
              <Stepper activeStep={getActiveStep(selectedNCR.status)} sx={{ mb: 3 }}>
                {ncrSteps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* NCR Details */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Defect Type</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{selectedNCR.defectType}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">Quantity Affected</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{selectedNCR.quantity}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">Work Center</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{selectedNCR.workCenter}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {selectedNCR.description}
                  </Alert>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Job</Typography>
                  <Typography variant="body1">{selectedNCR.job}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                  <Typography variant="body1">{selectedNCR.createdAt} by {selectedNCR.createdBy}</Typography>
                </Grid>
                {selectedNCR.disposition && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Disposition</Typography>
                      <Chip 
                        label={getDispositionLabel(selectedNCR.disposition)} 
                        color="primary" 
                        sx={{ mt: 1 }}
                      />
                    </Grid>
                  </>
                )}
              </Grid>

              {/* Activity Timeline */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Activity Timeline</Typography>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'error.light', width: 32, height: 32 }}>
                      <Warning sx={{ color: 'error.main', fontSize: 18 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary="NCR Created"
                    secondary={`${selectedNCR.createdAt} by ${selectedNCR.createdBy}`}
                  />
                </ListItem>
                {selectedNCR.status !== 'OPEN' && (
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'info.light', width: 32, height: 32 }}>
                        <Search sx={{ color: 'info.main', fontSize: 18 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary="Investigation Started"
                      secondary="Root cause analysis in progress"
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedNCR(null)}>Close</Button>
          {selectedNCR?.status !== 'CLOSED' && (
            <Button 
              variant="contained" 
              onClick={() => setShowDispositionDialog(true)}
            >
              Set Disposition
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Disposition Dialog */}
      <Dialog open={showDispositionDialog} onClose={() => setShowDispositionDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Set Disposition - {selectedNCR?.id}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {selectedNCR && (
              <Alert severity="info" sx={{ mb: 3 }}>
                {selectedNCR.description}
              </Alert>
            )}
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Disposition</InputLabel>
                  <Select label="Disposition" defaultValue="">
                    <MenuItem value="USE_AS_IS">Use As-Is</MenuItem>
                    <MenuItem value="REWORK">Rework</MenuItem>
                    <MenuItem value="REPAIR">Repair</MenuItem>
                    <MenuItem value="SCRAP">Scrap</MenuItem>
                    <MenuItem value="RETURN_TO_SUPPLIER">Return to Supplier</MenuItem>
                    <MenuItem value="SORT">Sort (100% Inspection)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quantity Affected"
                  type="number"
                  defaultValue={selectedNCR?.quantity}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Root Cause Analysis"
                  placeholder="Describe the root cause of the nonconformance..."
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Disposition Notes / Justification"
                  placeholder="Provide justification for the selected disposition..."
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Estimated Cost Impact"
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Alert severity="warning">
                  "Use As-Is" disposition requires Quality Manager approval before closure.
                </Alert>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDispositionDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              setShowDispositionDialog(false);
              setSelectedNCR(null);
              alert('Disposition saved successfully!');
            }}
          >
            Set Disposition
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create NCR Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New NCR</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Job Number" placeholder="JOB-2026-XXXX" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Work Center" placeholder="LATHE-01" />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Defect Type</InputLabel>
                <Select label="Defect Type" defaultValue="">
                  {defectTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select label="Severity" defaultValue="MAJOR">
                  <MenuItem value="MINOR">Minor</MenuItem>
                  <MenuItem value="MAJOR">Major</MenuItem>
                  <MenuItem value="CRITICAL">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Quantity Affected" type="number" defaultValue={1} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Lot/Heat Number" placeholder="LOT-2026-XXXX" />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                placeholder="Describe the nonconformance in detail..."
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" startIcon={<AttachFile />}>
                Attach Photos/Documents
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setShowCreateDialog(false);
              alert('NCR created successfully!');
            }}
          >
            Create NCR
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NCRManagement;
